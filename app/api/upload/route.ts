import { promises as fs } from "fs";
import path from "path";
import {
  SLUG_RE,
  siteDir,
  readMeta,
  writeMeta,
  hashPassword,
  verifyPassword,
  cleanRelativePath,
} from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 100) * 1024 * 1024;
const MAX_FILES = 1000;

function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("업로드 데이터를 읽지 못했습니다.");
  }

  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const title = String(form.get("title") ?? "").trim().slice(0, 80);
  const author = String(form.get("author") ?? "").trim().slice(0, 40);
  const password = String(form.get("password") ?? "");
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const paths = form.getAll("paths").map(String);

  if (!SLUG_RE.test(slug)) return fail("주소는 영문 소문자, 숫자, 하이픈(-)만 2~40자로 입력하세요.");
  if (!author) return fail("이름을 입력하세요.");
  if (password.length < 4) return fail("비밀번호는 4자 이상이어야 합니다.");
  if (files.length === 0 || files.length !== paths.length) return fail("폴더를 선택하세요.");
  if (files.length > MAX_FILES) return fail(`파일은 최대 ${MAX_FILES}개까지 올릴 수 있습니다.`);

  const existing = await readMeta(slug);
  if (existing && !verifyPassword(password, existing.passwordHash)) {
    return fail("이미 사용 중인 주소입니다. 내 사이트라면 처음 올릴 때 쓴 비밀번호를 입력하세요.", 403);
  }

  // 경로 정리 + 선택한 최상위 폴더 이름 제거 (예: "my-site/index.html" -> "index.html")
  let entries = files
    .map((file, i) => ({ file, rel: cleanRelativePath(paths[i]) }))
    .filter((e): e is { file: File; rel: string } => e.rel !== null);

  const tops = new Set(entries.map((e) => e.rel.split("/")[0]));
  if (tops.size === 1 && entries.every((e) => e.rel.includes("/"))) {
    entries = entries.map((e) => ({ ...e, rel: e.rel.slice(e.rel.indexOf("/") + 1) }));
  }

  // Index.html, INDEX.HTML 등도 index.html로 통일
  entries = entries.map((e) => (e.rel.toLowerCase() === "index.html" ? { ...e, rel: "index.html" } : e));
  if (!entries.some((e) => e.rel === "index.html")) {
    return fail("폴더 바로 안에 index.html 파일이 있어야 합니다.");
  }

  const total = entries.reduce((sum, e) => sum + e.file.size, 0);
  if (total > MAX_BYTES) return fail(`전체 용량은 ${MAX_BYTES / 1024 / 1024}MB 이하여야 합니다.`);

  // 임시 폴더에 다 쓴 뒤 교체 → 업로드 도중 사이트가 반쯤 깨진 상태로 보이지 않음
  const dir = siteDir(slug);
  const tmp = `${dir}.uploading-${Date.now()}`;
  try {
    for (const { file, rel } of entries) {
      const target = path.join(tmp, rel);
      if (!target.startsWith(tmp + path.sep)) throw new Error("bad path");
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, Buffer.from(await file.arrayBuffer()));
    }
    const old = `${dir}.old-${Date.now()}`;
    const hadOld = await fs.rename(dir, old).then(() => true, () => false);
    await fs.rename(tmp, dir);
    if (hadOld) await fs.rm(old, { recursive: true, force: true });
  } catch (err) {
    await fs.rm(tmp, { recursive: true, force: true });
    console.error(err);
    return fail("파일 저장 중 오류가 발생했습니다.", 500);
  }

  const now = new Date().toISOString();
  await writeMeta({
    slug,
    title: title || slug,
    author,
    fileCount: entries.length,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    passwordHash: existing?.passwordHash ?? hashPassword(password),
  });

  return Response.json({ ok: true, url: `/sites/${slug}/` });
}

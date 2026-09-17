import { promises as fs } from "fs";
import path from "path";
import { siteDir, readMeta, verifyPassword, cleanRelativePath, type SiteMeta } from "@/lib/storage";

const MAX_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 100) * 1024 * 1024;
const MAX_FILES = 1000;

export class SiteError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof SiteError) return Response.json({ error: err.message }, { status: err.status });
  console.error(err);
  return Response.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
}

export function readFiles(form: FormData) {
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const paths = form.getAll("paths").map(String);
  if (files.length !== paths.length) throw new SiteError("파일 정보가 올바르지 않습니다.");
  return { files, paths };
}

/** 폴더 파일을 검사해 사이트 폴더를 통째로 교체한다. 저장된 파일 수를 돌려준다. */
export async function replaceSiteFiles(slug: string, files: File[], paths: string[]) {
  if (files.length === 0) throw new SiteError("폴더를 선택하세요.");
  if (files.length > MAX_FILES) throw new SiteError(`파일은 최대 ${MAX_FILES}개까지 올릴 수 있습니다.`);

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
    throw new SiteError("폴더 바로 안에 index.html 파일이 있어야 합니다.");
  }

  const total = entries.reduce((sum, e) => sum + e.file.size, 0);
  if (total > MAX_BYTES) throw new SiteError(`전체 용량은 ${MAX_BYTES / 1024 / 1024}MB 이하여야 합니다.`);

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
    throw new SiteError("파일 저장 중 오류가 발생했습니다.", 500);
  }

  return entries.length;
}

// 비밀번호 무작위 대입 방지: 사이트별로 10분에 10번까지만 틀릴 수 있다.
const MAX_FAILS = 10;
const LOCK_MS = 10 * 60 * 1000;
const fails = new Map<string, { count: number; resetAt: number }>();

export async function authorize(slug: string, password: string): Promise<SiteMeta> {
  const meta = await readMeta(slug);
  if (!meta) throw new SiteError("사이트를 찾을 수 없습니다.", 404);

  const now = Date.now();
  let record = fails.get(slug);
  if (record && record.resetAt < now) {
    fails.delete(slug);
    record = undefined;
  }
  if (record && record.count >= MAX_FAILS) {
    throw new SiteError("비밀번호를 너무 많이 틀렸어요. 10분 뒤에 다시 시도하세요.", 429);
  }

  if (!password || !verifyPassword(password, meta.passwordHash)) {
    fails.set(slug, { count: (record?.count ?? 0) + 1, resetAt: record?.resetAt ?? now + LOCK_MS });
    throw new SiteError("비밀번호가 맞지 않습니다.", 403);
  }

  fails.delete(slug);
  return meta;
}

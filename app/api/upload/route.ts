import { SLUG_RE, readMeta, writeMeta, hashPassword } from "@/lib/storage";
import { SiteError, errorResponse, readFiles, replaceSiteFiles } from "@/lib/sites";

export const runtime = "nodejs";

// 새 사이트 등록 전용. 기존 사이트 수정은 /api/sites/[slug] 에서 한다.
export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => {
      throw new SiteError("업로드 데이터를 읽지 못했습니다.");
    });

    const slug = String(form.get("slug") ?? "").trim().toLowerCase();
    const title = String(form.get("title") ?? "").trim().slice(0, 80);
    const author = String(form.get("author") ?? "").trim().slice(0, 40);
    const password = String(form.get("password") ?? "");
    const { files, paths } = readFiles(form);

    if (!SLUG_RE.test(slug)) throw new SiteError("주소는 영문 소문자, 숫자, 하이픈(-)만 2~40자로 입력하세요.");
    if (!author) throw new SiteError("이름을 입력하세요.");
    if (password.length < 4) throw new SiteError("비밀번호는 4자 이상이어야 합니다.");
    if (await readMeta(slug)) {
      throw new SiteError("이미 사용 중인 주소입니다. 내 사이트를 고치려면 갤러리에서 '수정하기'를 누르세요.", 409);
    }

    const fileCount = await replaceSiteFiles(slug, files, paths);

    const now = new Date().toISOString();
    await writeMeta({
      slug,
      title: title || slug,
      author,
      fileCount,
      createdAt: now,
      updatedAt: now,
      passwordHash: hashPassword(password),
    });

    return Response.json({ ok: true, url: `/sites/${slug}/` });
  } catch (err) {
    return errorResponse(err);
  }
}

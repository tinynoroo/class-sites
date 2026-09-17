import { writeMeta } from "@/lib/storage";
import { SiteError, authorize, errorResponse, readFiles, replaceSiteFiles } from "@/lib/sites";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

// intent=verify : 비밀번호만 확인하고 현재 정보를 돌려준다.
// intent=update : 제목과(선택) 파일을 바꾼다. 주소·이름·비밀번호는 바꿀 수 없다.
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const form = await req.formData().catch(() => {
      throw new SiteError("요청 데이터를 읽지 못했습니다.");
    });
    const meta = await authorize(slug, String(form.get("password") ?? ""));

    if (form.get("intent") !== "update") {
      return Response.json({
        slug: meta.slug,
        title: meta.title,
        author: meta.author,
        fileCount: meta.fileCount,
        updatedAt: meta.updatedAt,
      });
    }

    const title = String(form.get("title") ?? "").trim().slice(0, 80);
    if (!title) throw new SiteError("사이트 제목을 입력하세요.");

    const { files, paths } = readFiles(form);
    const fileCount = files.length > 0 ? await replaceSiteFiles(slug, files, paths) : meta.fileCount;

    await writeMeta({ ...meta, title, fileCount, updatedAt: new Date().toISOString() });
    return Response.json({ ok: true, url: `/sites/${slug}/` });
  } catch (err) {
    return errorResponse(err);
  }
}

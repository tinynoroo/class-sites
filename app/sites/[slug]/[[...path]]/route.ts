import { promises as fs } from "fs";
import path from "path";
import { SLUG_RE, siteDir, mimeType } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; path?: string[] }> };

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function findFile(root: string, rel: string): Promise<string | null> {
  const target = path.resolve(root, rel);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  const stat = await fs.stat(target).catch(() => null);
  if (stat?.isFile()) return target;
  if (stat?.isDirectory()) return findFile(root, path.join(rel, "index.html"));
  return null;
}

export async function GET(req: Request, { params }: Ctx) {
  const { slug, path: segments = [] } = await params;
  if (!SLUG_RE.test(slug)) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const rel = segments.map(safeDecode).join("/");

  // /sites/foo 또는 /sites/foo/sub 처럼 폴더를 가리키는데 슬래시가 없으면 붙여서 리다이렉트
  const root = siteDir(slug);
  if (!url.pathname.endsWith("/")) {
    const stat = await fs.stat(path.resolve(root, rel)).catch(() => null);
    if (stat?.isDirectory()) {
      return Response.redirect(new URL(url.pathname + "/" + url.search, url), 308);
    }
  }

  const file = await findFile(root, rel);
  if (!file) {
    const notFound = await findFile(root, "404.html");
    const body = notFound ? await fs.readFile(notFound) : "Not found";
    return new Response(body, {
      status: 404,
      headers: { "Content-Type": notFound ? mimeType(notFound) : "text/plain; charset=utf-8" },
    });
  }

  const body = await fs.readFile(file);
  return new Response(body, {
    headers: {
      "Content-Type": mimeType(file),
      "Cache-Control": "no-cache",
    },
  });
}

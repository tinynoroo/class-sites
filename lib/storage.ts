import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const STORAGE_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.STORAGE_DIR ?? "storage");
const SITES_DIR = path.join(STORAGE_DIR, "sites");
const META_DIR = path.join(STORAGE_DIR, "meta");

export type SiteMeta = {
  slug: string;
  title: string;
  author: string;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
  passwordHash: string;
};

export type PublicSite = Omit<SiteMeta, "passwordHash">;

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export function siteDir(slug: string) {
  return path.join(SITES_DIR, slug);
}

export async function readMeta(slug: string): Promise<SiteMeta | null> {
  if (!SLUG_RE.test(slug)) return null;
  try {
    return JSON.parse(await fs.readFile(path.join(META_DIR, `${slug}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function writeMeta(meta: SiteMeta) {
  await fs.mkdir(META_DIR, { recursive: true });
  const target = path.join(META_DIR, `${meta.slug}.json`);
  await fs.writeFile(`${target}.tmp`, JSON.stringify(meta, null, 2));
  await fs.rename(`${target}.tmp`, target);
}

export async function listSites(): Promise<PublicSite[]> {
  let names: string[];
  try {
    names = await fs.readdir(META_DIR);
  } catch {
    return [];
  }
  const metas = await Promise.all(
    names.filter((n) => n.endsWith(".json")).map((n) => readMeta(n.slice(0, -5)))
  );
  return metas
    .filter((m): m is SiteMeta => m !== null)
    .map(({ passwordHash: _, ...rest }) => rest)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const actual = crypto.scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** 업로드된 상대경로를 안전하게 정리. 위험하거나 불필요한 파일이면 null. */
export function cleanRelativePath(raw: string): string | null {
  const parts = raw.replace(/\\/g, "/").split("/").filter((p) => p !== "" && p !== ".");
  if (parts.length === 0) return null;
  for (const p of parts) {
    if (p === ".." || p.startsWith(".") || p === "node_modules" || p === "__MACOSX") return null;
  }
  const name = parts[parts.length - 1];
  if (name === "Thumbs.db" || name === "desktop.ini") return null;
  return parts.join("/");
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".wasm": "application/wasm",
};

export function mimeType(file: string) {
  return MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

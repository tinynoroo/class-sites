import Link from "next/link";
import { listSites } from "@/lib/storage";

// 매 요청마다 디스크를 읽음 → 업로드 즉시 목록에 반영
export const dynamic = "force-dynamic";

export default async function Home() {
  const sites = await listSites();

  return (
    <main className="container">
      <header className="top">
        <div>
          <h1>우리 반 사이트 모음</h1>
          <p className="muted">총 {sites.length}개</p>
        </div>
        <Link href="/upload" className="button">
          사이트 올리기
        </Link>
      </header>

      {sites.length === 0 ? (
        <p className="empty">아직 올라온 사이트가 없습니다.</p>
      ) : (
        <ul className="grid">
          {sites.map((site) => (
            <li key={site.slug} className="card">
              <a href={`/sites/${site.slug}/`} target="_blank" rel="noopener">
                <div className="preview">
                  <iframe
                    src={`/sites/${site.slug}/`}
                    loading="lazy"
                    tabIndex={-1}
                    aria-hidden
                    sandbox="allow-scripts"
                  />
                </div>
                <div className="info">
                  <strong>{site.title}</strong>
                  <span className="muted">
                    {site.author} · {new Date(site.updatedAt).toLocaleString("ko-KR")}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import Link from "next/link";
import { listSites } from "@/lib/storage";

// 매 요청마다 디스크를 읽음 → 업로드 즉시 목록에 반영
export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  });
}

export default async function Home() {
  const sites = await listSites();

  return (
    <main>
      <div className="sub-nav">
        <div className="sub-nav-inner">
          <span className="sub-nav-title">갤러리</span>
          <div className="sub-nav-actions">
            <span className="meta">사이트 {sites.length}개</span>
            <Link href="/upload" className="btn btn-primary btn-small">
              올리기
            </Link>
          </div>
        </div>
      </div>

      <section className="tile tile-light hero">
        <div className="tile-inner">
          <p className="eyebrow">Class Sites</p>
          <h1 className="hero-display">모두의 첫 홈페이지.</h1>
          <p className="lead">직접 만든 사이트를 올리면, 바로 여기에.</p>
          <div className="cta-row">
            <a href="#gallery" className="btn btn-primary">
              둘러보기
            </a>
            <Link href="/upload" className="btn btn-secondary">
              사이트 올리기
            </Link>
          </div>
        </div>
      </section>

      <section id="gallery" className="tile tile-parchment">
        <div className="tile-inner">
          <div className="gallery-head">
            <div>
              <h2 className="display-lg">갤러리.</h2>
              <p className="caption">
                {sites.length > 0 ? `지금까지 ${sites.length}개의 사이트가 올라왔어요.` : "첫 번째 사이트를 기다리고 있어요."}
              </p>
            </div>
            <Link href="/upload" className="text-link">
              내 사이트 올리기
            </Link>
          </div>

          {sites.length === 0 ? (
            <div className="empty">
              <h3 className="display-lg">아직 비어 있어요.</h3>
              <p>가장 먼저 사이트를 올려 보세요.</p>
              <div className="cta-row">
                <Link href="/upload" className="btn btn-primary">
                  사이트 올리기
                </Link>
              </div>
            </div>
          ) : (
            <ul className="grid">
              {sites.map((site) => (
                <li key={site.slug} className="card">
                  <div className="preview">
                    <iframe
                      src={`/sites/${site.slug}/`}
                      loading="lazy"
                      tabIndex={-1}
                      aria-hidden
                      sandbox="allow-scripts"
                      title={site.title}
                    />
                  </div>
                  <div className="card-body">
                    {/* 카드 전체가 눌리도록 링크 영역을 카드 크기로 늘린다 (.card-link::after) */}
                    <a href={`/sites/${site.slug}/`} target="_blank" rel="noopener" className="card-title card-link">
                      {site.title}
                    </a>
                    <span className="card-meta">
                      {site.author} · {formatDate(site.updatedAt)}
                    </span>
                    <Link href={`/edit/${site.slug}`} className="text-link card-edit">
                      수정하기
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="tile tile-dark on-dark">
        <div className="tile-inner">
          <h2 className="display-lg">세 단계면 충분합니다.</h2>
          <p className="lead">재배포도, 설정도 필요 없어요.</p>
          <ol className="steps">
            <li>
              <div className="step-num">1</div>
              <h3 className="step-title">폴더 준비</h3>
              <p className="step-desc">
                <code>index.html</code>이 폴더 바로 안에 있는지 확인하세요. 파일은 <code>./style.css</code>처럼
                상대 경로로 연결해요.
              </p>
            </li>
            <li>
              <div className="step-num">2</div>
              <h3 className="step-title">폴더째 올리기</h3>
              <p className="step-desc">이름, 주소, 비밀번호를 적고 폴더를 선택하면 끝. 고칠 땐 카드의 '수정하기'를 누르세요.</p>
            </li>
            <li>
              <div className="step-num">3</div>
              <h3 className="step-title">바로 공유</h3>
              <p className="step-desc">올리는 즉시 갤러리에 나타나고, 나만의 주소로 누구에게나 보여줄 수 있어요.</p>
            </li>
          </ol>
          <div className="cta-row">
            <Link href="/upload" className="btn btn-primary">
              지금 올리기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

import type { Metadata, Viewport } from "next";
import Link from "next/link";
// 애플 기기 외에서 한글을 SF Pro 느낌에 가깝게 보여주기 위한 대체 폰트 (CDN 없이 번들)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class Sites",
  description: "수강생들이 직접 만든 사이트를 한곳에서.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="global-nav" aria-label="전체 메뉴">
          <div className="global-nav-inner">
            <Link href="/" className="brand">
              Class Sites
            </Link>
            <div className="links">
              <Link href="/#gallery">갤러리</Link>
              <Link href="/upload">사이트 올리기</Link>
            </div>
          </div>
        </nav>
        {children}
        <footer className="footer">
          <div className="footer-inner">
            <span>수강생들이 직접 만든 사이트를 한곳에서.</span>
            <Link href="/upload">사이트 올리기</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";

export default function SuccessPanel({ title, lead, url }: { title: string; lead: string; url: string }) {
  return (
    <section className="tile tile-light hero">
      <div className="success">
        <div className="success-check" aria-hidden>
          ✓
        </div>
        <h1 className="hero-display">{title}</h1>
        <p className="lead">{lead}</p>
        <p className="success-url">
          {typeof window !== "undefined" ? window.location.host : ""}
          {url}
        </p>
        <div className="cta-row">
          <a href={url} target="_blank" rel="noopener" className="btn btn-primary">
            내 사이트 열기
          </a>
          <Link href="/#gallery" className="btn btn-secondary">
            갤러리 보기
          </Link>
        </div>
      </div>
    </section>
  );
}

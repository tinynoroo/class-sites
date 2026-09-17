"use client";

import Link from "next/link";
import { useState } from "react";
import FolderPicker from "@/app/components/FolderPicker";
import SuccessPanel from "@/app/components/SuccessPanel";
import { appendFiles, send } from "@/lib/upload-client";

type Status =
  | { type: "idle" }
  | { type: "busy"; progress: number }
  | { type: "error"; text: string }
  | { type: "done"; url: string };

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) {
      setStatus({ type: "error", text: "폴더를 선택하세요." });
      return;
    }
    const data = new FormData(e.currentTarget);
    appendFiles(data, files);

    setStatus({ type: "busy", progress: 0 });
    try {
      const { ok, json } = await send("/api/upload", data, (progress) => setStatus({ type: "busy", progress }));
      if (!ok || !json.url) throw new Error(json.error ?? "업로드에 실패했습니다.");
      setStatus({ type: "done", url: json.url });
      window.scrollTo({ top: 0 });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "업로드에 실패했습니다." });
    }
  }

  const busy = status.type === "busy";

  return (
    <main>
      <div className="sub-nav">
        <div className="sub-nav-inner">
          <span className="sub-nav-title">사이트 올리기</span>
          <div className="sub-nav-actions">
            <Link href="/#gallery">갤러리 보기</Link>
          </div>
        </div>
      </div>

      {status.type === "done" ? (
        <SuccessPanel title="게시되었습니다." lead="이제 누구나 내 사이트를 볼 수 있어요." url={status.url} />
      ) : (
        <>
          <section className="tile tile-light hero">
            <div className="tile-inner">
              <h1 className="hero-display">폴더째 올리세요.</h1>
              <p className="lead">
                <code>index.html</code>이 들어 있는 폴더면 됩니다.
              </p>
            </div>
          </section>

          <section className="tile tile-parchment">
            <form onSubmit={onSubmit} className="form-card">
              <div className="field">
                <label className="field-label" htmlFor="author">
                  이름
                </label>
                <input id="author" name="author" className="input" required maxLength={40} placeholder="홍길동" />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="title">
                  사이트 제목
                </label>
                <input id="title" name="title" className="input" maxLength={80} placeholder="나의 첫 홈페이지" />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="slug">
                  주소
                </label>
                <div className="input-group">
                  <span className="prefix">/sites/</span>
                  <input
                    id="slug"
                    name="slug"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    pattern="[a-z0-9](?:[a-z0-9\-]{0,38}[a-z0-9])?"
                    placeholder="gildong"
                    onChange={(e) => (e.target.value = e.target.value.toLowerCase())}
                  />
                </div>
                <p className="field-hint">영문 소문자, 숫자, 하이픈(-)으로 2~40자. 올린 뒤에는 바꿀 수 없어요.</p>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="password">
                  비밀번호
                </label>
                <input id="password" name="password" type="password" className="input" required minLength={4} />
                <p className="field-hint">나중에 제목이나 파일을 수정할 때 필요해요.</p>
              </div>

              <div className="field">
                <span className="field-label">폴더</span>
                <FolderPicker files={files} onChange={setFiles} />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-large btn-block" disabled={busy}>
                  {busy ? `올리는 중… ${Math.round(status.progress * 100)}%` : "올리기"}
                </button>
                {busy && (
                  <div className="progress" aria-hidden>
                    <div style={{ width: `${Math.round(status.progress * 100)}%` }} />
                  </div>
                )}
                {status.type === "error" && (
                  <p className="form-error" role="alert">
                    {status.text}
                  </p>
                )}
              </div>
            </form>
          </section>
        </>
      )}
    </main>
  );
}

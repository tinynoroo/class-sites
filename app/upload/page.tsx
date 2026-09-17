"use client";

import Link from "next/link";
import { useState } from "react";

type Status =
  | { type: "idle" }
  | { type: "busy"; progress: number }
  | { type: "error"; text: string }
  | { type: "done"; url: string };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// fetch는 업로드 진행률을 알 수 없어 XHR을 쓴다
function send(data: FormData, onProgress: (p: number) => void) {
  return new Promise<{ ok: boolean; json: { error?: string; url?: string } }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => resolve({ ok: xhr.status < 300, json: xhr.response ?? {} });
    xhr.onerror = () => reject(new Error("네트워크 오류가 발생했습니다."));
    xhr.send(data);
  });
}

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
    data.delete("folder");
    for (const file of files) {
      data.append("files", file);
      data.append("paths", file.webkitRelativePath || file.name);
    }

    setStatus({ type: "busy", progress: 0 });
    try {
      const { ok, json } = await send(data, (progress) => setStatus({ type: "busy", progress }));
      if (!ok || !json.url) throw new Error(json.error ?? "업로드에 실패했습니다.");
      setStatus({ type: "done", url: json.url });
      window.scrollTo({ top: 0 });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "업로드에 실패했습니다." });
    }
  }

  const folderName = files[0]?.webkitRelativePath.split("/")[0];
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
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
        <section className="tile tile-light hero">
          <div className="success">
            <div className="success-check" aria-hidden>
              ✓
            </div>
            <h1 className="hero-display">게시되었습니다.</h1>
            <p className="lead">이제 누구나 내 사이트를 볼 수 있어요.</p>
            <p className="success-url">
              {typeof window !== "undefined" ? window.location.host : ""}
              {status.url}
            </p>
            <div className="cta-row">
              <a href={status.url} target="_blank" rel="noopener" className="btn btn-primary">
                내 사이트 열기
              </a>
              <Link href="/#gallery" className="btn btn-secondary">
                갤러리 보기
              </Link>
            </div>
          </div>
        </section>
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
                <p className="field-hint">영문 소문자, 숫자, 하이픈(-)으로 2~40자.</p>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="password">
                  비밀번호
                </label>
                <input id="password" name="password" type="password" className="input" required minLength={4} />
                <p className="field-hint">나중에 같은 주소로 다시 올려 수정할 때 필요해요.</p>
              </div>

              <div className="field">
                <span className="field-label">폴더</span>
                <div className="folder-picker">
                  <div className="folder-info">
                    {folderName ? (
                      <>
                        <div className="folder-name">{folderName}</div>
                        <div className="folder-sub">
                          파일 {files.length}개 · {formatSize(totalSize)}
                        </div>
                      </>
                    ) : (
                      <div className="folder-sub">선택된 폴더가 없습니다.</div>
                    )}
                  </div>
                  <label className="btn btn-pearl">
                    {folderName ? "다시 선택" : "폴더 선택"}
                    <input
                      name="folder"
                      type="file"
                      multiple
                      {...{ webkitdirectory: "" }}
                      onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    />
                  </label>
                </div>
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

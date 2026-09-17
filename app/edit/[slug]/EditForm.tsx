"use client";

import Link from "next/link";
import { useState } from "react";
import FolderPicker from "@/app/components/FolderPicker";
import SuccessPanel from "@/app/components/SuccessPanel";
import { appendFiles, send, type ApiResult } from "@/lib/upload-client";

type SiteInfo = ApiResult & { title: string; author: string; fileCount: number; updatedAt: string };

type Step =
  | { type: "locked"; busy: boolean; error?: string }
  | { type: "editing"; info: SiteInfo; progress?: number; error?: string }
  | { type: "done"; url: string };

export default function EditForm({ slug, title: initialTitle }: { slug: string; title: string }) {
  const [step, setStep] = useState<Step>({ type: "locked", busy: false });
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState(initialTitle);
  const [files, setFiles] = useState<File[]>([]);

  const api = `/api/sites/${slug}`;

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setStep({ type: "locked", busy: true });
    const data = new FormData();
    data.append("password", password);
    data.append("intent", "verify");
    try {
      const { ok, json } = await send<SiteInfo>(api, data);
      if (!ok) throw new Error(json.error ?? "확인에 실패했습니다.");
      setTitle(json.title);
      setStep({ type: "editing", info: json });
    } catch (err) {
      setStep({ type: "locked", busy: false, error: err instanceof Error ? err.message : "확인에 실패했습니다." });
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (step.type !== "editing") return;
    const { info } = step;

    const data = new FormData();
    data.append("password", password);
    data.append("intent", "update");
    data.append("title", title);
    appendFiles(data, files);

    setStep({ type: "editing", info, progress: 0 });
    try {
      const { ok, json } = await send(api, data, (progress) => setStep({ type: "editing", info, progress }));
      if (!ok || !json.url) throw new Error(json.error ?? "저장에 실패했습니다.");
      setStep({ type: "done", url: json.url });
      window.scrollTo({ top: 0 });
    } catch (err) {
      setStep({ type: "editing", info, error: err instanceof Error ? err.message : "저장에 실패했습니다." });
    }
  }

  return (
    <main>
      <div className="sub-nav">
        <div className="sub-nav-inner">
          <span className="sub-nav-title">사이트 수정</span>
          <div className="sub-nav-actions">
            <Link href="/#gallery">갤러리 보기</Link>
          </div>
        </div>
      </div>

      {step.type === "done" ? (
        <SuccessPanel title="수정되었습니다." lead="바뀐 내용이 바로 반영됐어요." url={step.url} />
      ) : (
        <>
          <section className="tile tile-light hero">
            <div className="tile-inner">
              <p className="eyebrow">/sites/{slug}</p>
              <h1 className="hero-display">{initialTitle}</h1>
              <p className="lead">
                {step.type === "locked" ? "처음 올릴 때 정한 비밀번호를 입력하세요." : "제목이나 파일을 바꿀 수 있어요."}
              </p>
            </div>
          </section>

          <section className="tile tile-parchment">
            {step.type === "locked" ? (
              <form onSubmit={unlock} className="form-card">
                <div className="field">
                  <label className="field-label" htmlFor="password">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="input"
                    required
                    autoFocus
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary btn-large btn-block" disabled={step.busy}>
                    {step.busy ? "확인 중…" : "확인"}
                  </button>
                  {step.error && (
                    <p className="form-error" role="alert">
                      {step.error}
                    </p>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={save} className="form-card">
                <div className="field">
                  <span className="field-label">주소</span>
                  <div className="input-group is-readonly">
                    <span className="prefix">/sites/</span>
                    <input value={slug} readOnly tabIndex={-1} aria-label="주소" />
                  </div>
                  <p className="field-hint">주소는 바꿀 수 없어요.</p>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="title">
                    사이트 제목
                  </label>
                  <input
                    id="title"
                    className="input"
                    required
                    maxLength={80}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="field">
                  <span className="field-label">파일</span>
                  <FolderPicker
                    files={files}
                    onChange={setFiles}
                    emptyText={`지금 파일 ${step.info.fileCount}개 · 바꾸려면 폴더를 새로 선택하세요.`}
                  />
                  <p className="field-hint">
                    새 폴더를 고르면 기존 파일은 모두 새 폴더 내용으로 바뀌어요. 제목만 바꿀 거면 비워 두세요.
                  </p>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-large btn-block"
                    disabled={step.progress !== undefined}
                  >
                    {step.progress !== undefined
                      ? files.length > 0
                        ? `저장 중… ${Math.round(step.progress * 100)}%`
                        : "저장 중…"
                      : "저장하기"}
                  </button>
                  {step.progress !== undefined && files.length > 0 && (
                    <div className="progress" aria-hidden>
                      <div style={{ width: `${Math.round(step.progress * 100)}%` }} />
                    </div>
                  )}
                  {step.error && (
                    <p className="form-error" role="alert">
                      {step.error}
                    </p>
                  )}
                </div>
              </form>
            )}
          </section>
        </>
      )}
    </main>
  );
}

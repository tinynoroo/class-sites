"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<{ type: "error" | "ok" | "busy"; text: string; url?: string }>();

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

    setStatus({ type: "busy", text: "업로드 중..." });
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "업로드 실패");
      setStatus({ type: "ok", text: "업로드 완료!", url: json.url });
    } catch (err) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : "업로드 실패" });
    }
  }

  const folderName = files[0]?.webkitRelativePath.split("/")[0];

  return (
    <main className="container narrow">
      <p>
        <Link href="/">← 목록으로</Link>
      </p>
      <h1>사이트 올리기</h1>
      <p className="muted">
        <code>index.html</code>이 들어 있는 폴더를 통째로 선택하세요. 같은 주소와 비밀번호로 다시 올리면
        수정됩니다.
      </p>

      <form onSubmit={onSubmit} className="form">
        <label>
          이름
          <input name="author" required maxLength={40} placeholder="홍길동" />
        </label>
        <label>
          사이트 제목
          <input name="title" maxLength={80} placeholder="나의 첫 홈페이지" />
        </label>
        <label>
          주소 (영문 소문자, 숫자, -)
          <div className="slug">
            <span className="muted">/sites/</span>
            <input
              name="slug"
              required
              pattern="[a-z0-9](?:[a-z0-9\-]{0,38}[a-z0-9])?"
              placeholder="gildong"
              onChange={(e) => (e.target.value = e.target.value.toLowerCase())}
            />
          </div>
        </label>
        <label>
          비밀번호 (수정할 때 필요)
          <input name="password" type="password" required minLength={4} />
        </label>
        <label>
          폴더
          <input
            ref={inputRef}
            name="folder"
            type="file"
            multiple
            {...{ webkitdirectory: "" }}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </label>
        {folderName && (
          <p className="muted">
            {folderName} · 파일 {files.length}개
          </p>
        )}

        <button type="submit" className="button" disabled={status?.type === "busy"}>
          {status?.type === "busy" ? "업로드 중..." : "올리기"}
        </button>
      </form>

      {status && status.type !== "busy" && (
        <p className={status.type === "error" ? "error" : "ok"}>
          {status.text}{" "}
          {status.url && (
            <a href={status.url} target="_blank" rel="noopener">
              내 사이트 열기 →
            </a>
          )}
        </p>
      )}
    </main>
  );
}

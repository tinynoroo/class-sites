"use client";

import { formatSize } from "@/lib/upload-client";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  emptyText?: string;
};

export default function FolderPicker({ files, onChange, emptyText = "선택된 폴더가 없습니다." }: Props) {
  const folderName = files[0]?.webkitRelativePath.split("/")[0];
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
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
          <div className="folder-sub">{emptyText}</div>
        )}
      </div>
      <label className="btn btn-pearl">
        {folderName ? "다시 선택" : "폴더 선택"}
        <input
          type="file"
          multiple
          {...{ webkitdirectory: "" }}
          onChange={(e) => onChange(Array.from(e.target.files ?? []))}
        />
      </label>
    </div>
  );
}

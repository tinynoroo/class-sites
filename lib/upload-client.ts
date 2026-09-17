export type ApiResult = { error?: string; url?: string };

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function appendFiles(data: FormData, files: File[]) {
  for (const file of files) {
    data.append("files", file);
    data.append("paths", file.webkitRelativePath || file.name);
  }
}

// fetch는 업로드 진행률을 알 수 없어 XHR을 쓴다
export function send<T extends ApiResult>(url: string, data: FormData, onProgress?: (p: number) => void) {
  return new Promise<{ ok: boolean; json: T }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    if (onProgress) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => resolve({ ok: xhr.status < 300, json: xhr.response ?? {} });
    xhr.onerror = () => reject(new Error("네트워크 오류가 발생했습니다."));
    xhr.send(data);
  });
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 학생 사이트는 /sites/<slug>/ 처럼 끝에 슬래시가 있어야 상대경로(style.css 등)가 제대로 풀린다.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

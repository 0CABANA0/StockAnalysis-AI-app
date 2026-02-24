import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 이미지 최적화 — 외부 이미지 도메인 허용
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    // data: URL (이미지 분석 미리보기)은 unoptimized로 처리
  },

  // 프로덕션 최적화
  poweredByHeader: false,

  // 패키지 임포트 최적화 — barrel file tree-shaking 개선
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  // 백엔드 API 프록시 — CORS 우회 + 보안 강화
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
    // /api/* → 사용하지 않음 (클라이언트에서 직접 호출)
    // 필요 시 서버사이드 프록시 활성화:
    // return [{ source: "/backend/:path*", destination: `${apiUrl}/:path*` }];
    return [];
  },
};

export default nextConfig;

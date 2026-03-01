/**
 * 앱 공통 상수
 */

/** 프로덕션 도메인 (환경변수 우선, 폴백값으로 Vercel 도메인 사용) */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://stock-intelligence-seven.vercel.app";

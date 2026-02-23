/**
 * 백엔드 헬스 체크 API.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return { status: "offline", timestamp: "" };
    }
    return res.json();
  } catch {
    return { status: "offline", timestamp: "" };
  }
}

/**
 * FastAPI 백엔드 API 클라이언트.
 * 브라우저에서 Supabase JWT 토큰을 자동으로 포함하여 호출한다.
 */

import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = await getAuthHeaders();
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.detail ?? `API 요청 실패: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

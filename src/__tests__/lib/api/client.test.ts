/**
 * API 클라이언트 테스트.
 * apiFetch / serverApiFetch의 에러 핸들링, 헤더 주입을 검증한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Supabase 클라이언트 모킹
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: { access_token: "test-jwt-token" },
        },
      }),
    },
  }),
}));

describe("apiFetch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // 환경변수 설정
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://test-api:8000/api");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("성공 응답을 JSON으로 파싱한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "success" }),
    });

    // 모듈을 다시 import하여 env 변경 반영
    const { apiFetch } = await import("@/lib/api/client");
    const result = await apiFetch("/health");

    expect(result).toEqual({ data: "success" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://test-api:8000/api/health",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-jwt-token",
        }),
      }),
    );
  });

  it("API 오류 시 detail 메시지를 포함한 Error를 던진다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: () => Promise.resolve({ detail: "관리자 권한 필요" }),
    });

    const { apiFetch } = await import("@/lib/api/client");

    await expect(apiFetch("/admin/stats")).rejects.toThrow("관리자 권한 필요");
  });

  it("JSON 파싱 실패 시 상태코드 기반 에러를 던진다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("invalid json")),
    });

    const { apiFetch } = await import("@/lib/api/client");

    await expect(apiFetch("/broken")).rejects.toThrow("API 요청 실패: 500");
  });
});

describe("serverApiFetch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://test-api:8000/api");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("제공된 토큰으로 Authorization 헤더를 설정한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { serverApiFetch } = await import("@/lib/api/client");
    await serverApiFetch("/macro/latest", "server-side-token");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://test-api:8000/api/macro/latest",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer server-side-token",
        }),
      }),
    );
  });

  it("POST 요청 시 body와 method를 전달한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { serverApiFetch } = await import("@/lib/api/client");
    await serverApiFetch("/watchlist", "token-123", {
      method: "POST",
      body: JSON.stringify({ ticker: "AAPL" }),
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://test-api:8000/api/watchlist",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ ticker: "AAPL" }),
      }),
    );
  });

  it("서버 에러 시 detail 메시지를 포함한 Error를 던진다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ detail: "스냅샷 없음" }),
    });

    const { serverApiFetch } = await import("@/lib/api/client");

    await expect(
      serverApiFetch("/macro/latest", "token"),
    ).rejects.toThrow("스냅샷 없음");
  });
});

/**
 * 헬스 체크 API 클라이언트 테스트.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchHealth } from "@/lib/api/health";

describe("fetchHealth", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://test-api:8000/api");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("정상 응답 시 status와 timestamp를 반환한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          timestamp: "2026-02-28T06:00:00Z",
        }),
    });

    const result = await fetchHealth();
    expect(result.status).toBe("ok");
    expect(result.timestamp).toBe("2026-02-28T06:00:00Z");
  });

  it("HTTP 에러 시 offline 상태를 반환한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await fetchHealth();
    expect(result.status).toBe("offline");
    expect(result.timestamp).toBe("");
  });

  it("네트워크 에러 시 offline 상태를 반환한다", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await fetchHealth();
    expect(result.status).toBe("offline");
    expect(result.timestamp).toBe("");
  });
});

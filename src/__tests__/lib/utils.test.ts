/**
 * cn() 유틸리티 테스트.
 * clsx + tailwind-merge 기반 클래스 병합 함수.
 */
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("단일 문자열을 그대로 반환한다", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("여러 클래스를 병합한다", () => {
    const result = cn("px-4", "py-2", "text-sm");
    expect(result).toBe("px-4 py-2 text-sm");
  });

  it("조건부 클래스를 지원한다", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toContain("active");
  });

  it("falsy 값을 무시한다", () => {
    const result = cn("base", false, null, undefined, 0, "extra");
    expect(result).toBe("base extra");
  });

  it("tailwind 충돌 클래스를 병합한다", () => {
    // tailwind-merge가 p-4와 p-2 충돌 시 후자를 우선
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  it("객체 구문을 지원한다", () => {
    const result = cn({ "text-red-500": true, "bg-blue-500": false });
    expect(result).toBe("text-red-500");
  });
});

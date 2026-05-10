import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 1000000 });
  });

  it("should allow first request", () => {
    const result = checkRateLimit("ip1", 5, 60000);
    expect(result).toBe(true);
  });

  it("should allow requests under the limit", () => {
    const ip = "ip2";
    for (let i = 0; i < 4; i++) {
      expect(checkRateLimit(ip, 5, 60000)).toBe(true);
    }
  });

  it("should block requests over the limit", () => {
    const ip = "ip3";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, 5, 60000);
    }
    expect(checkRateLimit(ip, 5, 60000)).toBe(false);
  });

  it("should reset after window expires", () => {
    const ip = "ip4";
    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, 5, 60000);
    }
    expect(checkRateLimit(ip, 5, 60000)).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(61000);
    expect(checkRateLimit(ip, 5, 60000)).toBe(true);
  });

  it("should track different IPs separately", () => {
    const ipA = "ipA";
    const ipB = "ipB";

    // Exhaust ipA
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ipA, 5, 60000);
    }
    expect(checkRateLimit(ipA, 5, 60000)).toBe(false);

    // ipB should still be allowed
    expect(checkRateLimit(ipB, 5, 60000)).toBe(true);
  });

  it("should handle different window sizes", () => {
    const ip = "ipWindow";
    // 1 request per 1000ms window
    checkRateLimit(ip, 1, 1000);
    expect(checkRateLimit(ip, 1, 1000)).toBe(false);

    vi.advanceTimersByTime(1100);
    expect(checkRateLimit(ip, 1, 1000)).toBe(true);
  });
});

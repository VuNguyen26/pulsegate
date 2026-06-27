import { describe, expect, it } from "vitest";

import { InMemoryRateLimitStore } from "./in-memory-rate-limit-store.js";

function createTestStore(startTime = 1_700_000_000_000) {
  let now = startTime;

  const store = new InMemoryRateLimitStore(() => now);

  return {
    store,
    getNow: () => now,
    advanceMs: (ms: number) => {
      now += ms;
    },
  };
}

describe("InMemoryRateLimitStore", () => {
  it("should allow the first request and return rate limit metadata", () => {
    const { store, getNow } = createTestStore();

    const result = store.consume("api-key:test:route:GET:/api/products", {
      limit: 3,
      windowMs: 1000,
    });

    expect(result).toEqual({
      allowed: true,
      limit: 3,
      remaining: 2,
      resetAt: getNow() + 1000,
      retryAfterSeconds: 0,
    });
  });

  it("should decrease remaining requests within the same window", () => {
    const { store } = createTestStore();
    const key = "api-key:test:route:GET:/api/products";
    const config = {
      limit: 3,
      windowMs: 1000,
    };

    const firstResult = store.consume(key, config);
    const secondResult = store.consume(key, config);
    const thirdResult = store.consume(key, config);

    expect(firstResult.allowed).toBe(true);
    expect(firstResult.remaining).toBe(2);

    expect(secondResult.allowed).toBe(true);
    expect(secondResult.remaining).toBe(1);

    expect(thirdResult.allowed).toBe(true);
    expect(thirdResult.remaining).toBe(0);
  });

  it("should block requests when the limit is exceeded", () => {
    const { store } = createTestStore();
    const key = "api-key:test:route:GET:/api/products";
    const config = {
      limit: 2,
      windowMs: 1000,
    };

    store.consume(key, config);
    store.consume(key, config);

    const blockedResult = store.consume(key, config);

    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.limit).toBe(2);
    expect(blockedResult.remaining).toBe(0);
    expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("should keep separate counters for different keys", () => {
    const { store } = createTestStore();
    const config = {
      limit: 1,
      windowMs: 1000,
    };

    const firstKeyResult = store.consume(
      "api-key:first:route:GET:/api/products",
      config
    );

    const secondKeyResult = store.consume(
      "api-key:second:route:GET:/api/products",
      config
    );

    const firstKeyBlockedResult = store.consume(
      "api-key:first:route:GET:/api/products",
      config
    );

    expect(firstKeyResult.allowed).toBe(true);
    expect(secondKeyResult.allowed).toBe(true);
    expect(firstKeyBlockedResult.allowed).toBe(false);
  });

  it("should reset the counter after the window expires", () => {
    const { store, advanceMs } = createTestStore();
    const key = "api-key:test:route:GET:/api/products";
    const config = {
      limit: 2,
      windowMs: 1000,
    };

    store.consume(key, config);
    store.consume(key, config);

    const blockedResult = store.consume(key, config);

    expect(blockedResult.allowed).toBe(false);

    advanceMs(1000);

    const resetResult = store.consume(key, config);

    expect(resetResult.allowed).toBe(true);
    expect(resetResult.remaining).toBe(1);
    expect(resetResult.retryAfterSeconds).toBe(0);
  });

  it("should clear all counters", () => {
    const { store } = createTestStore();

    store.consume("api-key:first:route:GET:/api/products", {
      limit: 2,
      windowMs: 1000,
    });

    store.consume("api-key:second:route:GET:/api/products", {
      limit: 2,
      windowMs: 1000,
    });

    expect(store.size).toBe(2);

    store.clear();

    expect(store.size).toBe(0);
  });

  it("should cleanup expired counters", () => {
    const { store, advanceMs } = createTestStore();

    store.consume("api-key:first:route:GET:/api/products", {
      limit: 2,
      windowMs: 1000,
    });

    store.consume("api-key:second:route:GET:/api/products", {
      limit: 2,
      windowMs: 1000,
    });

    expect(store.size).toBe(2);

    advanceMs(1000);

    const deletedCount = store.cleanupExpired();

    expect(deletedCount).toBe(2);
    expect(store.size).toBe(0);
  });

  it("should reject an empty rate limit key", () => {
    const { store } = createTestStore();

    expect(() =>
      store.consume("   ", {
        limit: 2,
        windowMs: 1000,
      })
    ).toThrow("Rate limit key is required");
  });

  it("should reject invalid rate limit config", () => {
    const { store } = createTestStore();

    expect(() =>
      store.consume("api-key:test:route:GET:/api/products", {
        limit: 0,
        windowMs: 1000,
      })
    ).toThrow("Rate limit must be greater than 0");

    expect(() =>
      store.consume("api-key:test:route:GET:/api/products", {
        limit: 2,
        windowMs: 0,
      })
    ).toThrow("Rate limit windowMs must be greater than 0");
  });
});
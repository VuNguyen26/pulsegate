import { describe, expect, it, vi } from "vitest";

import type { ResponseCacheStore } from "../cache/redis-response-cache-store.js";
import {
  buildResponseCacheKey,
  resolveRouteCachePolicy,
} from "./cache.policy.js";

function createResponseCacheStore(): ResponseCacheStore {
  return {
    get: vi.fn(async () => ({
      hit: false as const,
    })),
    set: vi.fn(async () => undefined),
  };
}

describe("buildResponseCacheKey", () => {
  it("should build a stable uppercase method cache key", () => {
    expect(buildResponseCacheKey("get", "/api/products")).toBe(
      "GET:/api/products",
    );
  });
});

describe("resolveRouteCachePolicy", () => {
  it("should enable cache when policy is enabled and store is provided", () => {
    const store = createResponseCacheStore();

    const resolvedPolicy = resolveRouteCachePolicy({
      policy: {
        enabled: true,
        ttlSeconds: 30,
      },
      store,
    });

    expect(resolvedPolicy).toEqual({
      enabled: true,
      ttlSeconds: 30,
      store,
    });
  });

  it("should disable cache when policy is disabled even if store is provided", () => {
    const store = createResponseCacheStore();

    const resolvedPolicy = resolveRouteCachePolicy({
      policy: {
        enabled: false,
        ttlSeconds: 30,
      },
      store,
    });

    expect(resolvedPolicy).toEqual({
      enabled: false,
      ttlSeconds: 30,
      store,
    });
  });

  it("should disable cache when store is missing", () => {
    const resolvedPolicy = resolveRouteCachePolicy({
      policy: {
        enabled: true,
        ttlSeconds: 30,
      },
    });

    expect(resolvedPolicy).toEqual({
      enabled: false,
      ttlSeconds: 30,
      store: undefined,
    });
  });

  it("should use ttl override when provided", () => {
    const store = createResponseCacheStore();

    const resolvedPolicy = resolveRouteCachePolicy({
      policy: {
        enabled: true,
        ttlSeconds: 30,
      },
      store,
      ttlSecondsOverride: 5,
    });

    expect(resolvedPolicy).toEqual({
      enabled: true,
      ttlSeconds: 5,
      store,
    });
  });
});
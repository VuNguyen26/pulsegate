import { describe, expect, it, vi } from "vitest";

import {
  RedisRateLimitStore,
  type RedisRateLimitClient,
} from "./redis-rate-limit-store.js";

function createMockRedisClient(result: unknown): RedisRateLimitClient {
  return {
    eval: vi.fn().mockResolvedValue(result),
  };
}

describe("RedisRateLimitStore", () => {
  it("should allow a request when the Redis count is under the limit", async () => {
    const client = createMockRedisClient([1, 60_000]);
    const store = new RedisRateLimitStore(client, () => 1_000);

    const result = await store.consume("api-key:test", {
      limit: 5,
      windowMs: 60_000,
    });

    expect(result).toEqual({
      allowed: true,
      limit: 5,
      remaining: 4,
      resetAt: 61_000,
      retryAfterSeconds: 0,
    });

    expect(client.eval).toHaveBeenCalledWith(expect.any(String), {
      keys: ["rate-limit:api-key:test"],
      arguments: ["60000"],
    });
  });

  it("should block a request when the Redis count exceeds the limit", async () => {
    const client = createMockRedisClient([6, 12_000]);
    const store = new RedisRateLimitStore(client, () => 10_000);

    const result = await store.consume("api-key:test", {
      limit: 5,
      windowMs: 60_000,
    });

    expect(result).toEqual({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAt: 22_000,
      retryAfterSeconds: 12,
    });
  });

  it("should fallback to the configured window when Redis ttl is not positive", async () => {
    const client = createMockRedisClient([1, -1]);
    const store = new RedisRateLimitStore(client, () => 5_000);

    const result = await store.consume("api-key:test", {
      limit: 5,
      windowMs: 60_000,
    });

    expect(result).toEqual({
      allowed: true,
      limit: 5,
      remaining: 4,
      resetAt: 65_000,
      retryAfterSeconds: 0,
    });
  });

  it("should reject an empty key", async () => {
    const client = createMockRedisClient([1, 60_000]);
    const store = new RedisRateLimitStore(client);

    await expect(
      store.consume("   ", {
        limit: 5,
        windowMs: 60_000,
      })
    ).rejects.toThrow("Rate limit key is required");
  });

  it("should reject invalid rate limit config", async () => {
    const client = createMockRedisClient([1, 60_000]);
    const store = new RedisRateLimitStore(client);

    await expect(
      store.consume("api-key:test", {
        limit: 0,
        windowMs: 60_000,
      })
    ).rejects.toThrow("Rate limit must be greater than 0");

    await expect(
      store.consume("api-key:test", {
        limit: 5,
        windowMs: 0,
      })
    ).rejects.toThrow("Rate limit windowMs must be greater than 0");
  });

  it("should reject invalid Redis script responses", async () => {
    const client = createMockRedisClient(["invalid"]);
    const store = new RedisRateLimitStore(client);

    await expect(
      store.consume("api-key:test", {
        limit: 5,
        windowMs: 60_000,
      })
    ).rejects.toThrow("Invalid Redis rate limit response");
  });

    it("should fail fast when the Redis command takes too long", async () => {
    const client: RedisRateLimitClient = {
      eval: () => new Promise(() => {}),
    };

    const store = new RedisRateLimitStore(client, () => 1_000, {
      commandTimeoutMs: 10,
    });

    await expect(
      store.consume("api-key:test", {
        limit: 5,
        windowMs: 60_000,
      })
    ).rejects.toThrow("Redis rate limit command timed out");
  });
});
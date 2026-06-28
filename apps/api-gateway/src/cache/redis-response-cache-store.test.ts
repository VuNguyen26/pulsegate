import { describe, expect, it, vi } from "vitest";

import {
  RedisResponseCacheStore,
  type CachedHttpResponse,
  type RedisResponseCacheClient,
} from "./redis-response-cache-store.js";

function createMockRedisClient(result: unknown): RedisResponseCacheClient {
  return {
    sendCommand: vi.fn().mockResolvedValue(result),
  };
}

describe("RedisResponseCacheStore", () => {
  it("should return cache miss when Redis has no value", async () => {
    const client = createMockRedisClient(null);
    const store = new RedisResponseCacheStore(client);

    const result = await store.get("GET:/api/products");

    expect(result).toEqual({
      hit: false,
    });

    expect(client.sendCommand).toHaveBeenCalledWith([
      "GET",
      "response-cache:GET:/api/products",
    ]);
  });

  it("should return cache hit when Redis has a cached response", async () => {
    const cachedResponse: CachedHttpResponse = {
      statusCode: 200,
      body: {
        data: [
          {
            id: "prod_001",
            name: "Mechanical Keyboard",
            price: 120,
          },
        ],
      },
      headers: {
        "content-type": "application/json",
      },
    };

    const client = createMockRedisClient(JSON.stringify(cachedResponse));
    const store = new RedisResponseCacheStore(client);

    const result = await store.get("GET:/api/products");

    expect(result).toEqual({
      hit: true,
      value: cachedResponse,
    });
  });

  it("should store cached response with ttl", async () => {
    const client = createMockRedisClient("OK");
    const store = new RedisResponseCacheStore(client);

    const cachedResponse: CachedHttpResponse = {
      statusCode: 200,
      body: {
        data: [],
      },
    };

    await store.set("GET:/api/products", cachedResponse, {
      ttlSeconds: 30,
    });

    expect(client.sendCommand).toHaveBeenCalledWith([
      "SET",
      "response-cache:GET:/api/products",
      JSON.stringify(cachedResponse),
      "EX",
      "30",
    ]);
  });

  it("should reject an empty cache key", async () => {
    const client = createMockRedisClient(null);
    const store = new RedisResponseCacheStore(client);

    await expect(store.get("   ")).rejects.toThrow("Cache key is required");
  });

  it("should reject invalid ttl", async () => {
    const client = createMockRedisClient("OK");
    const store = new RedisResponseCacheStore(client);

    await expect(
      store.set(
        "GET:/api/products",
        {
          statusCode: 200,
          body: {
            data: [],
          },
        },
        {
          ttlSeconds: 0,
        }
      )
    ).rejects.toThrow("Cache ttlSeconds must be a positive integer");
  });

  it("should reject invalid cached response payload from Redis", async () => {
    const client = createMockRedisClient("not-json");
    const store = new RedisResponseCacheStore(client);

    await expect(store.get("GET:/api/products")).rejects.toThrow(
      "Invalid cached response payload"
    );
  });

  it("should fail fast when the Redis cache command takes too long", async () => {
    const client: RedisResponseCacheClient = {
      sendCommand: () => new Promise(() => {}),
    };

    const store = new RedisResponseCacheStore(client, {
      commandTimeoutMs: 10,
    });

    await expect(store.get("GET:/api/products")).rejects.toThrow(
      "Redis cache command timed out"
    );
  });
});
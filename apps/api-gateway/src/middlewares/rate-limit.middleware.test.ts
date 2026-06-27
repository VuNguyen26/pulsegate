import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { InMemoryRateLimitStore } from "../rate-limit/in-memory-rate-limit-store.js";
import {
  buildRateLimitKey,
  createRateLimitMiddleware,
} from "./rate-limit.middleware.js";

type TestAppOptions = {
  store: InMemoryRateLimitStore;
  apiKey?: string;
  limit?: number;
  windowMs?: number;
};

async function buildTestApp(
  options: TestAppOptions
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  app.get(
    "/test",
    {
      preHandler: [
        async (request) => {
          if (options.apiKey) {
            request.apiKey = options.apiKey;
          }
        },
        createRateLimitMiddleware({
          limit: options.limit ?? 2,
          windowMs: options.windowMs ?? 1000,
          routePath: "/test",
          store: options.store,
        }),
      ],
    },
    async () => {
      return {
        ok: true,
      };
    }
  );

  return app;
}

function createTestStore(startTime = 1_700_000_000_000) {
  let now = startTime;

  const store = new InMemoryRateLimitStore(() => now);

  return {
    store,
    advanceMs: (ms: number) => {
      now += ms;
    },
  };
}

let app: FastifyInstance | undefined;

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe("rate limit middleware", () => {
  it("should build a stable rate limit key", () => {
    const key = buildRateLimitKey({
      identityType: "api-key",
      identifier: "dev-api-key",
      method: "get",
      routePath: "/api/products",
    });

    expect(key).toBe("api-key:dev-api-key:route:GET:/api/products");
  });

  it("should allow requests under the configured limit", async () => {
    const { store } = createTestStore();

    app = await buildTestApp({
      store,
      apiKey: "dev-api-key",
      limit: 2,
      windowMs: 1000,
    });

    const firstResponse = await app.inject({
      method: "GET",
      url: "/test",
    });

    const secondResponse = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.json()).toEqual({
      ok: true,
    });
    expect(firstResponse.headers["x-ratelimit-limit"]).toBe("2");
    expect(firstResponse.headers["x-ratelimit-remaining"]).toBe("1");

    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.headers["x-ratelimit-limit"]).toBe("2");
    expect(secondResponse.headers["x-ratelimit-remaining"]).toBe("0");
  });

  it("should return 429 when the configured limit is exceeded", async () => {
    const { store } = createTestStore();

    app = await buildTestApp({
      store,
      apiKey: "dev-api-key",
      limit: 2,
      windowMs: 1000,
    });

    await app.inject({
      method: "GET",
      url: "/test",
    });

    await app.inject({
      method: "GET",
      url: "/test",
    });

    const blockedResponse = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.headers["x-ratelimit-limit"]).toBe("2");
    expect(blockedResponse.headers["x-ratelimit-remaining"]).toBe("0");
    expect(blockedResponse.headers["retry-after"]).toBeDefined();

    const body = blockedResponse.json();

    expect(body).toMatchObject({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please try again later.",
        requestId: expect.any(String),
      },
    });
  });

  it("should allow requests again after the window resets", async () => {
    const { store, advanceMs } = createTestStore();

    app = await buildTestApp({
      store,
      apiKey: "dev-api-key",
      limit: 1,
      windowMs: 1000,
    });

    const firstResponse = await app.inject({
      method: "GET",
      url: "/test",
    });

    const blockedResponse = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(blockedResponse.statusCode).toBe(429);

    advanceMs(1000);

    const resetResponse = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(resetResponse.statusCode).toBe(200);
    expect(resetResponse.headers["x-ratelimit-remaining"]).toBe("0");
  });

  it("should return 500 when the API key identifier is missing", async () => {
    const { store } = createTestStore();

    app = await buildTestApp({
      store,
      limit: 2,
      windowMs: 1000,
    });

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(500);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "RATE_LIMIT_IDENTIFIER_MISSING",
        message: "Rate limit identifier is missing",
        requestId: expect.any(String),
      },
    });
  });
});

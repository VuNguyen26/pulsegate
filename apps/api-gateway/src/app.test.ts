import type { FastifyInstance } from "fastify";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildApiGatewayApp } from "./app.js";
import { env } from "./config/env.js";

let app: FastifyInstance;

async function createValidJwtToken(): Promise<string> {
  const secretKey = new TextEncoder().encode(env.JWT_SECRET);
  const expiresAt = Math.floor(Date.now() / 1000) + env.JWT_EXPIRES_IN_SECONDS;

  return new SignJWT({
    role: "user",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject("user_123")
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(expiresAt)
    .sign(secretKey);
}

async function createValidAuthHeaders(): Promise<Record<string, string>> {
  const token = await createValidJwtToken();

  return {
    "x-api-key": "dev-api-key",
    authorization: `Bearer ${token}`,
  };
}

beforeEach(async () => {
  app = await buildApiGatewayApp({
    logger: false,
  });
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await app.close();
});

describe("API Gateway app", () => {
  it("should return health check response", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.service).toBe("api-gateway");
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(response.headers["x-request-id"]).toBeDefined();
  });

    it("should return 413 when request body is too large", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/products",
      headers: {
        "content-length": "1048577",
        "content-type": "application/json",
      },
      payload: {
        message: "this body is too large",
      },
    });

    expect(response.statusCode).toBe(413);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "REQUEST_BODY_TOO_LARGE",
        message: "Request body is too large",
        requestId: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("should return 401 when API key is missing for product proxy route", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/products",
    });

    expect(response.statusCode).toBe(401);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "API_KEY_MISSING",
        message: "API key is required",
        requestId: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("should return 403 when API key is invalid for product proxy route", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        "x-api-key": "wrong-key",
      },
    });

    expect(response.statusCode).toBe(403);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "API_KEY_INVALID",
        message: "API key is invalid",
        requestId: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("should return 401 when JWT token is missing for product proxy route", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        "x-api-key": "dev-api-key",
      },
    });

    expect(response.statusCode).toBe(401);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "JWT_TOKEN_MISSING",
        message: "Bearer token is required",
        requestId: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("should return 403 when JWT token is invalid for product proxy route", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: {
        "x-api-key": "dev-api-key",
        authorization: "Bearer invalid-token",
      },
    });

    expect(response.statusCode).toBe(403);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "JWT_TOKEN_INVALID",
        message: "Bearer token is invalid",
        requestId: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("should return products when API key and JWT token are valid", async () => {
    const mockProductsResponse = {
      data: [
        {
          id: "prod_001",
          name: "Mechanical Keyboard",
          price: 120,
        },
        {
          id: "prod_002",
          name: "Gaming Mouse",
          price: 45,
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockProductsResponse), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: await createValidAuthHeaders(),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(mockProductsResponse);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/products",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "x-request-id": expect.any(String),
        }),
        signal: expect.any(AbortSignal),
      })
    );

    expect(response.headers["x-request-id"]).toBeDefined();
    expect(response.headers["x-ratelimit-limit"]).toBe("5");
    expect(response.headers["x-ratelimit-remaining"]).toBe("4");
    expect(response.headers["x-ratelimit-reset"]).toBeDefined();
  });

    it("should return 429 when product route rate limit is exceeded", async () => {
    const mockProductsResponse = {
      data: [
        {
          id: "prod_001",
          name: "Mechanical Keyboard",
          price: 120,
        },
      ],
    };

    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockProductsResponse), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        })
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const headers = await createValidAuthHeaders();

    for (let index = 0; index < 5; index += 1) {
      const response = await app.inject({
        method: "GET",
        url: "/api/products",
        headers,
      });

      expect(response.statusCode).toBe(200);
    }

    const blockedResponse = await app.inject({
      method: "GET",
      url: "/api/products",
      headers,
    });

    expect(blockedResponse.statusCode).toBe(429);
    expect(blockedResponse.headers["x-ratelimit-limit"]).toBe("5");
    expect(blockedResponse.headers["x-ratelimit-remaining"]).toBe("0");
    expect(blockedResponse.headers["x-ratelimit-reset"]).toBeDefined();
    expect(blockedResponse.headers["retry-after"]).toBeDefined();

    const body = blockedResponse.json();

    expect(body).toMatchObject({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please try again later.",
        requestId: expect.any(String),
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(blockedResponse.headers["x-request-id"]).toBeDefined();
  });

  it("should return 503 when downstream product service is unavailable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("fetch failed"));

    vi.stubGlobal("fetch", fetchMock);

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: await createValidAuthHeaders(),
    });

    expect(response.statusCode).toBe(503);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "DOWNSTREAM_SERVICE_UNAVAILABLE",
        message: "Product Service is currently unavailable",
        service: "product-service",
        requestId: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("should return 502 when downstream product service returns an error status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: "Product Service internal error",
          },
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: await createValidAuthHeaders(),
    });

    expect(response.statusCode).toBe(502);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "DOWNSTREAM_HTTP_ERROR",
        message: "Product Service returned an error",
        service: "product-service",
        requestId: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("should return 502 when downstream product service returns invalid JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("not-json-response", {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: await createValidAuthHeaders(),
    });

    expect(response.statusCode).toBe(502);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "DOWNSTREAM_INVALID_RESPONSE",
        message: "Product Service returned an invalid response",
        service: "product-service",
        requestId: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("should return 504 when downstream product service times out", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";

    const fetchMock = vi.fn().mockRejectedValue(abortError);

    vi.stubGlobal("fetch", fetchMock);

    const response = await app.inject({
      method: "GET",
      url: "/api/products",
      headers: await createValidAuthHeaders(),
    });

    expect(response.statusCode).toBe(504);

    const body = response.json();

    expect(body).toMatchObject({
      error: {
        code: "DOWNSTREAM_TIMEOUT",
        message: "Product Service did not respond in time",
        service: "product-service",
        requestId: expect.any(String),
      },
    });

    expect(response.headers["x-request-id"]).toBeDefined();
  });
});
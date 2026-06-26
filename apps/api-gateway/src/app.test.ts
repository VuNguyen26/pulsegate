import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApiGatewayApp } from "./app.js";

let app: FastifyInstance;

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

  it("should return products when API key is valid", async () => {
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
      headers: {
        "x-api-key": "dev-api-key",
      },
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
  });
});
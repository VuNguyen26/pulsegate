import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApiGatewayApp } from "./app.js";

let app: FastifyInstance;

beforeEach(async () => {
  app = await buildApiGatewayApp({
    logger: false,
  });
});

afterEach(async () => {
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
});
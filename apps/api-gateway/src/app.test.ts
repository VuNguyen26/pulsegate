import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApiGatewayApp } from "./app.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe("API Gateway app", () => {
  it("should return health check response", async () => {
    app = await buildApiGatewayApp({
      logger: false,
    });

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
});
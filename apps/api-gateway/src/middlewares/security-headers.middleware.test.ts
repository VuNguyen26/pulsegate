import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import {
  securityHeaders,
  securityHeadersMiddleware,
} from "./security-headers.middleware.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

async function buildTestApp(): Promise<FastifyInstance> {
  app = Fastify({
    logger: false,
  });

  app.addHook("onRequest", securityHeadersMiddleware);

  app.get("/test", async () => {
    return {
      ok: true,
    };
  });

  return app;
}

describe("security headers middleware", () => {
  it("should add basic security headers to the response", async () => {
    const testApp = await buildTestApp();

    const response = await testApp.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(200);

    for (const [headerName, headerValue] of Object.entries(securityHeaders)) {
      expect(response.headers[headerName]).toBe(headerValue);
    }
  });
});
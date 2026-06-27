import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import {
  createRequestSizeLimitMiddleware,
  parseContentLength,
} from "./request-size-limit.middleware.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

async function buildTestApp(maxBodyBytes: number): Promise<FastifyInstance> {
  app = Fastify({
    logger: false,
  });

  app.addHook(
    "onRequest",
    createRequestSizeLimitMiddleware({
      maxBodyBytes,
    })
  );

  app.post("/test", async () => {
    return {
      ok: true,
    };
  });

  return app;
}

describe("request size limit middleware", () => {
  it("should parse valid content-length header", () => {
    expect(parseContentLength("100")).toBe(100);
  });

  it("should return undefined for missing or invalid content-length header", () => {
    expect(parseContentLength(undefined)).toBeUndefined();
    expect(parseContentLength("not-a-number")).toBeUndefined();
    expect(parseContentLength("-1")).toBeUndefined();
  });

  it("should allow request when content-length is under the limit", async () => {
    const testApp = await buildTestApp(100);
    const payload = "small-body";

    const response = await testApp.inject({
      method: "POST",
      url: "/test",
      headers: {
        "content-type": "text/plain",
        "content-length": String(Buffer.byteLength(payload)),
      },
      payload,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
    });
  });

  it("should allow request when content-length equals the limit", async () => {
    const payload = "x".repeat(100);
    const testApp = await buildTestApp(Buffer.byteLength(payload));

    const response = await testApp.inject({
      method: "POST",
      url: "/test",
      headers: {
        "content-type": "text/plain",
        "content-length": String(Buffer.byteLength(payload)),
      },
      payload,
    });

    expect(response.statusCode).toBe(200);
  });

  it("should return 413 when content-length exceeds the limit", async () => {
    const testApp = await buildTestApp(100);
    const payload = "x".repeat(101);

    const response = await testApp.inject({
      method: "POST",
      url: "/test",
      headers: {
        "content-type": "text/plain",
        "content-length": String(Buffer.byteLength(payload)),
      },
      payload,
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
  });

  it("should reject invalid max body bytes config", () => {
    expect(() =>
      createRequestSizeLimitMiddleware({
        maxBodyBytes: 0,
      })
    ).toThrow("maxBodyBytes must be greater than 0");
  });
});
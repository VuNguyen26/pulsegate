import Fastify, { type FastifyInstance } from "fastify";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { createAdminApiKeyAuthMiddleware } from "./admin-api-key-auth.middleware.js";

let app: FastifyInstance;

async function buildTestApp(): Promise<FastifyInstance> {
  const testApp = Fastify({
    logger: false,
  });

  const requireAdminApiKey =
    createAdminApiKeyAuthMiddleware({
      headerName: "x-admin-api-key",
      apiKey: "full-access-key",
      readOnlyApiKey: "read-only-key",
    });

  testApp.get(
    "/internal/admin/resource",
    {
      preHandler: requireAdminApiKey,
    },
    async () => ({
      access: "read",
    }),
  );

  testApp.post(
    "/internal/admin/resource",
    {
      preHandler: requireAdminApiKey,
    },
    async () => ({
      access: "write",
    }),
  );

  await testApp.ready();

  return testApp;
}

beforeEach(async () => {
  app = await buildTestApp();
});

afterEach(async () => {
  await app.close();
});

describe("createAdminApiKeyAuthMiddleware", () => {
  it("should reject a request when the admin API key is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/resource",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "ADMIN_API_KEY_MISSING",
        message: "Admin API key is required",
        requestId: expect.any(String),
      },
    });
  });

  it("should reject an invalid admin API key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/resource",
      headers: {
        "x-admin-api-key": "invalid-key",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: {
        code: "ADMIN_API_KEY_INVALID",
        message: "Admin API key is invalid",
        requestId: expect.any(String),
      },
    });
  });

  it("should allow the full-access key to read", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/resource",
      headers: {
        "x-admin-api-key": "full-access-key",
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it("should allow the full-access key to write", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/resource",
      headers: {
        "x-admin-api-key": "full-access-key",
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it("should allow the read-only key to read", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/resource",
      headers: {
        "x-admin-api-key": "read-only-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      access: "read",
    });
  });

  it("should reject a write made with the read-only key", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/admin/resource",
      headers: {
        "x-admin-api-key": "read-only-key",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: {
        code: "ADMIN_API_KEY_READ_ONLY",
        message: "Admin API key is read-only",
        requestId: expect.any(String),
      },
    });
  });

  it("should treat an unconfigured read-only key as invalid", async () => {
    const isolatedApp = Fastify({
      logger: false,
    });

    const middleware = createAdminApiKeyAuthMiddleware({
      headerName: "x-admin-api-key",
      apiKey: "full-access-key",
      readOnlyApiKey: "",
    });

    isolatedApp.get(
      "/internal/admin/read-only-disabled",
      {
        preHandler: middleware,
      },
      async () => ({
        ok: true,
      }),
    );

    try {
      const response = await isolatedApp.inject({
        method: "GET",
        url: "/internal/admin/read-only-disabled",
        headers: {
          "x-admin-api-key": "read-only-key",
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        error: {
          code: "ADMIN_API_KEY_INVALID",
        },
      });
    } finally {
      await isolatedApp.close();
    }
  });

  it("should reject different-length and prefix-like admin API keys", async () => {
    const invalidApiKeys = [
      "full-access",
      "full-access-key-extra",
      "read-only",
      "read-only-key-extra",
    ];

    for (const apiKey of invalidApiKeys) {
      const response = await app.inject({
        method: "GET",
        url: "/internal/admin/resource",
        headers: {
          "x-admin-api-key": apiKey,
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toMatchObject({
        error: {
          code: "ADMIN_API_KEY_INVALID",
          message: "Admin API key is invalid",
          requestId: expect.any(String),
        },
      });
    }
  });
  it("should reject identical full-access and read-only keys", () => {
    expect(() =>
      createAdminApiKeyAuthMiddleware({
        apiKey: "shared-key",
        readOnlyApiKey: "shared-key",
      }),
    ).toThrow(
      "Admin full-access and read-only API keys must be different",
    );
  });
});
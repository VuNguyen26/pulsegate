import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiRejectedEventsSummaryRepository } from "../api-rejections/api-rejected-events-summary.types.js";
import { adminApiRejectionRoute } from "./admin-api-rejection.route.js";

function createRejectedEventsSummaryRepository(): ApiRejectedEventsSummaryRepository {
  return {
    getSummary: vi.fn(async () => ({
      totalRejectedRequests: 6,
      byReason: [
        {
          rejectionReason: "API_KEY_MISSING" as const,
          count: 2,
        },
        {
          rejectionReason: "JWT_TOKEN_INVALID" as const,
          count: 1,
        },
        {
          rejectionReason: "RATE_LIMIT_EXCEEDED" as const,
          count: 3,
        },
      ],
      byStatusCode: [
        {
          statusCode: 401,
          count: 2,
        },
        {
          statusCode: 403,
          count: 1,
        },
        {
          statusCode: 429,
          count: 3,
        },
      ],
      lastRejectedAt: new Date("2026-07-04T10:00:00.000Z"),
    })),
  };
}

async function buildTestApp(options: {
  rejectedEventsSummaryRepository?: ApiRejectedEventsSummaryRepository;
} = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(adminApiRejectionRoute, {
    rejectedEventsSummaryRepository:
      options.rejectedEventsSummaryRepository ??
      createRejectedEventsSummaryRepository(),
  });

  return app;
}

describe("adminApiRejectionRoute", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("should reject summary request when admin API key is missing", async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/api-rejections/summary",
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

  it("should return rejected events summary", async () => {
    const rejectedEventsSummaryRepository =
      createRejectedEventsSummaryRepository();

    app = await buildTestApp({
      rejectedEventsSummaryRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/api-rejections/summary",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        totalRejectedRequests: 6,
        byReason: [
          {
            rejectionReason: "API_KEY_MISSING" as const,
            count: 2,
          },
          {
            rejectionReason: "JWT_TOKEN_INVALID" as const,
            count: 1,
          },
          {
            rejectionReason: "RATE_LIMIT_EXCEEDED" as const,
            count: 3,
          },
        ],
        byStatusCode: [
          {
            statusCode: 401,
            count: 2,
          },
          {
            statusCode: 403,
            count: 1,
          },
          {
            statusCode: 429,
            count: 3,
          },
        ],
        lastRejectedAt: "2026-07-04T10:00:00.000Z",
      },
    });

    expect(rejectedEventsSummaryRepository.getSummary).toHaveBeenCalledTimes(1);
  });
});

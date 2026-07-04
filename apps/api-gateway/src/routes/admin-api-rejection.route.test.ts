import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiRejectedEventsListingRepository } from "../api-rejections/api-rejected-events-listing.types.js";
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

function createRejectedEventsListingRepository(): ApiRejectedEventsListingRepository {
  return {
    listEvents: vi.fn(async (query) => ({
      items: [
        {
          id: "rejected_event_1",
          requestId: "request_1",
          routePath: "/api/products",
          routeMethod: "GET" as const,
          statusCode: 429,
          rejectionReason: "QUOTA_EXCEEDED" as const,
          apiKeyAuthSource: "database",
          apiKeyId: "api_key_1",
          consumerId: "consumer_1",
          metadata: {
            quotaLimit: 1,
            quotaWindow: "DAILY",
          },
          occurredAt: new Date("2026-07-04T11:00:00.000Z"),
        },
      ],
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: 1,
        hasNextPage: false,
      },
      filters: query.filters,
    })),
  };
}

async function buildTestApp(
  options: {
    rejectedEventsSummaryRepository?: ApiRejectedEventsSummaryRepository;
    rejectedEventsListingRepository?: ApiRejectedEventsListingRepository;
  } = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(adminApiRejectionRoute, {
    rejectedEventsSummaryRepository:
      options.rejectedEventsSummaryRepository ??
      createRejectedEventsSummaryRepository(),
    rejectedEventsListingRepository:
      options.rejectedEventsListingRepository ??
      createRejectedEventsListingRepository(),
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

  it("should reject rejected events listing request when admin API key is missing", async () => {
    app = await buildTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/api-rejections/events",
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

  it("should return rejected events listing with default pagination", async () => {
    const rejectedEventsListingRepository =
      createRejectedEventsListingRepository();

    app = await buildTestApp({
      rejectedEventsListingRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/api-rejections/events",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        items: [
          {
            id: "rejected_event_1",
            requestId: "request_1",
            routePath: "/api/products",
            routeMethod: "GET",
            statusCode: 429,
            rejectionReason: "QUOTA_EXCEEDED",
            apiKeyAuthSource: "database",
            apiKeyId: "api_key_1",
            consumerId: "consumer_1",
            metadata: {
              quotaLimit: 1,
              quotaWindow: "DAILY",
            },
            occurredAt: "2026-07-04T11:00:00.000Z",
          },
        ],
        pagination: {
          limit: 20,
          offset: 0,
          total: 1,
          hasNextPage: false,
        },
        filters: {
          from: null,
          to: null,
          rejectionReason: null,
          statusCode: null,
          routePath: null,
          routeMethod: null,
          apiKeyAuthSource: null,
          apiKeyId: null,
          consumerId: null,
        },
      },
    });

    expect(rejectedEventsListingRepository.listEvents).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: {},
    });
  });

  it("should pass rejected events listing filters to repository", async () => {
    const rejectedEventsListingRepository =
      createRejectedEventsListingRepository();

    app = await buildTestApp({
      rejectedEventsListingRepository,
    });

    const query = new URLSearchParams({
      limit: "50",
      offset: "10",
      from: "2026-07-04T00:00:00.000Z",
      to: "2026-07-05T00:00:00.000Z",
      rejectionReason: "quota_exceeded",
      statusCode: "429",
      routePath: "/api/products",
      routeMethod: "get",
      apiKeyAuthSource: "database",
      apiKeyId: "api_key_1",
      consumerId: "consumer_1",
    });

    const response = await app.inject({
      method: "GET",
      url: `/internal/admin/api-rejections/events?${query.toString()}`,
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(rejectedEventsListingRepository.listEvents).toHaveBeenCalledWith({
      limit: 50,
      offset: 10,
      filters: {
        from: new Date("2026-07-04T00:00:00.000Z"),
        to: new Date("2026-07-05T00:00:00.000Z"),
        rejectionReason: "QUOTA_EXCEEDED",
        statusCode: 429,
        routePath: "/api/products",
        routeMethod: "GET",
        apiKeyAuthSource: "database",
        apiKeyId: "api_key_1",
        consumerId: "consumer_1",
      },
    });
  });

  it("should reject invalid rejected events listing query", async () => {
    const rejectedEventsListingRepository =
      createRejectedEventsListingRepository();

    app = await buildTestApp({
      rejectedEventsListingRepository,
    });

    const response = await app.inject({
      method: "GET",
      url: "/internal/admin/api-rejections/events?limit=101",
      headers: {
        "x-admin-api-key": "local-admin-key",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "limit must be an integer between 1 and 100",
        requestId: expect.any(String),
      },
    });

    expect(rejectedEventsListingRepository.listEvents).not.toHaveBeenCalled();
  });
});

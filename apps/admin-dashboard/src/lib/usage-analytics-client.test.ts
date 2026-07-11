import { describe, expect, it, vi } from "vitest";

import {
  loadDashboardApiKeyQuotaState,
  loadDashboardApiKeyUsageSummary,
  loadDashboardConsumerUsageSummary,
  loadDashboardUsageEvents,
  loadDashboardUsagePlanUsageSummary,
} from "./usage-analytics-client";

const usageSummary = {
  subjectType: "consumer",
  subjectId: "consumer_mobile",
  totalRequests: 10,
  successfulRequests: 9,
  errorRequests: 1,
  averageDurationMs: 12.5,
  cacheHits: 2,
  cacheMisses: 7,
  cacheBypasses: 1,
  lastRequestAt: "2026-07-11T01:00:00.000Z",
} as const;

describe("successful usage browser loaders", () => {
  it("loads a consumer summary through the fixed BFF path", async () => {
    const fetchMock = vi.fn(
      async (..._args: Parameters<typeof fetch>) =>
        Response.json({
          data: usageSummary,
        }),
    );

    const result =
      await loadDashboardConsumerUsageSummary(
        "consumer_mobile",
        {
          routeMethod: "GET",
          statusCode: 200,
        },
        fetchMock,
      );

    expect(result).toEqual({
      status: "success",
      data: usageSummary,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/usage/consumers/consumer_mobile/summary?routeMethod=GET&statusCode=200",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      }),
    );
  });

  it("loads API-key summary and quota from separate paths", async () => {
    const summaryFetch = vi.fn(
      async (..._args: Parameters<typeof fetch>) =>
        Response.json({
          data: {
            ...usageSummary,
            subjectType: "apiKey",
            subjectId: "api_key_1",
          },
        }),
    );

    const quotaFetch = vi.fn(
      async (..._args: Parameters<typeof fetch>) =>
        Response.json({
          data: {
            apiKeyId: "api_key_1",
            consumerId: null,
            reason: "NO_USAGE_PLAN",
            usagePlan: null,
            quota: {
              usedRequests: 0,
              remainingRequests: null,
              windowStartedAt: null,
              windowEndsAt: null,
              resetAt: null,
              exceeded: false,
              enforced: false,
            },
          },
        }),
    );

    expect(
      await loadDashboardApiKeyUsageSummary(
        "api_key_1",
        {},
        summaryFetch,
      ),
    ).toMatchObject({
      status: "success",
    });

    expect(
      await loadDashboardApiKeyQuotaState(
        "api_key_1",
        quotaFetch,
      ),
    ).toMatchObject({
      status: "success",
    });

    expect(summaryFetch.mock.calls[0]?.[0]).toBe(
      "/api/admin/usage/api-keys/api_key_1/summary",
    );

    expect(quotaFetch.mock.calls[0]?.[0]).toBe(
      "/api/admin/api-keys/api_key_1/quota",
    );
  });

  it("loads a usage-plan summary through its fixed path", async () => {
    const fetchMock = vi.fn(
      async (..._args: Parameters<typeof fetch>) =>
        Response.json({
          data: {
            usagePlan: {
              id: "plan_starter",
              name: "Starter",
              quotaLimit: 1000,
              quotaWindow: "DAILY",
              enabled: true,
            },
            windowStartedAt:
              "2026-07-11T00:00:00.000Z",
            windowEndsAt:
              "2026-07-12T00:00:00.000Z",
            resetAt:
              "2026-07-12T00:00:00.000Z",
            assignedApiKeys: 0,
            activeApiKeys: 0,
            totalRequestsInCurrentWindow: 0,
            exceededApiKeys: 0,
            nearLimitApiKeys: 0,
            topApiKeysByUsage: [],
          },
        }),
    );

    const result =
      await loadDashboardUsagePlanUsageSummary(
        "plan_starter",
        fetchMock,
      );

    expect(result).toMatchObject({
      status: "success",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/admin/usage-plans/plan_starter/usage-summary",
    );
  });

  it("loads successful events with cursor-only pagination", async () => {
    const fetchMock = vi.fn(
      async (..._args: Parameters<typeof fetch>) =>
        Response.json({
          data: {
            items: [],
            pagination: {
              limit: 20,
              offset: 0,
              total: 0,
              hasNextPage: false,
              nextCursor: null,
            },
            filters: {
              from: null,
              to: null,
              routePath: null,
              routeMethod: null,
              statusCode: null,
              cacheStatus: null,
              apiKeyAuthSource: null,
              apiKeyId: null,
              consumerId: null,
            },
          },
        }),
    );

    const result = await loadDashboardUsageEvents(
      {
        consumerId: "consumer_mobile",
        cursor: "opaque_cursor_1",
      },
      fetchMock,
    );

    expect(result).toMatchObject({
      status: "success",
    });

    const path = fetchMock.mock.calls[0]?.[0];

    expect(path).toBe(
      "/api/admin/usage/events?consumerId=consumer_mobile&limit=20&cursor=opaque_cursor_1",
    );
    expect(String(path)).not.toContain("offset=");
    expect(String(path)).not.toContain(
      "rollupSummary",
    );
  });

  it("rejects invalid identifiers and runtime query keys before fetch", async () => {
    const fetchMock = vi.fn();

    const invalidIdentifier =
      await loadDashboardApiKeyQuotaState(
        "../api-key",
        fetchMock,
      );

    const invalidQuery =
      await loadDashboardUsageEvents(
        {
          offset: 20,
        } as never,
        fetchMock,
      );

    expect(invalidIdentifier).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(invalidQuery).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed on mismatched identity and sensitive fields", async () => {
    const mismatch =
      await loadDashboardConsumerUsageSummary(
        "consumer_mobile",
        {},
        vi.fn(
          async (..._args: Parameters<typeof fetch>) =>
            Response.json({
              data: {
                ...usageSummary,
                subjectId: "consumer_other",
              },
            }),
        ),
      );

    const sensitive =
      await loadDashboardApiKeyUsageSummary(
        "api_key_1",
        {},
        vi.fn(
          async (..._args: Parameters<typeof fetch>) =>
            Response.json({
              data: {
                ...usageSummary,
                subjectType: "apiKey",
                subjectId: "api_key_1",
                rawKey: "secret",
              },
            }),
        ),
      );

    expect(mismatch).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(sensitive).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("preserves a normalized BFF query error", async () => {
    const result = await loadDashboardUsageEvents(
      {},
      vi.fn(
        async (..._args: Parameters<typeof fetch>) =>
          Response.json(
            {
              error: {
                code:
                  "ADMIN_DASHBOARD_INVALID_QUERY",
                message:
                  "limit must be between 1 and 100.",
                requestId: "request-1",
              },
            },
            {
              status: 400,
            },
          ),
      ),
    );

    expect(result).toEqual({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        message:
          "limit must be between 1 and 100.",
        requestId: "request-1",
      },
    });
  });
});

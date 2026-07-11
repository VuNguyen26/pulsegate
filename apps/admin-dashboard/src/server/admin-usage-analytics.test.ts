import { describe, expect, it, vi } from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminApiKeyQuotaState,
  fetchAdminApiKeyUsageSummary,
  fetchAdminConsumerUsageSummary,
  fetchAdminUsageEvents,
  fetchAdminUsagePlanUsageSummary,
} from "./admin-usage-analytics";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "read-only-secret",
  requestTimeoutMs: 1_000,
  accessMode: "read-only",
};

const summary = {
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

describe("successful usage analytics readers", () => {
  it("uses the fixed consumer summary endpoint and bounded filters", async () => {
    const fetchMock = vi.fn(async (..._args: Parameters<typeof fetch>) =>
      Response.json({
        data: summary,
      }),
    );

    const result =
      await fetchAdminConsumerUsageSummary(
        config,
        "consumer_mobile",
        {
          routeMethod: "GET",
          statusCode: 200,
        },
        fetchMock,
      );

    expect(result).toMatchObject({
      ok: true,
      data: summary,
    });

    const requestedUrl = fetchMock.mock.calls[0]?.[0];

    expect(requestedUrl).toEqual(
      new URL(
        "/internal/admin/usage/consumers/consumer_mobile/summary?routeMethod=GET&statusCode=200",
        config.gatewayBaseUrl,
      ),
    );
  });

  it("uses the fixed API-key summary and quota endpoints", async () => {
    const summaryFetch = vi.fn(async (..._args: Parameters<typeof fetch>) =>
      Response.json({
        data: {
          ...summary,
          subjectType: "apiKey",
          subjectId: "api_key_1",
        },
      }),
    );

    const quotaFetch = vi.fn(async (..._args: Parameters<typeof fetch>) =>
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
      await fetchAdminApiKeyUsageSummary(
        config,
        "api_key_1",
        {},
        summaryFetch,
      ),
    ).toMatchObject({
      ok: true,
    });

    expect(
      await fetchAdminApiKeyQuotaState(
        config,
        "api_key_1",
        quotaFetch,
      ),
    ).toMatchObject({
      ok: true,
    });

    expect(summaryFetch.mock.calls[0]?.[0]).toEqual(
      new URL(
        "/internal/admin/usage/api-keys/api_key_1/summary",
        config.gatewayBaseUrl,
      ),
    );

    expect(quotaFetch.mock.calls[0]?.[0]).toEqual(
      new URL(
        "/internal/admin/api-keys/api_key_1/quota",
        config.gatewayBaseUrl,
      ),
    );
  });

  it("uses the fixed usage-plan summary endpoint", async () => {
    const fetchMock = vi.fn(async (..._args: Parameters<typeof fetch>) =>
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
      await fetchAdminUsagePlanUsageSummary(
        config,
        "plan_starter",
        fetchMock,
      );

    expect(result).toMatchObject({
      ok: true,
    });

    expect(fetchMock.mock.calls[0]?.[0]).toEqual(
      new URL(
        "/internal/admin/usage-plans/plan_starter/usage-summary",
        config.gatewayBaseUrl,
      ),
    );
  });

  it("uses cursor-only successful event pagination", async () => {
    const fetchMock = vi.fn(async (..._args: Parameters<typeof fetch>) =>
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

    const result = await fetchAdminUsageEvents(
      config,
      {
        consumerId: "consumer_mobile",
        limit: 20,
        cursor: "opaque_cursor_1",
      },
      fetchMock,
    );

    expect(result).toMatchObject({
      ok: true,
    });

    const requestedUrl = fetchMock.mock.calls[0]?.[0];

    expect(requestedUrl).toEqual(
      new URL(
        "/internal/admin/usage/events?consumerId=consumer_mobile&limit=20&cursor=opaque_cursor_1",
        config.gatewayBaseUrl,
      ),
    );

    expect(String(requestedUrl)).not.toContain(
      "offset=",
    );
    expect(String(requestedUrl)).not.toContain(
      "rollupSummary",
    );
  });

  it("rejects invalid identifiers and unsupported query keys before Gateway", async () => {
    const fetchMock = vi.fn();

    const invalidId =
      await fetchAdminConsumerUsageSummary(
        config,
        "../consumer",
        {},
        fetchMock,
      );

    const invalidQuery =
      await fetchAdminUsageEvents(
        config,
        {
          offset: 20,
        } as never,
        fetchMock,
      );

    expect(invalidId).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(invalidQuery).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed on mismatched subject identity", async () => {
    const result =
      await fetchAdminConsumerUsageSummary(
        config,
        "consumer_mobile",
        {},
        vi.fn(async (..._args: Parameters<typeof fetch>) =>
          Response.json({
            data: {
              ...summary,
              subjectId: "consumer_other",
            },
          }),
        ),
      );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });
});

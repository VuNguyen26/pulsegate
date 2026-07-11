import { describe, expect, it, vi } from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminRejectedEvents,
  fetchAdminRejectedEventsSummary,
} from "./admin-rejected-analytics";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "read-only-secret",
  requestTimeoutMs: 1_000,
  accessMode: "read-only",
};

const filters = {
  from: null,
  to: null,
  rejectionReason: null,
  statusCode: null,
  routePath: null,
  routeMethod: null,
  apiKeyAuthSource: null,
  apiKeyId: null,
  consumerId: null,
} as const;

describe("rejected analytics server readers", () => {
  it("uses the fixed rejected summary endpoint", async () => {
    const fetchMock = vi.fn(
      async (..._args: Parameters<typeof fetch>) =>
        Response.json({
          data: {
            totalRejectedRequests: 3,
            byReason: [
              {
                rejectionReason:
                  "RATE_LIMIT_EXCEEDED",
                count: 3,
              },
            ],
            byStatusCode: [
              {
                statusCode: 429,
                count: 3,
              },
            ],
            lastRejectedAt:
              "2026-07-11T02:00:00.000Z",
            filters: {
              ...filters,
              statusCode: 429,
            },
          },
        }),
    );

    const result =
      await fetchAdminRejectedEventsSummary(
        config,
        {
          statusCode: 429,
        },
        fetchMock,
      );

    expect(result).toMatchObject({
      ok: true,
      accessMode: "read-only",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toEqual(
      new URL(
        "/internal/admin/api-rejections/summary?statusCode=429",
        config.gatewayBaseUrl,
      ),
    );
  });

  it("uses cursor pagination and removes metadata", async () => {
    const fetchMock = vi.fn(
      async (..._args: Parameters<typeof fetch>) =>
        Response.json({
          data: {
            items: [
              {
                id: "rejected_event_1",
                requestId: "request-1",
                routePath: "/api/products",
                routeMethod: "GET",
                statusCode: 429,
                rejectionReason:
                  "QUOTA_EXCEEDED",
                apiKeyAuthSource: "database",
                apiKeyId: "api_key_1",
                consumerId: "consumer_1",
                metadata: {
                  quotaLimit: 1000,
                  quotaWindow: "DAILY",
                },
                occurredAt:
                  "2026-07-11T02:00:00.000Z",
              },
            ],
            pagination: {
              limit: 20,
              offset: 0,
              total: 2,
              hasNextPage: true,
              nextCursor: "opaque_cursor_2",
            },
            filters,
          },
        }),
    );

    const result = await fetchAdminRejectedEvents(
      config,
      {
        consumerId: "consumer_1",
        cursor: "opaque_cursor_1",
      },
      fetchMock,
    );

    expect(result).toMatchObject({
      ok: true,
      data: {
        items: [
          {
            id: "rejected_event_1",
            rejectionReason: "QUOTA_EXCEEDED",
          },
        ],
      },
    });

    if (!result.ok) {
      throw new Error(
        "Expected successful rejected listing.",
      );
    }

    expect(result.data.items[0]).not.toHaveProperty(
      "metadata",
    );

    const requestedUrl =
      fetchMock.mock.calls[0]?.[0];

    expect(requestedUrl).toEqual(
      new URL(
        "/internal/admin/api-rejections/events?consumerId=consumer_1&limit=20&cursor=opaque_cursor_1",
        config.gatewayBaseUrl,
      ),
    );

    expect(String(requestedUrl)).not.toContain(
      "offset=",
    );
  });

  it("rejects unsupported runtime query keys before fetch", async () => {
    const fetchMock = vi.fn();

    const summaryResult =
      await fetchAdminRejectedEventsSummary(
        config,
        {
          rollupSummaryRuntimeRead: true,
        } as never,
        fetchMock,
      );

    const eventsResult =
      await fetchAdminRejectedEvents(
        config,
        {
          offset: 20,
        } as never,
        fetchMock,
      );

    expect(summaryResult).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(eventsResult).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed on inconsistent rejected totals", async () => {
    const result =
      await fetchAdminRejectedEventsSummary(
        config,
        {},
        vi.fn(
          async (..._args: Parameters<typeof fetch>) =>
            Response.json({
              data: {
                totalRejectedRequests: 3,
                byReason: [
                  {
                    rejectionReason:
                      "API_KEY_MISSING",
                    count: 2,
                  },
                ],
                byStatusCode: [
                  {
                    statusCode: 401,
                    count: 3,
                  },
                ],
                lastRejectedAt:
                  "2026-07-11T02:00:00.000Z",
                filters,
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

  it("fails closed on sensitive metadata", async () => {
    const result = await fetchAdminRejectedEvents(
      config,
      {},
      vi.fn(
        async (..._args: Parameters<typeof fetch>) =>
          Response.json({
            data: {
              items: [
                {
                  id: "rejected_event_1",
                  requestId: "request-1",
                  routePath: null,
                  routeMethod: null,
                  statusCode: 401,
                  rejectionReason:
                    "API_KEY_MISSING",
                  apiKeyAuthSource: null,
                  apiKeyId: null,
                  consumerId: null,
                  metadata: {
                    rawKey: "must-not-pass",
                  },
                  occurredAt:
                    "2026-07-11T02:00:00.000Z",
                },
              ],
              pagination: {
                limit: 20,
                offset: 0,
                total: 1,
                hasNextPage: false,
                nextCursor: null,
              },
              filters,
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

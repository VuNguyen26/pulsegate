import { describe, expect, it, vi } from "vitest";

import {
  loadDashboardRejectedEvents,
  loadDashboardRejectedEventsSummary,
} from "./rejected-analytics-client";

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

describe("rejected analytics browser loaders", () => {
  it("loads a rejected summary through the fixed BFF path", async () => {
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
      await loadDashboardRejectedEventsSummary(
        {
          statusCode: 429,
        },
        fetchMock,
      );

    expect(result).toMatchObject({
      status: "success",
      data: {
        totalRejectedRequests: 3,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/api-rejections/summary?statusCode=429",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      }),
    );
  });

  it("loads rejected events with cursor-only pagination", async () => {
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

    const result =
      await loadDashboardRejectedEvents(
        {
          rejectionReason:
            "QUOTA_EXCEEDED",
          cursor: "opaque_cursor_1",
        },
        fetchMock,
      );

    expect(result).toMatchObject({
      status: "success",
      data: {
        items: [
          {
            id: "rejected_event_1",
            rejectionReason:
              "QUOTA_EXCEEDED",
          },
        ],
      },
    });

    const path = fetchMock.mock.calls[0]?.[0];

    expect(path).toBe(
      "/api/admin/api-rejections/events?rejectionReason=QUOTA_EXCEEDED&limit=20&cursor=opaque_cursor_1",
    );
    expect(String(path)).not.toContain("offset=");
    expect(String(path)).not.toContain(
      "metadata",
    );
  });

  it("rejects unsupported runtime query keys before fetch", async () => {
    const fetchMock = vi.fn();

    const summaryResult =
      await loadDashboardRejectedEventsSummary(
        {
          rollupSummaryRuntimeRead: true,
        } as never,
        fetchMock,
      );

    const eventsResult =
      await loadDashboardRejectedEvents(
        {
          offset: 20,
        } as never,
        fetchMock,
      );

    expect(summaryResult).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(eventsResult).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when metadata appears in the browser DTO", async () => {
    const result = await loadDashboardRejectedEvents(
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
                    quotaLimit: 100,
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
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("fails closed on inconsistent summary totals", async () => {
    const result =
      await loadDashboardRejectedEventsSummary(
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
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("preserves normalized BFF errors", async () => {
    const result =
      await loadDashboardRejectedEvents(
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

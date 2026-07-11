import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminRollups,
} from "./admin-rollups";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "read-only-secret",
  requestTimeoutMs: 1_000,
  accessMode: "read-only",
};

const usageRollups = {
  source: "usage",
  granularity: "hour",
  window: {
    requestedFrom:
      "2026-07-05T10:15:00.000Z",
    requestedTo:
      "2026-07-05T13:00:00.000Z",
    rebuildFrom:
      "2026-07-05T10:00:00.000Z",
    rebuildTo:
      "2026-07-05T13:00:00.000Z",
    bucketCount: 3,
  },
  limit: 25,
  filters: {
    routePath: null,
    routeMethod: "GET",
    statusCode: 200,
    apiKeyAuthSource: null,
    apiKeyId: null,
    consumerId: null,
    cacheStatus: "HIT",
  },
  items: [],
} as const;

describe("fetchAdminRollups", () => {
  it("uses the fixed read-only Gateway endpoint", async () => {
    const fetchMock = vi.fn(
      async (
        ..._args: Parameters<typeof fetch>
      ) =>
        Response.json({
          data: usageRollups,
        }),
    );

    const result = await fetchAdminRollups(
      config,
      {
        from:
          "2026-07-05T10:15:00.000Z",
        to:
          "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "usage",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "HIT",
        limit: 25,
      },
      fetchMock,
    );

    expect(result).toEqual({
      ok: true,
      accessMode: "read-only",
      data: usageRollups,
    });

    expect(
      fetchMock.mock.calls[0]?.[0],
    ).toEqual(
      new URL(
        "/internal/admin/analytics/rollups?from=2026-07-05T10%3A15%3A00.000Z&to=2026-07-05T13%3A00%3A00.000Z&granularity=hour&source=usage&routeMethod=GET&statusCode=200&cacheStatus=HIT&limit=25",
        config.gatewayBaseUrl,
      ),
    );

    expect(
      fetchMock.mock.calls[0]?.[1],
    ).toMatchObject({
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "x-admin-api-key":
          "read-only-secret",
      },
    });
  });

  it("fails before Gateway for an invalid typed query", async () => {
    const fetchMock = vi.fn();

    const result = await fetchAdminRollups(
      config,
      {
        from:
          "2026-07-05T13:00:00.000Z",
        to:
          "2026-07-05T10:15:00.000Z",
        granularity: "hour",
        source: "usage",
        limit: 25,
      },
      fetchMock,
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code:
          "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed on an invalid Gateway DTO", async () => {
    const result = await fetchAdminRollups(
      config,
      {
        from:
          "2026-07-05T10:15:00.000Z",
        to:
          "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "usage",
        limit: 25,
      },
      vi.fn(
        async (
          ..._args: Parameters<typeof fetch>
        ) =>
          Response.json({
            data: {
              ...usageRollups,
              readOnlyApiKey: "leaked",
            },
          }),
      ),
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code:
          "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });
});
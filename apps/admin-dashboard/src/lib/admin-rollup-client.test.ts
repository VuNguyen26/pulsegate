import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  loadDashboardRollups,
} from "./admin-rollup-client";

const query = {
  from: "2026-07-05T10:00:00.000Z",
  to: "2026-07-05T13:00:00.000Z",
  granularity: "hour",
  source: "usage",
  limit: 25,
} as const;

const data = {
  source: "usage",
  granularity: "hour",
  window: {
    requestedFrom:
      "2026-07-05T10:00:00.000Z",
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
    routeMethod: null,
    statusCode: null,
    apiKeyAuthSource: null,
    apiKeyId: null,
    consumerId: null,
    cacheStatus: null,
  },
  items: [],
} as const;

describe("loadDashboardRollups", () => {
  it("loads a bounded no-store BFF resource", async () => {
    const fetchMock = vi.fn(
      async (
        ..._args: Parameters<typeof fetch>
      ) =>
        Response.json({
          data,
        }),
    );

    const result =
      await loadDashboardRollups(
        query,
        fetchMock,
      );

    expect(result).toEqual({
      status: "success",
      data,
    });

    expect(
      fetchMock.mock.calls[0]?.[0],
    ).toBe(
      "/api/admin/analytics/rollups?from=2026-07-05T10%3A00%3A00.000Z&to=2026-07-05T13%3A00%3A00.000Z&granularity=hour&source=usage&limit=25",
    );

    expect(
      fetchMock.mock.calls[0]?.[1],
    ).toMatchObject({
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });
  });

  it("rejects an invalid query before fetch", async () => {
    const fetchMock = vi.fn();

    const result =
      await loadDashboardRollups(
        {
          ...query,
          from:
            "2026-07-05T14:00:00.000Z",
        },
        fetchMock,
      );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code:
          "ADMIN_DASHBOARD_INVALID_QUERY",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed on an invalid DTO", async () => {
    const result =
      await loadDashboardRollups(
        query,
        vi.fn(
          async (
            ..._args: Parameters<typeof fetch>
          ) =>
            Response.json({
              data: {
                ...data,
                secret: "must-not-render",
              },
            }),
        ),
      );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code:
          "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });
});
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseAdminRollupRequestQuery,
} from "./admin-rollup-route";

describe("parseAdminRollupRequestQuery", () => {
  it("normalizes an allowlisted rollup query", () => {
    const result =
      parseAdminRollupRequestQuery(
        new Request(
          "http://dashboard.local/api/admin/analytics/rollups?from=2026-07-05T10%3A15%3A00Z&to=2026-07-05T13%3A00%3A00Z&granularity=hour&source=usage&routeMethod=get&limit=25",
        ),
      );

    expect(result).toEqual({
      ok: true,
      query: {
        from:
          "2026-07-05T10:15:00.000Z",
        to:
          "2026-07-05T13:00:00.000Z",
        granularity: "hour",
        source: "usage",
        routeMethod: "GET",
        limit: 25,
      },
    });
  });

  it("returns a no-store 400 response for invalid filters", async () => {
    const result =
      parseAdminRollupRequestQuery(
        new Request(
          "http://dashboard.local/api/admin/analytics/rollups?from=2026-07-05T10%3A15%3A00Z&to=2026-07-05T13%3A00%3A00Z&granularity=hour&source=rejected&cacheStatus=HIT",
        ),
      );

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error(
        "Expected invalid rollup query.",
      );
    }

    expect(result.response.status).toBe(400);
    expect(
      result.response.headers.get(
        "cache-control",
      ),
    ).toBe("no-store");

    await expect(
      result.response.json(),
    ).resolves.toMatchObject({
      error: {
        code:
          "ADMIN_DASHBOARD_INVALID_QUERY",
        requestId: null,
      },
    });
  });
});
import { describe, expect, it } from "vitest";

import {
  DASHBOARD_ROLLUP_DEFAULT_LIMIT,
  parseDashboardRollupSearchParams,
  serializeDashboardRollupQuery,
} from "./admin-rollup-query";

describe("parseDashboardRollupSearchParams", () => {
  it("normalizes a bounded usage rollup query", () => {
    const result =
      parseDashboardRollupSearchParams(
        new URLSearchParams({
          from: "2026-07-01T00:00:00Z",
          to: "2026-07-02T00:00:00Z",
          granularity: "hour",
          source: "usage",
          routeMethod: "get",
          cacheStatus: "hit",
          statusCode: "200",
        }),
      );

    expect(result).toEqual({
      ok: true,
      value: {
        from: "2026-07-01T00:00:00.000Z",
        to: "2026-07-02T00:00:00.000Z",
        granularity: "hour",
        source: "usage",
        routeMethod: "GET",
        statusCode: 200,
        cacheStatus: "HIT",
        limit: DASHBOARD_ROLLUP_DEFAULT_LIMIT,
      },
    });
  });

  it("rejects unknown and duplicate keys", () => {
    expect(
      parseDashboardRollupSearchParams(
        new URLSearchParams(
          "from=2026-07-01T00%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z&granularity=hour&source=usage&offset=1",
        ),
      ),
    ).toMatchObject({
      ok: false,
      error: {
        field: "offset",
      },
    });

    expect(
      parseDashboardRollupSearchParams(
        new URLSearchParams(
          "from=2026-07-01T00%3A00%3A00Z&from=2026-07-01T01%3A00%3A00Z&to=2026-07-02T00%3A00%3A00Z&granularity=hour&source=usage",
        ),
      ),
    ).toMatchObject({
      ok: false,
      error: {
        field: "from",
      },
    });
  });

  it("rejects source-specific filter mismatches", () => {
    expect(
      parseDashboardRollupSearchParams(
        new URLSearchParams({
          from: "2026-07-01T00:00:00Z",
          to: "2026-07-02T00:00:00Z",
          granularity: "hour",
          source: "rejected",
          cacheStatus: "HIT",
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: {
        field: "cacheStatus",
      },
    });
  });

  it("enforces Dashboard bucket and result bounds", () => {
    expect(
      parseDashboardRollupSearchParams(
        new URLSearchParams({
          from: "2026-01-01T00:00:00Z",
          to: "2026-03-01T00:00:00Z",
          granularity: "hour",
          source: "usage",
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: {
        field: "to",
      },
    });

    expect(
      parseDashboardRollupSearchParams(
        new URLSearchParams({
          from: "2026-07-01T00:00:00Z",
          to: "2026-07-02T00:00:00Z",
          granularity: "hour",
          source: "usage",
          limit: "101",
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: {
        field: "limit",
      },
    });
  });

  it("serializes in stable allowlisted order", () => {
    const result = serializeDashboardRollupQuery({
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-02T00:00:00.000Z",
      granularity: "hour",
      source: "rejected",
      routeMethod: "get",
      rejectionReason: "api_key_missing",
      limit: 25,
    });

    expect(result).toEqual({
      ok: true,
      value:
        "from=2026-07-01T00%3A00%3A00.000Z&to=2026-07-02T00%3A00%3A00.000Z&granularity=hour&source=rejected&routeMethod=GET&rejectionReason=API_KEY_MISSING&limit=25",
    });
  });
});
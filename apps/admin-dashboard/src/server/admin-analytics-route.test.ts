import { describe, expect, it } from "vitest";

import {
  createAdminAnalyticsReadResponse,
  parseAdminAnalyticsRequestQuery,
  rejectAdminAnalyticsRequestQuery,
} from "./admin-analytics-route";

describe("parseAdminAnalyticsRequestQuery", () => {
  it("normalizes an allowlisted event query", () => {
    const result =
      parseAdminAnalyticsRequestQuery(
        new Request(
          "http://dashboard.local/api/admin/usage/events?routeMethod=get&limit=25",
        ),
        "usage-events",
      );

    expect(result).toEqual({
      ok: true,
      query: {
        routeMethod: "GET",
        limit: 25,
      },
    });
  });

  it("returns a no-store 400 response for offset", async () => {
    const result =
      parseAdminAnalyticsRequestQuery(
        new Request(
          "http://dashboard.local/api/admin/usage/events?offset=20",
        ),
        "usage-events",
      );

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected invalid query.");
    }

    expect(result.response.status).toBe(400);
    expect(
      result.response.headers.get("cache-control"),
    ).toBe("no-store");

    await expect(
      result.response.json(),
    ).resolves.toEqual({
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        message:
          "offset is not supported for usage-events.",
        requestId: null,
      },
    });
  });
});

describe("rejectAdminAnalyticsRequestQuery", () => {
  it("allows a resource request without query parameters", () => {
    expect(
      rejectAdminAnalyticsRequestQuery(
        new Request(
          "http://dashboard.local/api/admin/api-keys/api_key_1/quota",
        ),
      ),
    ).toBeNull();
  });

  it("rejects query parameters on fixed no-query resources", async () => {
    const response =
      rejectAdminAnalyticsRequestQuery(
        new Request(
          "http://dashboard.local/api/admin/api-keys/api_key_1/quota?offset=1",
        ),
      );

    expect(response?.status).toBe(400);
    expect(
      response?.headers.get("cache-control"),
    ).toBe("no-store");

    await expect(response?.json()).resolves.toMatchObject({
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
      },
    });
  });
});

describe("createAdminAnalyticsReadResponse", () => {
  it("maps successful read results with no-store", async () => {
    const response =
      createAdminAnalyticsReadResponse({
        ok: true,
        accessMode: "read-only",
        data: {
          totalRequests: 10,
        },
      });

    expect(response.status).toBe(200);
    expect(
      response.headers.get("cache-control"),
    ).toBe("no-store");

    await expect(response.json()).resolves.toEqual({
      data: {
        totalRequests: 10,
      },
    });
  });

  it("preserves normalized read errors", async () => {
    const response =
      createAdminAnalyticsReadResponse({
        ok: false,
        error: {
          code: "ADMIN_DASHBOARD_NOT_FOUND",
          message:
            "The requested PulseGate resource was not found.",
          status: 404,
          requestId: "request-1",
        },
      });

    expect(response.status).toBe(404);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "ADMIN_DASHBOARD_NOT_FOUND",
        message:
          "The requested PulseGate resource was not found.",
        requestId: "request-1",
      },
    });
  });
});

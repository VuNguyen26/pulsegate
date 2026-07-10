import { describe, expect, it, vi } from "vitest";

import {
  DASHBOARD_ADMIN_RESOURCE_PATHS,
  type DashboardAdminResource,
} from "./admin-resource-contract";
import { loadDashboardAdminResource } from "./admin-resource";

type TestItem = {
  id: string;
};

function isTestItemArray(
  value: unknown,
): value is TestItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "string",
    )
  );
}

describe("loadDashboardAdminResource", () => {
  it("calls only the fixed browser-facing BFF GET endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [
          {
            id: "consumer_1",
          },
        ],
      }),
    );

    await loadDashboardAdminResource(
      "consumers",
      isTestItemArray,
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      DASHBOARD_ADMIN_RESOURCE_PATHS.consumers,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );

    expect(
      JSON.stringify(fetchMock.mock.calls),
    ).not.toContain("x-admin-api-key");
  });

  it("rejects an invalid resource name before fetch", async () => {
    const fetchMock = vi.fn();

    const result = await loadDashboardAdminResource(
      "arbitrary-path" as DashboardAdminResource,
      isTestItemArray,
      fetchMock,
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("accepts a valid safe response", async () => {
    const result = await loadDashboardAdminResource(
      "routes",
      isTestItemArray,
      async () =>
        Response.json({
          data: [
            {
              id: "route_1",
            },
          ],
        }),
    );

    expect(result).toEqual({
      status: "success",
      data: [
        {
          id: "route_1",
        },
      ],
    });
  });

  it("rejects API key material in a browser response", async () => {
    const result = await loadDashboardAdminResource(
      "consumers",
      isTestItemArray,
      async () =>
        Response.json({
          data: [
            {
              id: "consumer_1",
              keyHash: "must-not-reach-browser",
            },
          ],
        }),
    );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "must-not-reach-browser",
    );
  });

  it("preserves only a normalized safe BFF error", async () => {
    const result = await loadDashboardAdminResource(
      "usagePlans",
      isTestItemArray,
      async () =>
        Response.json(
          {
            error: {
              code: "ADMIN_DASHBOARD_FORBIDDEN",
              message:
                "The Dashboard is not permitted to read this resource.",
              requestId: "request-403",
              upstreamStack: "must-be-ignored",
            },
          },
          {
            status: 403,
          },
        ),
    );

    expect(result).toEqual({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_FORBIDDEN",
        message:
          "The Dashboard is not permitted to read this resource.",
        requestId: "request-403",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "must-be-ignored",
    );
  });

  it("normalizes browser-to-BFF network failures", async () => {
    const result = await loadDashboardAdminResource(
      "routes",
      isTestItemArray,
      async () => {
        throw new Error("private network detail");
      },
    );

    expect(result).toEqual({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_UNAVAILABLE",
        message:
          "The Dashboard admin resource endpoint is unavailable.",
        requestId: null,
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "private network detail",
    );
  });
});

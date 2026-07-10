import { describe, expect, it, vi } from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminUsagePlanById,
  fetchAdminUsagePlans,
} from "./admin-usage-plans";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "server-only-read-key",
  requestTimeoutMs: 100,
  accessMode: "read-only",
};

const validUsagePlan = {
  id: "plan_starter",
  name: "Starter",
  description: "Starter daily quota",
  quotaLimit: 1000,
  quotaWindow: "DAILY",
  enabled: true,
  createdAt: "2026-07-04T00:00:00.000Z",
  updatedAt: "2026-07-04T01:00:00.000Z",
  createdBy: "admin",
  updatedBy: "admin",
};

describe("admin usage plan readers", () => {
  it("uses the allowlisted Gateway list endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [validUsagePlan],
      }),
    );

    const result = await fetchAdminUsagePlans(
      config,
      fetchMock,
    );

    expect(result).toEqual({
      ok: true,
      accessMode: "read-only",
      data: [validUsagePlan],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "/internal/admin/usage-plans",
        config.gatewayBaseUrl,
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key":
            "server-only-read-key",
        },
      }),
    );
  });

  it("uses the fixed detail endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: validUsagePlan,
      }),
    );

    const result = await fetchAdminUsagePlanById(
      config,
      "plan_starter",
      fetchMock,
    );

    expect(result).toEqual({
      ok: true,
      accessMode: "read-only",
      data: validUsagePlan,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "/internal/admin/usage-plans/plan_starter",
        config.gatewayBaseUrl,
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key":
            "server-only-read-key",
        },
      }),
    );
  });

  it("rejects an invalid detail id before Gateway", async () => {
    const fetchMock = vi.fn();

    const result = await fetchAdminUsagePlanById(
      config,
      "../plan",
      fetchMock,
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_NOT_FOUND",
        message:
          "The selected usage plan was not found.",
        status: 404,
        requestId: null,
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed on a mismatched detail identity", async () => {
    const result = await fetchAdminUsagePlanById(
      config,
      "plan_starter",
      async () =>
        Response.json({
          data: {
            ...validUsagePlan,
            id: "plan_enterprise",
          },
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("normalizes a missing plan response", async () => {
    const result = await fetchAdminUsagePlanById(
      config,
      "plan_starter",
      async () =>
        Response.json(
          {
            error: {
              code: "USAGE_PLAN_NOT_FOUND",
              message: "raw Gateway detail",
              requestId: "request-404",
            },
          },
          {
            status: 404,
          },
        ),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_NOT_FOUND",
        message:
          "The selected usage plan was not found.",
        status: 404,
        requestId: "request-404",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "raw Gateway detail",
    );
  });

  it("rejects sensitive response fields", async () => {
    const result = await fetchAdminUsagePlanById(
      config,
      "plan_starter",
      async () =>
        Response.json({
          data: {
            ...validUsagePlan,
            rawKey: "must-not-cross-boundary",
          },
        }),
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "must-not-cross-boundary",
    );
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  MAX_DASHBOARD_USAGE_PLANS,
  formatDashboardQuotaLimit,
  getDashboardUsagePlanPath,
  isDashboardUsagePlanId,
  isDashboardUsagePlanList,
  loadDashboardUsagePlan,
  loadDashboardUsagePlans,
  summarizeDashboardUsagePlans,
  type DashboardUsagePlan,
} from "./usage-plans";

const starterPlan: DashboardUsagePlan = {
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

const enterprisePlan: DashboardUsagePlan = {
  ...starterPlan,
  id: "plan_enterprise",
  name: "Enterprise",
  description: null,
  quotaLimit: 100000,
  quotaWindow: "MONTHLY",
  enabled: false,
};

describe("Dashboard usage plan contract", () => {
  it("accepts safe ids and builds only the fixed detail path", () => {
    expect(isDashboardUsagePlanId("plan_starter")).toBe(true);
    expect(isDashboardUsagePlanId("cmr62f93a0003pg142zbyc7jn")).toBe(true);
    expect(isDashboardUsagePlanId("../usage-plans")).toBe(false);
    expect(isDashboardUsagePlanId("plan/starter")).toBe(false);
    expect(isDashboardUsagePlanId(" plan_starter")).toBe(false);

    expect(
      getDashboardUsagePlanPath("plan_starter"),
    ).toBe("/api/admin/usage-plans/plan_starter");
  });

  it("loads the bounded list through the allowlisted GET resource", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [starterPlan, enterprisePlan],
      }),
    );

    const result = await loadDashboardUsagePlans(
      fetchMock,
    );

    expect(result).toEqual({
      status: "success",
      data: [starterPlan, enterprisePlan],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/usage-plans",
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );
  });

  it("loads fixed usage plan detail with GET and no-store", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: starterPlan,
      }),
    );

    const result = await loadDashboardUsagePlan(
      "plan_starter",
      fetchMock,
    );

    expect(result).toEqual({
      status: "success",
      data: starterPlan,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/usage-plans/plan_starter",
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

  it("rejects invalid ids before invoking detail fetch", async () => {
    const fetchMock = vi.fn();

    const result = await loadDashboardUsagePlan(
      "../plan",
      fetchMock,
    );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when detail identity differs", async () => {
    const result = await loadDashboardUsagePlan(
      "plan_starter",
      async () =>
        Response.json({
          data: enterprisePlan,
        }),
    );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("rejects non-positive quota limits and oversized lists", () => {
    expect(
      isDashboardUsagePlanList([
        {
          ...starterPlan,
          quotaLimit: 0,
        },
      ]),
    ).toBe(false);

    expect(
      isDashboardUsagePlanList(
        Array.from(
          {
            length:
              MAX_DASHBOARD_USAGE_PLANS + 1,
          },
          (_, index) => ({
            ...starterPlan,
            id: `plan_${index}`,
          }),
        ),
      ),
    ).toBe(false);
  });

  it("summarizes quota windows and enabled state", () => {
    expect(
      summarizeDashboardUsagePlans([
        starterPlan,
        enterprisePlan,
      ]),
    ).toEqual({
      total: 2,
      enabled: 1,
      disabled: 1,
      daily: 1,
      monthly: 1,
    });
  });

  it("formats quota limits for read-only display", () => {
    expect(formatDashboardQuotaLimit(100000)).toBe(
      "100,000",
    );
  });
});

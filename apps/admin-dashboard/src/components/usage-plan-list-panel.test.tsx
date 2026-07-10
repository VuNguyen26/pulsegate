import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  UsagePlanDetail,
  UsagePlanListPanel,
  UsagePlanSummary,
} from "./usage-plan-list-panel";
import type {
  DashboardUsagePlan,
} from "../lib/usage-plans";

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

describe("usage plan read view", () => {
  it("renders bounded registry summary", () => {
    const html = renderToStaticMarkup(
      <UsagePlanSummary
        usagePlans={[
          starterPlan,
          enterprisePlan,
        ]}
      />,
    );

    expect(html).toContain("Total plans");
    expect(html).toContain("Enabled");
    expect(html).toContain("Disabled");
    expect(html).toContain("Daily windows");
    expect(html).toContain("Monthly windows");
  });

  it("renders persisted detail without mutation controls", () => {
    const html = renderToStaticMarkup(
      <UsagePlanDetail
        usagePlan={starterPlan}
      />,
    );

    expect(html).toContain("Starter");
    expect(html).toContain("plan_starter");
    expect(html).toContain("1,000");
    expect(html).toContain("DAILY");
    expect(html).toContain(
      "This checkpoint is read only",
    );
    expect(html).not.toContain(">Create<");
    expect(html).not.toContain(">Update<");
    expect(html).not.toContain(">Enable<");
    expect(html).not.toContain(">Disable<");
  });

  it("server-renders a safe initial loading state", () => {
    const html = renderToStaticMarkup(
      <UsagePlanListPanel />,
    );

    expect(html).toContain("Usage plan registry");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("x-admin-api-key");
    expect(html).not.toContain("ADMIN_READ_ONLY_API_KEY");
    expect(html).not.toContain("ADMIN_API_KEY");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ApiKeyQuotaContent,
  UsagePlanSummaryContent,
  UsageSummaryContent,
  UsageSummaryLookups,
} from "./usage-summary-lookups";
import type {
  DashboardApiKeyQuotaState,
  DashboardUsagePlanUsageSummary,
  DashboardUsageSummary,
} from "../lib/usage-analytics";

const usageSummary: DashboardUsageSummary = {
  subjectType: "consumer",
  subjectId: "consumer_mobile",
  totalRequests: 100,
  successfulRequests: 95,
  errorRequests: 5,
  averageDurationMs: 14.25,
  cacheHits: 30,
  cacheMisses: 60,
  cacheBypasses: 10,
  lastRequestAt: "2026-07-11T01:00:00.000Z",
};

const quotaState: DashboardApiKeyQuotaState = {
  apiKeyId: "api_key_1",
  consumerId: "consumer_mobile",
  reason: "ACTIVE_USAGE_PLAN",
  usagePlan: {
    id: "plan_starter",
    name: "Starter",
    quotaLimit: 1000,
    quotaWindow: "DAILY",
    enabled: true,
  },
  quota: {
    usedRequests: 400,
    remainingRequests: 600,
    windowStartedAt:
      "2026-07-11T00:00:00.000Z",
    windowEndsAt:
      "2026-07-12T00:00:00.000Z",
    resetAt: "2026-07-12T00:00:00.000Z",
    exceeded: false,
    enforced: true,
  },
};

const planSummary: DashboardUsagePlanUsageSummary = {
  usagePlan: {
    id: "plan_starter",
    name: "Starter",
    quotaLimit: 1000,
    quotaWindow: "DAILY",
    enabled: true,
  },
  windowStartedAt:
    "2026-07-11T00:00:00.000Z",
  windowEndsAt:
    "2026-07-12T00:00:00.000Z",
  resetAt: "2026-07-12T00:00:00.000Z",
  assignedApiKeys: 5,
  activeApiKeys: 4,
  totalRequestsInCurrentWindow: 600,
  exceededApiKeys: 1,
  nearLimitApiKeys: 2,
  topApiKeysByUsage: [],
};

describe("UsageSummaryContent", () => {
  it("renders successful request and cache metrics", () => {
    const html = renderToStaticMarkup(
      <UsageSummaryContent
        summary={usageSummary}
      />,
    );

    expect(html).toContain("consumer_mobile");
    expect(html).toContain("Total requests");
    expect(html).toContain("100");
    expect(html).toContain("Average duration");
    expect(html).toContain("14.25 ms");
    expect(html).toContain("Cache bypasses");
  });
});

describe("ApiKeyQuotaContent", () => {
  it("renders quota state without secret material", () => {
    const html = renderToStaticMarkup(
      <ApiKeyQuotaContent
        quotaState={quotaState}
      />,
    );

    expect(html).toContain("ACTIVE_USAGE_PLAN");
    expect(html).toContain("api_key_1");
    expect(html).toContain("Starter");
    expect(html).toContain("600");
    expect(html).not.toContain("rawKey");
  });
});

describe("UsagePlanSummaryContent", () => {
  it("renders current-window plan metrics", () => {
    const html = renderToStaticMarkup(
      <UsagePlanSummaryContent
        summary={planSummary}
      />,
    );

    expect(html).toContain("Starter");
    expect(html).toContain("Assigned API keys");
    expect(html).toContain("Current-window requests");
    expect(html).toContain("Near-limit API keys");
  });
});

describe("UsageSummaryLookups", () => {
  it("renders four read-only lookup surfaces initially idle", () => {
    const html = renderToStaticMarkup(
      <UsageSummaryLookups />,
    );

    expect(html).toContain(
      "Consumer usage summary",
    );
    expect(html).toContain(
      "API key usage summary",
    );
    expect(html).toContain(
      "API key quota state",
    );
    expect(html).toContain(
      "Usage plan summary",
    );
    expect(html).toContain(
      "No read request is made until",
    );
    expect(html).not.toContain(
      "Loading API key quota state",
    );
  });
});

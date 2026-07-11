import { describe, expect, it } from "vitest";

import {
  isDashboardUsageSummary,
  isDashboardUsageSummaryForSubject,
  type DashboardUsageSummary,
} from "./usage-analytics";

const validSummary: DashboardUsageSummary = {
  subjectType: "consumer",
  subjectId: "consumer_mobile",
  totalRequests: 120,
  successfulRequests: 110,
  errorRequests: 10,
  averageDurationMs: 18.75,
  cacheHits: 40,
  cacheMisses: 60,
  cacheBypasses: 20,
  lastRequestAt: "2026-07-11T01:00:00.000Z",
};

describe("isDashboardUsageSummary", () => {
  it("accepts a bounded consumer summary", () => {
    expect(
      isDashboardUsageSummary(validSummary),
    ).toBe(true);
  });

  it("accepts an API-key summary with no requests", () => {
    expect(
      isDashboardUsageSummary({
        ...validSummary,
        subjectType: "apiKey",
        subjectId: "api_key_1",
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        averageDurationMs: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheBypasses: 0,
        lastRequestAt: null,
      }),
    ).toBe(true);
  });

  it("rejects invalid counts and timestamps", () => {
    expect(
      isDashboardUsageSummary({
        ...validSummary,
        totalRequests: -1,
      }),
    ).toBe(false);

    expect(
      isDashboardUsageSummary({
        ...validSummary,
        averageDurationMs: Number.POSITIVE_INFINITY,
      }),
    ).toBe(false);

    expect(
      isDashboardUsageSummary({
        ...validSummary,
        lastRequestAt: "not-a-date",
      }),
    ).toBe(false);
  });

  it("rejects an unsafe subject identifier", () => {
    expect(
      isDashboardUsageSummary({
        ...validSummary,
        subjectId: "../consumer",
      }),
    ).toBe(false);
  });
});

describe("isDashboardUsageSummaryForSubject", () => {
  it("requires the expected subject type and identity", () => {
    expect(
      isDashboardUsageSummaryForSubject(
        validSummary,
        "consumer",
        "consumer_mobile",
      ),
    ).toBe(true);

    expect(
      isDashboardUsageSummaryForSubject(
        validSummary,
        "apiKey",
        "consumer_mobile",
      ),
    ).toBe(false);

    expect(
      isDashboardUsageSummaryForSubject(
        validSummary,
        "consumer",
        "consumer_other",
      ),
    ).toBe(false);
  });
});
const activeQuotaState = {
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
    usedRequests: 250,
    remainingRequests: 750,
    windowStartedAt: "2026-07-11T00:00:00.000Z",
    windowEndsAt: "2026-07-12T00:00:00.000Z",
    resetAt: "2026-07-12T00:00:00.000Z",
    exceeded: false,
    enforced: true,
  },
} as const;

const activePlanSummary = {
  usagePlan: {
    id: "plan_starter",
    name: "Starter",
    quotaLimit: 1000,
    quotaWindow: "DAILY",
    enabled: true,
  },
  windowStartedAt: "2026-07-11T00:00:00.000Z",
  windowEndsAt: "2026-07-12T00:00:00.000Z",
  resetAt: "2026-07-12T00:00:00.000Z",
  assignedApiKeys: 2,
  activeApiKeys: 1,
  totalRequestsInCurrentWindow: 250,
  exceededApiKeys: 0,
  nearLimitApiKeys: 0,
  topApiKeysByUsage: [
    {
      apiKeyId: "api_key_1",
      consumerId: "consumer_mobile",
      name: "Mobile key",
      keyPrefix: "pg_live_abc",
      status: "ACTIVE",
      usedRequests: 250,
      remainingRequests: 750,
      usageRatio: 0.25,
      exceeded: false,
    },
  ],
} as const;

describe("isDashboardApiKeyQuotaState", () => {
  it("accepts active and no-plan quota states", async () => {
    const {
      isDashboardApiKeyQuotaState,
    } = await import("./usage-analytics");

    expect(
      isDashboardApiKeyQuotaState(activeQuotaState),
    ).toBe(true);

    expect(
      isDashboardApiKeyQuotaState({
        apiKeyId: "api_key_2",
        consumerId: null,
        reason: "NO_USAGE_PLAN",
        usagePlan: null,
        quota: {
          usedRequests: 0,
          remainingRequests: null,
          windowStartedAt: null,
          windowEndsAt: null,
          resetAt: null,
          exceeded: false,
          enforced: false,
        },
      }),
    ).toBe(true);
  });

  it("rejects inconsistent quota semantics", async () => {
    const {
      isDashboardApiKeyQuotaState,
    } = await import("./usage-analytics");

    expect(
      isDashboardApiKeyQuotaState({
        ...activeQuotaState,
        quota: {
          ...activeQuotaState.quota,
          enforced: false,
        },
      }),
    ).toBe(false);

    expect(
      isDashboardApiKeyQuotaState({
        ...activeQuotaState,
        reason: "NO_USAGE_PLAN",
      }),
    ).toBe(false);
  });

  it("requires the requested API-key identity", async () => {
    const {
      isDashboardApiKeyQuotaStateForKey,
    } = await import("./usage-analytics");

    expect(
      isDashboardApiKeyQuotaStateForKey(
        activeQuotaState,
        "api_key_1",
      ),
    ).toBe(true);

    expect(
      isDashboardApiKeyQuotaStateForKey(
        activeQuotaState,
        "api_key_other",
      ),
    ).toBe(false);
  });
});

describe("isDashboardUsagePlanUsageSummary", () => {
  it("accepts an active usage-plan summary", async () => {
    const {
      isDashboardUsagePlanUsageSummary,
    } = await import("./usage-analytics");

    expect(
      isDashboardUsagePlanUsageSummary(
        activePlanSummary,
      ),
    ).toBe(true);
  });

  it("accepts disabled-plan null quota metrics", async () => {
    const {
      isDashboardUsagePlanUsageSummary,
    } = await import("./usage-analytics");

    expect(
      isDashboardUsagePlanUsageSummary({
        ...activePlanSummary,
        usagePlan: {
          ...activePlanSummary.usagePlan,
          enabled: false,
        },
        exceededApiKeys: 0,
        nearLimitApiKeys: 0,
        topApiKeysByUsage: [
          {
            ...activePlanSummary.topApiKeysByUsage[0],
            remainingRequests: null,
            usageRatio: null,
            exceeded: false,
          },
        ],
      }),
    ).toBe(true);
  });

  it("rejects impossible counts and excess top rows", async () => {
    const {
      isDashboardUsagePlanUsageSummary,
    } = await import("./usage-analytics");

    expect(
      isDashboardUsagePlanUsageSummary({
        ...activePlanSummary,
        activeApiKeys: 3,
      }),
    ).toBe(false);

    expect(
      isDashboardUsagePlanUsageSummary({
        ...activePlanSummary,
        assignedApiKeys: 0,
      }),
    ).toBe(false);
  });

  it("requires the selected usage-plan identity", async () => {
    const {
      isDashboardUsagePlanSummaryForPlan,
    } = await import("./usage-analytics");

    expect(
      isDashboardUsagePlanSummaryForPlan(
        activePlanSummary,
        "plan_starter",
      ),
    ).toBe(true);

    expect(
      isDashboardUsagePlanSummaryForPlan(
        activePlanSummary,
        "plan_other",
      ),
    ).toBe(false);
  });
});
const validUsageEventsListing = {
  items: [
    {
      id: "usage_event_1",
      requestId: "request-1",
      routePath: "/api/products/:id",
      routeMethod: "GET",
      statusCode: 200,
      durationMs: 18.5,
      cacheStatus: "HIT",
      apiKeyAuthSource: "header",
      apiKeyId: "api_key_1",
      consumerId: "consumer_mobile",
      occurredAt: "2026-07-11T01:00:00.000Z",
    },
  ],
  pagination: {
    limit: 20,
    offset: 0,
    total: 1,
    hasNextPage: false,
    nextCursor: null,
  },
  filters: {
    from: null,
    to: null,
    routePath: null,
    routeMethod: null,
    statusCode: null,
    cacheStatus: null,
    apiKeyAuthSource: null,
    apiKeyId: null,
    consumerId: null,
  },
} as const;

describe("isDashboardUsageEventsListing", () => {
  it("accepts a bounded successful usage listing", async () => {
    const {
      isDashboardUsageEventsListing,
    } = await import("./usage-analytics");

    expect(
      isDashboardUsageEventsListing(
        validUsageEventsListing,
      ),
    ).toBe(true);
  });

  it("accepts an empty listing", async () => {
    const {
      isDashboardUsageEventsListing,
    } = await import("./usage-analytics");

    expect(
      isDashboardUsageEventsListing({
        ...validUsageEventsListing,
        items: [],
        pagination: {
          ...validUsageEventsListing.pagination,
          total: 0,
        },
      }),
    ).toBe(true);
  });

  it("requires a cursor when another page exists", async () => {
    const {
      isDashboardUsageEventsListing,
    } = await import("./usage-analytics");

    expect(
      isDashboardUsageEventsListing({
        ...validUsageEventsListing,
        pagination: {
          ...validUsageEventsListing.pagination,
          hasNextPage: true,
          nextCursor: null,
        },
      }),
    ).toBe(false);

    expect(
      isDashboardUsageEventsListing({
        ...validUsageEventsListing,
        pagination: {
          ...validUsageEventsListing.pagination,
          hasNextPage: true,
          nextCursor:
            "eyJvY2N1cnJlZEF0IjoiMjAyNi0wNy0xMVQwMTowMDowMC4wMDBaIiwiaWQiOiJ1c2FnZV9ldmVudF8xIn0",
        },
      }),
    ).toBe(true);
  });

  it("rejects invalid successful event fields", async () => {
    const {
      isDashboardUsageEventsListing,
    } = await import("./usage-analytics");

    expect(
      isDashboardUsageEventsListing({
        ...validUsageEventsListing,
        items: [
          {
            ...validUsageEventsListing.items[0],
            routePath: "https://example.com/admin",
          },
        ],
      }),
    ).toBe(false);

    expect(
      isDashboardUsageEventsListing({
        ...validUsageEventsListing,
        items: [
          {
            ...validUsageEventsListing.items[0],
            durationMs: -1,
          },
        ],
      }),
    ).toBe(false);

    expect(
      isDashboardUsageEventsListing({
        ...validUsageEventsListing,
        items: [
          {
            ...validUsageEventsListing.items[0],
            occurredAt: "not-a-date",
          },
        ],
      }),
    ).toBe(false);
  });

  it("rejects more items than the declared page size", async () => {
    const {
      isDashboardUsageEventsListing,
    } = await import("./usage-analytics");

    expect(
      isDashboardUsageEventsListing({
        ...validUsageEventsListing,
        items: [
          validUsageEventsListing.items[0],
          {
            ...validUsageEventsListing.items[0],
            id: "usage_event_2",
          },
        ],
        pagination: {
          ...validUsageEventsListing.pagination,
          limit: 1,
          total: 2,
        },
      }),
    ).toBe(false);
  });
});

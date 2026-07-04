import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../generated/prisma/index.js";
import { createPrismaUsagePlanUsageSummaryReader } from "./usage-plan-usage-summary.js";

type PrismaMock = {
  prisma: PrismaClient;
  usagePlanFindUnique: ReturnType<typeof vi.fn>;
  apiKeyFindMany: ReturnType<typeof vi.fn>;
  apiUsageEventGroupBy: ReturnType<typeof vi.fn>;
};

function createPrismaMock(options: {
  usagePlan: unknown;
  apiKeys?: unknown[];
  usageCounts?: unknown[];
}): PrismaMock {
  const usagePlanFindUnique = vi.fn().mockResolvedValue(options.usagePlan);
  const apiKeyFindMany = vi.fn().mockResolvedValue(options.apiKeys ?? []);
  const apiUsageEventGroupBy = vi
    .fn()
    .mockResolvedValue(options.usageCounts ?? []);

  const prisma = {
    usagePlan: {
      findUnique: usagePlanFindUnique,
    },
    apiKey: {
      findMany: apiKeyFindMany,
    },
    apiUsageEvent: {
      groupBy: apiUsageEventGroupBy,
    },
  } as unknown as PrismaClient;

  return {
    prisma,
    usagePlanFindUnique,
    apiKeyFindMany,
    apiUsageEventGroupBy,
  };
}

describe("createPrismaUsagePlanUsageSummaryReader", () => {
  it("returns null when usage plan does not exist", async () => {
    const { prisma, apiKeyFindMany, apiUsageEventGroupBy } = createPrismaMock({
      usagePlan: null,
    });
    const reader = createPrismaUsagePlanUsageSummaryReader(prisma, {
      now: () => new Date("2026-07-04T10:30:00.000Z"),
    });

    const summary = await reader.getUsagePlanUsageSummary("missing_plan");

    expect(summary).toBeNull();
    expect(apiKeyFindMany).not.toHaveBeenCalled();
    expect(apiUsageEventGroupBy).not.toHaveBeenCalled();
  });

  it("returns empty usage summary when usage plan has no assigned API keys", async () => {
    const { prisma, apiUsageEventGroupBy } = createPrismaMock({
      usagePlan: {
        id: "plan_starter",
        name: "Starter",
        quotaLimit: 100,
        quotaWindow: "DAILY",
        enabled: true,
      },
    });
    const reader = createPrismaUsagePlanUsageSummaryReader(prisma, {
      now: () => new Date("2026-07-04T10:30:00.000Z"),
    });

    const summary = await reader.getUsagePlanUsageSummary("plan_starter");

    expect(summary).toEqual({
      usagePlan: {
        id: "plan_starter",
        name: "Starter",
        quotaLimit: 100,
        quotaWindow: "DAILY",
        enabled: true,
      },
      windowStartedAt: new Date("2026-07-04T00:00:00.000Z"),
      windowEndsAt: new Date("2026-07-05T00:00:00.000Z"),
      resetAt: new Date("2026-07-05T00:00:00.000Z"),
      assignedApiKeys: 0,
      activeApiKeys: 0,
      totalRequestsInCurrentWindow: 0,
      exceededApiKeys: 0,
      nearLimitApiKeys: 0,
      topApiKeysByUsage: [],
    });
    expect(apiUsageEventGroupBy).not.toHaveBeenCalled();
  });

  it("returns usage summary for an active daily usage plan", async () => {
    const { prisma, apiUsageEventGroupBy } = createPrismaMock({
      usagePlan: {
        id: "plan_starter",
        name: "Starter",
        quotaLimit: 100,
        quotaWindow: "DAILY",
        enabled: true,
      },
      apiKeys: [
        {
          id: "key_a",
          consumerId: "consumer_a",
          name: "A Key",
          keyPrefix: "pgk_a",
          status: "ACTIVE",
        },
        {
          id: "key_b",
          consumerId: "consumer_b",
          name: "B Key",
          keyPrefix: "pgk_b",
          status: "ACTIVE",
        },
        {
          id: "key_c",
          consumerId: "consumer_c",
          name: "C Key",
          keyPrefix: "pgk_c",
          status: "REVOKED",
        },
      ],
      usageCounts: [
        {
          apiKeyId: "key_a",
          _count: {
            _all: 90,
          },
        },
        {
          apiKeyId: "key_b",
          _count: {
            _all: 100,
          },
        },
        {
          apiKeyId: "key_c",
          _count: {
            _all: 20,
          },
        },
      ],
    });
    const reader = createPrismaUsagePlanUsageSummaryReader(prisma, {
      now: () => new Date("2026-07-04T10:30:00.000Z"),
    });

    const summary = await reader.getUsagePlanUsageSummary("plan_starter");

    expect(summary).toEqual({
      usagePlan: {
        id: "plan_starter",
        name: "Starter",
        quotaLimit: 100,
        quotaWindow: "DAILY",
        enabled: true,
      },
      windowStartedAt: new Date("2026-07-04T00:00:00.000Z"),
      windowEndsAt: new Date("2026-07-05T00:00:00.000Z"),
      resetAt: new Date("2026-07-05T00:00:00.000Z"),
      assignedApiKeys: 3,
      activeApiKeys: 2,
      totalRequestsInCurrentWindow: 210,
      exceededApiKeys: 1,
      nearLimitApiKeys: 1,
      topApiKeysByUsage: [
        {
          apiKeyId: "key_b",
          consumerId: "consumer_b",
          name: "B Key",
          keyPrefix: "pgk_b",
          status: "ACTIVE",
          usedRequests: 100,
          remainingRequests: 0,
          usageRatio: 1,
          exceeded: true,
        },
        {
          apiKeyId: "key_a",
          consumerId: "consumer_a",
          name: "A Key",
          keyPrefix: "pgk_a",
          status: "ACTIVE",
          usedRequests: 90,
          remainingRequests: 10,
          usageRatio: 0.9,
          exceeded: false,
        },
        {
          apiKeyId: "key_c",
          consumerId: "consumer_c",
          name: "C Key",
          keyPrefix: "pgk_c",
          status: "REVOKED",
          usedRequests: 20,
          remainingRequests: 80,
          usageRatio: 0.2,
          exceeded: false,
        },
      ],
    });
    expect(apiUsageEventGroupBy).toHaveBeenCalledWith({
      by: ["apiKeyId"],
      where: {
        apiKeyId: {
          in: ["key_a", "key_b", "key_c"],
        },
        occurredAt: {
          gte: new Date("2026-07-04T00:00:00.000Z"),
          lt: new Date("2026-07-05T00:00:00.000Z"),
        },
      },
      _count: {
        _all: true,
      },
    });
  });

  it("does not mark disabled usage plan keys as exceeded or near limit", async () => {
    const { prisma } = createPrismaMock({
      usagePlan: {
        id: "plan_disabled",
        name: "Disabled",
        quotaLimit: 100,
        quotaWindow: "MONTHLY",
        enabled: false,
      },
      apiKeys: [
        {
          id: "key_a",
          consumerId: "consumer_a",
          name: "A Key",
          keyPrefix: "pgk_a",
          status: "ACTIVE",
        },
      ],
      usageCounts: [
        {
          apiKeyId: "key_a",
          _count: {
            _all: 150,
          },
        },
      ],
    });
    const reader = createPrismaUsagePlanUsageSummaryReader(prisma, {
      now: () => new Date("2026-07-04T10:30:00.000Z"),
    });

    const summary = await reader.getUsagePlanUsageSummary("plan_disabled");

    expect(summary).toMatchObject({
      windowStartedAt: new Date("2026-07-01T00:00:00.000Z"),
      windowEndsAt: new Date("2026-08-01T00:00:00.000Z"),
      resetAt: new Date("2026-08-01T00:00:00.000Z"),
      assignedApiKeys: 1,
      activeApiKeys: 1,
      totalRequestsInCurrentWindow: 150,
      exceededApiKeys: 0,
      nearLimitApiKeys: 0,
      topApiKeysByUsage: [
        {
          apiKeyId: "key_a",
          usedRequests: 150,
          remainingRequests: null,
          usageRatio: null,
          exceeded: false,
        },
      ],
    });
  });
});

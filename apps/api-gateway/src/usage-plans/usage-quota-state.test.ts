import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../generated/prisma/index.js";
import { createPrismaUsageQuotaStateReader } from "./usage-quota-state.js";

type PrismaMock = {
  prisma: PrismaClient;
  findUnique: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
};

function createPrismaMock(apiKey: unknown, usedRequests = 0): PrismaMock {
  const findUnique = vi.fn().mockResolvedValue(apiKey);
  const count = vi.fn().mockResolvedValue(usedRequests);

  const prisma = {
    apiKey: {
      findUnique,
    },
    apiUsageEvent: {
      count,
    },
  } as unknown as PrismaClient;

  return {
    prisma,
    findUnique,
    count,
  };
}

describe("createPrismaUsageQuotaStateReader", () => {
  it("returns API_KEY_NOT_FOUND state when API key does not exist", async () => {
    const { prisma, count } = createPrismaMock(null);
    const reader = createPrismaUsageQuotaStateReader(prisma, {
      now: () => new Date("2026-07-04T10:30:00.000Z"),
    });

    const state = await reader.getApiKeyQuotaState("api_key_1");

    expect(state).toEqual({
      apiKeyId: "api_key_1",
      consumerId: null,
      reason: "API_KEY_NOT_FOUND",
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
    });
    expect(count).not.toHaveBeenCalled();
  });

  it("returns NO_USAGE_PLAN state when API key is not assigned to a usage plan", async () => {
    const { prisma, count } = createPrismaMock({
      id: "api_key_1",
      consumerId: "consumer_1",
      usagePlan: null,
    });
    const reader = createPrismaUsageQuotaStateReader(prisma, {
      now: () => new Date("2026-07-04T10:30:00.000Z"),
    });

    const state = await reader.getApiKeyQuotaState("api_key_1");

    expect(state.reason).toBe("NO_USAGE_PLAN");
    expect(state.consumerId).toBe("consumer_1");
    expect(state.usagePlan).toBeNull();
    expect(state.quota).toEqual({
      usedRequests: 0,
      remainingRequests: null,
      windowStartedAt: null,
      windowEndsAt: null,
      resetAt: null,
      exceeded: false,
      enforced: false,
    });
    expect(count).not.toHaveBeenCalled();
  });

  it("returns DAILY quota state for an active usage plan", async () => {
    const { prisma, count } = createPrismaMock(
      {
        id: "api_key_1",
        consumerId: "consumer_1",
        usagePlan: {
          id: "usage_plan_1",
          name: "daily-plan",
          quotaLimit: 5,
          quotaWindow: "DAILY",
          enabled: true,
        },
      },
      3,
    );
    const reader = createPrismaUsageQuotaStateReader(prisma, {
      now: () => new Date("2026-07-04T10:30:00.000Z"),
    });

    const state = await reader.getApiKeyQuotaState("api_key_1");

    expect(state).toEqual({
      apiKeyId: "api_key_1",
      consumerId: "consumer_1",
      reason: "ACTIVE_USAGE_PLAN",
      usagePlan: {
        id: "usage_plan_1",
        name: "daily-plan",
        quotaLimit: 5,
        quotaWindow: "DAILY",
        enabled: true,
      },
      quota: {
        usedRequests: 3,
        remainingRequests: 2,
        windowStartedAt: new Date("2026-07-04T00:00:00.000Z"),
        windowEndsAt: new Date("2026-07-05T00:00:00.000Z"),
        resetAt: new Date("2026-07-05T00:00:00.000Z"),
        exceeded: false,
        enforced: true,
      },
    });
    expect(count).toHaveBeenCalledWith({
      where: {
        apiKeyId: "api_key_1",
        occurredAt: {
          gte: new Date("2026-07-04T00:00:00.000Z"),
          lt: new Date("2026-07-05T00:00:00.000Z"),
        },
      },
    });
  });

  it("returns exceeded MONTHLY quota state for an active usage plan", async () => {
    const { prisma } = createPrismaMock(
      {
        id: "api_key_1",
        consumerId: "consumer_1",
        usagePlan: {
          id: "usage_plan_1",
          name: "monthly-plan",
          quotaLimit: 10,
          quotaWindow: "MONTHLY",
          enabled: true,
        },
      },
      10,
    );
    const reader = createPrismaUsageQuotaStateReader(prisma, {
      now: () => new Date("2026-07-04T10:30:00.000Z"),
    });

    const state = await reader.getApiKeyQuotaState("api_key_1");

    expect(state.quota).toEqual({
      usedRequests: 10,
      remainingRequests: 0,
      windowStartedAt: new Date("2026-07-01T00:00:00.000Z"),
      windowEndsAt: new Date("2026-08-01T00:00:00.000Z"),
      resetAt: new Date("2026-08-01T00:00:00.000Z"),
      exceeded: true,
      enforced: true,
    });
  });

  it("returns disabled usage plan state without enforcing remaining quota", async () => {
    const { prisma } = createPrismaMock(
      {
        id: "api_key_1",
        consumerId: "consumer_1",
        usagePlan: {
          id: "usage_plan_1",
          name: "disabled-plan",
          quotaLimit: 5,
          quotaWindow: "DAILY",
          enabled: false,
        },
      },
      8,
    );
    const reader = createPrismaUsageQuotaStateReader(prisma, {
      now: () => new Date("2026-07-04T10:30:00.000Z"),
    });

    const state = await reader.getApiKeyQuotaState("api_key_1");

    expect(state.reason).toBe("USAGE_PLAN_DISABLED");
    expect(state.quota).toEqual({
      usedRequests: 8,
      remainingRequests: null,
      windowStartedAt: new Date("2026-07-04T00:00:00.000Z"),
      windowEndsAt: new Date("2026-07-05T00:00:00.000Z"),
      resetAt: new Date("2026-07-05T00:00:00.000Z"),
      exceeded: false,
      enforced: false,
    });
  });
});

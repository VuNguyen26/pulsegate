import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../generated/prisma/index.js";
import {
  createPrismaUsageQuotaChecker,
  getUsageQuotaWindowRange,
} from "./usage-quota-checker.js";

function createPrismaMock(options: {
  apiKeyResult: unknown;
  usedRequests?: number;
}) {
  return {
    apiKey: {
      findUnique: vi.fn(async () => options.apiKeyResult),
    },
    apiUsageEvent: {
      count: vi.fn(async () => options.usedRequests ?? 0),
    },
  } as unknown as PrismaClient;
}

describe("usage quota checker", () => {
  it("should build daily UTC quota window range", () => {
    expect(
      getUsageQuotaWindowRange(
        "DAILY",
        new Date("2026-07-04T10:30:00.000Z"),
      ),
    ).toEqual({
      windowStartedAt: new Date("2026-07-04T00:00:00.000Z"),
      windowEndsAt: new Date("2026-07-05T00:00:00.000Z"),
    });
  });

  it("should build monthly UTC quota window range", () => {
    expect(
      getUsageQuotaWindowRange(
        "MONTHLY",
        new Date("2026-07-31T10:30:00.000Z"),
      ),
    ).toEqual({
      windowStartedAt: new Date("2026-07-01T00:00:00.000Z"),
      windowEndsAt: new Date("2026-08-01T00:00:00.000Z"),
    });
  });

  it("should allow when API key is not found", async () => {
    const prisma = createPrismaMock({
      apiKeyResult: null,
    });
    const checker = createPrismaUsageQuotaChecker(prisma);

    await expect(checker.checkApiKeyQuota("key_1")).resolves.toEqual({
      allowed: true,
      reason: "API_KEY_NOT_FOUND",
    });

    expect(prisma.apiUsageEvent.count).not.toHaveBeenCalled();
  });

  it("should allow when API key has no usage plan", async () => {
    const prisma = createPrismaMock({
      apiKeyResult: {
        id: "key_1",
        usagePlan: null,
      },
    });
    const checker = createPrismaUsageQuotaChecker(prisma);

    await expect(checker.checkApiKeyQuota("key_1")).resolves.toEqual({
      allowed: true,
      reason: "NO_USAGE_PLAN",
    });

    expect(prisma.apiUsageEvent.count).not.toHaveBeenCalled();
  });

  it("should allow when usage plan is disabled", async () => {
    const prisma = createPrismaMock({
      apiKeyResult: {
        id: "key_1",
        usagePlan: {
          id: "plan_starter",
          quotaLimit: 1,
          quotaWindow: "DAILY",
          enabled: false,
        },
      },
    });
    const checker = createPrismaUsageQuotaChecker(prisma);

    await expect(checker.checkApiKeyQuota("key_1")).resolves.toMatchObject({
      allowed: true,
      reason: "USAGE_PLAN_DISABLED",
      usagePlanId: "plan_starter",
    });

    expect(prisma.apiUsageEvent.count).not.toHaveBeenCalled();
  });

  it("should allow when usage is under quota limit", async () => {
    const prisma = createPrismaMock({
      apiKeyResult: {
        id: "key_1",
        usagePlan: {
          id: "plan_starter",
          quotaLimit: 10,
          quotaWindow: "MONTHLY",
          enabled: true,
        },
      },
      usedRequests: 4,
    });
    const checker = createPrismaUsageQuotaChecker(prisma, {
      now: () => new Date("2026-07-15T12:00:00.000Z"),
    });

    await expect(checker.checkApiKeyQuota("key_1")).resolves.toMatchObject({
      allowed: true,
      reason: "UNDER_LIMIT",
      usagePlanId: "plan_starter",
      quotaLimit: 10,
      quotaWindow: "MONTHLY",
      usedRequests: 4,
    });

    expect(prisma.apiUsageEvent.count).toHaveBeenCalledWith({
      where: {
        apiKeyId: "key_1",
        occurredAt: {
          gte: new Date("2026-07-01T00:00:00.000Z"),
          lt: new Date("2026-08-01T00:00:00.000Z"),
        },
      },
    });
  });

  it("should deny when usage reaches quota limit", async () => {
    const prisma = createPrismaMock({
      apiKeyResult: {
        id: "key_1",
        usagePlan: {
          id: "plan_starter",
          quotaLimit: 1,
          quotaWindow: "DAILY",
          enabled: true,
        },
      },
      usedRequests: 1,
    });
    const checker = createPrismaUsageQuotaChecker(prisma, {
      now: () => new Date("2026-07-04T12:00:00.000Z"),
    });

    await expect(checker.checkApiKeyQuota("key_1")).resolves.toMatchObject({
      allowed: false,
      code: "QUOTA_EXCEEDED",
      usagePlanId: "plan_starter",
      quotaLimit: 1,
      quotaWindow: "DAILY",
      usedRequests: 1,
    });
  });
});
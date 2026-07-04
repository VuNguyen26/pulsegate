import type { PrismaClient } from "../generated/prisma/index.js";
import type { UsagePlanQuotaWindowValue } from "./usage-plan-management.types.js";

export type UsageQuotaWindowRange = {
  windowStartedAt: Date;
  windowEndsAt: Date;
};

export type UsageQuotaAllowedReason =
  | "API_KEY_NOT_FOUND"
  | "NO_USAGE_PLAN"
  | "USAGE_PLAN_DISABLED"
  | "UNDER_LIMIT";

export type UsageQuotaCheckResult =
  | {
      allowed: true;
      reason: UsageQuotaAllowedReason;
      usagePlanId?: string;
      quotaLimit?: number;
      quotaWindow?: UsagePlanQuotaWindowValue;
      usedRequests?: number;
      windowStartedAt?: Date;
      windowEndsAt?: Date;
    }
  | {
      allowed: false;
      code: "QUOTA_EXCEEDED";
      usagePlanId: string;
      quotaLimit: number;
      quotaWindow: UsagePlanQuotaWindowValue;
      usedRequests: number;
      windowStartedAt: Date;
      windowEndsAt: Date;
    };

export type UsageQuotaChecker = {
  checkApiKeyQuota: (apiKeyId: string) => Promise<UsageQuotaCheckResult>;
};

export type PrismaUsageQuotaCheckerOptions = {
  now?: () => Date;
};

export function getUsageQuotaWindowRange(
  quotaWindow: UsagePlanQuotaWindowValue,
  now: Date,
): UsageQuotaWindowRange {
  if (quotaWindow === "MONTHLY") {
    const windowStartedAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    const windowEndsAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    );

    return {
      windowStartedAt,
      windowEndsAt,
    };
  }

  const windowStartedAt = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const windowEndsAt = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );

  return {
    windowStartedAt,
    windowEndsAt,
  };
}

export function createPrismaUsageQuotaChecker(
  prisma: PrismaClient,
  options: PrismaUsageQuotaCheckerOptions = {},
): UsageQuotaChecker {
  const getNow = options.now ?? (() => new Date());

  return {
    checkApiKeyQuota: async (apiKeyId: string) => {
      const apiKey = await prisma.apiKey.findUnique({
        where: {
          id: apiKeyId,
        },
        include: {
          usagePlan: true,
        },
      });

      if (!apiKey) {
        return {
          allowed: true,
          reason: "API_KEY_NOT_FOUND",
        };
      }

      if (!apiKey.usagePlan) {
        return {
          allowed: true,
          reason: "NO_USAGE_PLAN",
        };
      }

      if (!apiKey.usagePlan.enabled) {
        return {
          allowed: true,
          reason: "USAGE_PLAN_DISABLED",
          usagePlanId: apiKey.usagePlan.id,
          quotaLimit: apiKey.usagePlan.quotaLimit,
          quotaWindow: apiKey.usagePlan.quotaWindow,
        };
      }

      const { windowStartedAt, windowEndsAt } = getUsageQuotaWindowRange(
        apiKey.usagePlan.quotaWindow,
        getNow(),
      );

      const usedRequests = await prisma.apiUsageEvent.count({
        where: {
          apiKeyId,
          occurredAt: {
            gte: windowStartedAt,
            lt: windowEndsAt,
          },
        },
      });

      if (usedRequests >= apiKey.usagePlan.quotaLimit) {
        return {
          allowed: false,
          code: "QUOTA_EXCEEDED",
          usagePlanId: apiKey.usagePlan.id,
          quotaLimit: apiKey.usagePlan.quotaLimit,
          quotaWindow: apiKey.usagePlan.quotaWindow,
          usedRequests,
          windowStartedAt,
          windowEndsAt,
        };
      }

      return {
        allowed: true,
        reason: "UNDER_LIMIT",
        usagePlanId: apiKey.usagePlan.id,
        quotaLimit: apiKey.usagePlan.quotaLimit,
        quotaWindow: apiKey.usagePlan.quotaWindow,
        usedRequests,
        windowStartedAt,
        windowEndsAt,
      };
    },
  };
}
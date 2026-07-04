import type { PrismaClient } from "../generated/prisma/index.js";
import { getUsageQuotaWindowRange } from "./usage-quota-checker.js";
import type { UsagePlanQuotaWindowValue } from "./usage-plan-management.types.js";

export type UsageQuotaStateReason =
  | "API_KEY_NOT_FOUND"
  | "NO_USAGE_PLAN"
  | "USAGE_PLAN_DISABLED"
  | "ACTIVE_USAGE_PLAN";

export type UsageQuotaStateUsagePlan = {
  id: string;
  name: string;
  quotaLimit: number;
  quotaWindow: UsagePlanQuotaWindowValue;
  enabled: boolean;
};

export type UsageQuotaStateQuota = {
  usedRequests: number;
  remainingRequests: number | null;
  windowStartedAt: Date | null;
  windowEndsAt: Date | null;
  resetAt: Date | null;
  exceeded: boolean;
  enforced: boolean;
};

export type UsageQuotaStateReadModel = {
  apiKeyId: string;
  consumerId: string | null;
  reason: UsageQuotaStateReason;
  usagePlan: UsageQuotaStateUsagePlan | null;
  quota: UsageQuotaStateQuota;
};

export type UsageQuotaStateQuotaResponse = {
  usedRequests: number;
  remainingRequests: number | null;
  windowStartedAt: string | null;
  windowEndsAt: string | null;
  resetAt: string | null;
  exceeded: boolean;
  enforced: boolean;
};

export type UsageQuotaStateResponse = {
  apiKeyId: string;
  consumerId: string | null;
  reason: UsageQuotaStateReason;
  usagePlan: UsageQuotaStateUsagePlan | null;
  quota: UsageQuotaStateQuotaResponse;
};

export type UsageQuotaStateReader = {
  getApiKeyQuotaState: (apiKeyId: string) => Promise<UsageQuotaStateReadModel>;
};

export type PrismaUsageQuotaStateReaderOptions = {
  now?: () => Date;
};

type ApiKeyWithUsagePlan = {
  id: string;
  consumerId: string;
  usagePlan: {
    id: string;
    name: string;
    quotaLimit: number;
    quotaWindow: UsagePlanQuotaWindowValue;
    enabled: boolean;
  } | null;
};

function createEmptyQuotaState(): UsageQuotaStateQuota {
  return {
    usedRequests: 0,
    remainingRequests: null,
    windowStartedAt: null,
    windowEndsAt: null,
    resetAt: null,
    exceeded: false,
    enforced: false,
  };
}

function mapUsagePlanToState(
  usagePlan: ApiKeyWithUsagePlan["usagePlan"],
): UsageQuotaStateUsagePlan | null {
  if (!usagePlan) {
    return null;
  }

  return {
    id: usagePlan.id,
    name: usagePlan.name,
    quotaLimit: usagePlan.quotaLimit,
    quotaWindow: usagePlan.quotaWindow,
    enabled: usagePlan.enabled,
  };
}

function mapNullableDateToIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function mapUsageQuotaStateReadModelToResponse(
  state: UsageQuotaStateReadModel,
): UsageQuotaStateResponse {
  return {
    apiKeyId: state.apiKeyId,
    consumerId: state.consumerId,
    reason: state.reason,
    usagePlan: state.usagePlan,
    quota: {
      usedRequests: state.quota.usedRequests,
      remainingRequests: state.quota.remainingRequests,
      windowStartedAt: mapNullableDateToIso(state.quota.windowStartedAt),
      windowEndsAt: mapNullableDateToIso(state.quota.windowEndsAt),
      resetAt: mapNullableDateToIso(state.quota.resetAt),
      exceeded: state.quota.exceeded,
      enforced: state.quota.enforced,
    },
  };
}

export function createPrismaUsageQuotaStateReader(
  prisma: PrismaClient,
  options: PrismaUsageQuotaStateReaderOptions = {},
): UsageQuotaStateReader {
  const getNow = options.now ?? (() => new Date());

  return {
    getApiKeyQuotaState: async (apiKeyId: string) => {
      const apiKey = (await prisma.apiKey.findUnique({
        where: {
          id: apiKeyId,
        },
        include: {
          usagePlan: true,
        },
      })) as ApiKeyWithUsagePlan | null;

      if (!apiKey) {
        return {
          apiKeyId,
          consumerId: null,
          reason: "API_KEY_NOT_FOUND",
          usagePlan: null,
          quota: createEmptyQuotaState(),
        };
      }

      if (!apiKey.usagePlan) {
        return {
          apiKeyId: apiKey.id,
          consumerId: apiKey.consumerId,
          reason: "NO_USAGE_PLAN",
          usagePlan: null,
          quota: createEmptyQuotaState(),
        };
      }

      const { windowStartedAt, windowEndsAt } = getUsageQuotaWindowRange(
        apiKey.usagePlan.quotaWindow,
        getNow(),
      );

      const usedRequests = await prisma.apiUsageEvent.count({
        where: {
          apiKeyId: apiKey.id,
          occurredAt: {
            gte: windowStartedAt,
            lt: windowEndsAt,
          },
        },
      });

      if (!apiKey.usagePlan.enabled) {
        return {
          apiKeyId: apiKey.id,
          consumerId: apiKey.consumerId,
          reason: "USAGE_PLAN_DISABLED",
          usagePlan: mapUsagePlanToState(apiKey.usagePlan),
          quota: {
            usedRequests,
            remainingRequests: null,
            windowStartedAt,
            windowEndsAt,
            resetAt: windowEndsAt,
            exceeded: false,
            enforced: false,
          },
        };
      }

      const remainingRequests = Math.max(
        apiKey.usagePlan.quotaLimit - usedRequests,
        0,
      );

      return {
        apiKeyId: apiKey.id,
        consumerId: apiKey.consumerId,
        reason: "ACTIVE_USAGE_PLAN",
        usagePlan: mapUsagePlanToState(apiKey.usagePlan),
        quota: {
          usedRequests,
          remainingRequests,
          windowStartedAt,
          windowEndsAt,
          resetAt: windowEndsAt,
          exceeded: usedRequests >= apiKey.usagePlan.quotaLimit,
          enforced: true,
        },
      };
    },
  };
}

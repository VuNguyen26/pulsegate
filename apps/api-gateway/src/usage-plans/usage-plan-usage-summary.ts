import type { PrismaClient } from "../generated/prisma/index.js";
import type { ApiKeyStatusValue } from "../api-keys/api-key-management.types.js";
import { getUsageQuotaWindowRange } from "./usage-quota-checker.js";
import type { UsagePlanQuotaWindowValue } from "./usage-plan-management.types.js";

const NEAR_LIMIT_RATIO = 0.8;
const TOP_API_KEYS_LIMIT = 5;

export type UsagePlanUsageSummaryUsagePlan = {
  id: string;
  name: string;
  quotaLimit: number;
  quotaWindow: UsagePlanQuotaWindowValue;
  enabled: boolean;
};

export type UsagePlanUsageSummaryApiKey = {
  apiKeyId: string;
  consumerId: string;
  name: string;
  keyPrefix: string;
  status: ApiKeyStatusValue;
  usedRequests: number;
  remainingRequests: number | null;
  usageRatio: number | null;
  exceeded: boolean;
};

export type UsagePlanUsageSummaryReadModel = {
  usagePlan: UsagePlanUsageSummaryUsagePlan;
  windowStartedAt: Date;
  windowEndsAt: Date;
  resetAt: Date;
  assignedApiKeys: number;
  activeApiKeys: number;
  totalRequestsInCurrentWindow: number;
  exceededApiKeys: number;
  nearLimitApiKeys: number;
  topApiKeysByUsage: UsagePlanUsageSummaryApiKey[];
};

export type UsagePlanUsageSummaryApiKeyResponse = {
  apiKeyId: string;
  consumerId: string;
  name: string;
  keyPrefix: string;
  status: ApiKeyStatusValue;
  usedRequests: number;
  remainingRequests: number | null;
  usageRatio: number | null;
  exceeded: boolean;
};

export type UsagePlanUsageSummaryResponse = {
  usagePlan: UsagePlanUsageSummaryUsagePlan;
  windowStartedAt: string;
  windowEndsAt: string;
  resetAt: string;
  assignedApiKeys: number;
  activeApiKeys: number;
  totalRequestsInCurrentWindow: number;
  exceededApiKeys: number;
  nearLimitApiKeys: number;
  topApiKeysByUsage: UsagePlanUsageSummaryApiKeyResponse[];
};

export type UsagePlanUsageSummaryReader = {
  getUsagePlanUsageSummary: (
    usagePlanId: string,
  ) => Promise<UsagePlanUsageSummaryReadModel | null>;
};

export type PrismaUsagePlanUsageSummaryReaderOptions = {
  now?: () => Date;
};

type UsagePlanWithQuota = {
  id: string;
  name: string;
  quotaLimit: number;
  quotaWindow: UsagePlanQuotaWindowValue;
  enabled: boolean;
};

type AssignedApiKey = {
  id: string;
  consumerId: string;
  name: string;
  keyPrefix: string;
  status: ApiKeyStatusValue;
};

type UsageCountByApiKey = {
  apiKeyId: string | null;
  _count: {
    _all: number;
  };
};

function mapUsageCountsByApiKeyId(
  usageCounts: UsageCountByApiKey[],
): Map<string, number> {
  const usageCountMap = new Map<string, number>();

  for (const usageCount of usageCounts) {
    if (usageCount.apiKeyId) {
      usageCountMap.set(usageCount.apiKeyId, usageCount._count._all);
    }
  }

  return usageCountMap;
}

function mapApiKeyToUsageSummary(
  apiKey: AssignedApiKey,
  usagePlan: UsagePlanWithQuota,
  usedRequests: number,
): UsagePlanUsageSummaryApiKey {
  const usageRatio = usagePlan.enabled
    ? usedRequests / usagePlan.quotaLimit
    : null;

  return {
    apiKeyId: apiKey.id,
    consumerId: apiKey.consumerId,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    status: apiKey.status,
    usedRequests,
    remainingRequests: usagePlan.enabled
      ? Math.max(usagePlan.quotaLimit - usedRequests, 0)
      : null,
    usageRatio,
    exceeded: usagePlan.enabled && usedRequests >= usagePlan.quotaLimit,
  };
}

export function mapUsagePlanUsageSummaryReadModelToResponse(
  summary: UsagePlanUsageSummaryReadModel,
): UsagePlanUsageSummaryResponse {
  return {
    usagePlan: summary.usagePlan,
    windowStartedAt: summary.windowStartedAt.toISOString(),
    windowEndsAt: summary.windowEndsAt.toISOString(),
    resetAt: summary.resetAt.toISOString(),
    assignedApiKeys: summary.assignedApiKeys,
    activeApiKeys: summary.activeApiKeys,
    totalRequestsInCurrentWindow: summary.totalRequestsInCurrentWindow,
    exceededApiKeys: summary.exceededApiKeys,
    nearLimitApiKeys: summary.nearLimitApiKeys,
    topApiKeysByUsage: summary.topApiKeysByUsage,
  };
}

export function createPrismaUsagePlanUsageSummaryReader(
  prisma: PrismaClient,
  options: PrismaUsagePlanUsageSummaryReaderOptions = {},
): UsagePlanUsageSummaryReader {
  const getNow = options.now ?? (() => new Date());

  return {
    getUsagePlanUsageSummary: async (usagePlanId: string) => {
      const usagePlan = (await prisma.usagePlan.findUnique({
        where: {
          id: usagePlanId,
        },
        select: {
          id: true,
          name: true,
          quotaLimit: true,
          quotaWindow: true,
          enabled: true,
        },
      })) as UsagePlanWithQuota | null;

      if (!usagePlan) {
        return null;
      }

      const { windowStartedAt, windowEndsAt } = getUsageQuotaWindowRange(
        usagePlan.quotaWindow,
        getNow(),
      );

      const assignedApiKeys = (await prisma.apiKey.findMany({
        where: {
          usagePlanId,
        },
        select: {
          id: true,
          consumerId: true,
          name: true,
          keyPrefix: true,
          status: true,
        },
      })) as AssignedApiKey[];

      if (assignedApiKeys.length === 0) {
        return {
          usagePlan,
          windowStartedAt,
          windowEndsAt,
          resetAt: windowEndsAt,
          assignedApiKeys: 0,
          activeApiKeys: 0,
          totalRequestsInCurrentWindow: 0,
          exceededApiKeys: 0,
          nearLimitApiKeys: 0,
          topApiKeysByUsage: [],
        };
      }

      const usageCounts = await prisma.apiUsageEvent.groupBy({
        by: ["apiKeyId"],
        where: {
          apiKeyId: {
            in: assignedApiKeys.map((apiKey) => apiKey.id),
          },
          occurredAt: {
            gte: windowStartedAt,
            lt: windowEndsAt,
          },
        },
        _count: {
          _all: true,
        },
      });

      const usageCountMap = mapUsageCountsByApiKeyId(usageCounts);

      const apiKeyUsageSummaries = assignedApiKeys.map((apiKey) =>
        mapApiKeyToUsageSummary(
          apiKey,
          usagePlan,
          usageCountMap.get(apiKey.id) ?? 0,
        ),
      );

      const activeApiKeyUsageSummaries = apiKeyUsageSummaries.filter(
        (apiKey) => apiKey.status === "ACTIVE",
      );

      const topApiKeysByUsage = [...apiKeyUsageSummaries]
        .sort((left, right) => {
          if (right.usedRequests !== left.usedRequests) {
            return right.usedRequests - left.usedRequests;
          }

          return left.name.localeCompare(right.name);
        })
        .slice(0, TOP_API_KEYS_LIMIT);

      return {
        usagePlan,
        windowStartedAt,
        windowEndsAt,
        resetAt: windowEndsAt,
        assignedApiKeys: assignedApiKeys.length,
        activeApiKeys: activeApiKeyUsageSummaries.length,
        totalRequestsInCurrentWindow: apiKeyUsageSummaries.reduce(
          (total, apiKey) => total + apiKey.usedRequests,
          0,
        ),
        exceededApiKeys: activeApiKeyUsageSummaries.filter(
          (apiKey) => apiKey.exceeded,
        ).length,
        nearLimitApiKeys: usagePlan.enabled
          ? activeApiKeyUsageSummaries.filter((apiKey) => {
              return (
                !apiKey.exceeded &&
                apiKey.usageRatio !== null &&
                apiKey.usageRatio >= NEAR_LIMIT_RATIO
              );
            }).length
          : 0,
        topApiKeysByUsage,
      };
    },
  };
}


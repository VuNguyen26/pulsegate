import {
  isBoundedArray,
  isRecord,
  isSafeRequestId,
} from "./admin-resource-contract";
import {
  DASHBOARD_ANALYTICS_MAX_LIMIT,
  isDashboardAnalyticsCursor,
  isDashboardAnalyticsIdentifier,
  type DashboardAnalyticsCacheStatus,
  type DashboardAnalyticsRouteMethod,
} from "./admin-analytics-query";

export type DashboardUsageSummarySubjectType =
  | "consumer"
  | "apiKey";

export type DashboardUsageSummary = {
  subjectType: DashboardUsageSummarySubjectType;
  subjectId: string;
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageDurationMs: number;
  cacheHits: number;
  cacheMisses: number;
  cacheBypasses: number;
  lastRequestAt: string | null;
};

function isNonNegativeSafeInteger(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isNonNegativeFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

export function isDashboardAnalyticsIsoTimestamp(
  value: unknown,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parsed = new Date(value);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString() === value
  );
}

function isNullableIsoTimestamp(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    isDashboardAnalyticsIsoTimestamp(value)
  );
}

export function isDashboardUsageSummary(
  value: unknown,
): value is DashboardUsageSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (
      value.subjectType === "consumer" ||
      value.subjectType === "apiKey"
    ) &&
    isDashboardAnalyticsIdentifier(value.subjectId) &&
    isNonNegativeSafeInteger(value.totalRequests) &&
    isNonNegativeSafeInteger(
      value.successfulRequests,
    ) &&
    isNonNegativeSafeInteger(value.errorRequests) &&
    isNonNegativeFiniteNumber(
      value.averageDurationMs,
    ) &&
    isNonNegativeSafeInteger(value.cacheHits) &&
    isNonNegativeSafeInteger(value.cacheMisses) &&
    isNonNegativeSafeInteger(value.cacheBypasses) &&
    isNullableIsoTimestamp(value.lastRequestAt)
  );
}

export function isDashboardUsageSummaryForSubject(
  value: unknown,
  subjectType: DashboardUsageSummarySubjectType,
  subjectId: string,
): value is DashboardUsageSummary {
  return (
    isDashboardAnalyticsIdentifier(subjectId) &&
    isDashboardUsageSummary(value) &&
    value.subjectType === subjectType &&
    value.subjectId === subjectId
  );
}
export type DashboardQuotaWindow =
  | "DAILY"
  | "MONTHLY";

export type DashboardApiKeyStatus =
  | "ACTIVE"
  | "REVOKED";

export type DashboardQuotaUsagePlan = {
  id: string;
  name: string;
  quotaLimit: number;
  quotaWindow: DashboardQuotaWindow;
  enabled: boolean;
};

export type DashboardApiKeyQuotaReason =
  | "NO_USAGE_PLAN"
  | "USAGE_PLAN_DISABLED"
  | "ACTIVE_USAGE_PLAN";

export type DashboardApiKeyQuotaState = {
  apiKeyId: string;
  consumerId: string | null;
  reason: DashboardApiKeyQuotaReason;
  usagePlan: DashboardQuotaUsagePlan | null;
  quota: {
    usedRequests: number;
    remainingRequests: number | null;
    windowStartedAt: string | null;
    windowEndsAt: string | null;
    resetAt: string | null;
    exceeded: boolean;
    enforced: boolean;
  };
};

export type DashboardUsagePlanTopApiKey = {
  apiKeyId: string;
  consumerId: string;
  name: string;
  keyPrefix: string;
  status: DashboardApiKeyStatus;
  usedRequests: number;
  remainingRequests: number | null;
  usageRatio: number | null;
  exceeded: boolean;
};

export type DashboardUsagePlanUsageSummary = {
  usagePlan: DashboardQuotaUsagePlan;
  windowStartedAt: string;
  windowEndsAt: string;
  resetAt: string;
  assignedApiKeys: number;
  activeApiKeys: number;
  totalRequestsInCurrentWindow: number;
  exceededApiKeys: number;
  nearLimitApiKeys: number;
  topApiKeysByUsage: DashboardUsagePlanTopApiKey[];
};

function isNullableNonNegativeSafeInteger(
  value: unknown,
): value is number | null {
  return (
    value === null ||
    isNonNegativeSafeInteger(value)
  );
}

function isNullableNonNegativeFiniteNumber(
  value: unknown,
): value is number | null {
  return (
    value === null ||
    isNonNegativeFiniteNumber(value)
  );
}

function isNullableAnalyticsIdentifier(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    isDashboardAnalyticsIdentifier(value)
  );
}

function isNonEmptyBoundedString(
  value: unknown,
  maximumLength: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maximumLength
  );
}

function isDashboardQuotaWindow(
  value: unknown,
): value is DashboardQuotaWindow {
  return (
    value === "DAILY" ||
    value === "MONTHLY"
  );
}

function isDashboardApiKeyStatus(
  value: unknown,
): value is DashboardApiKeyStatus {
  return (
    value === "ACTIVE" ||
    value === "REVOKED"
  );
}

function isDashboardQuotaUsagePlan(
  value: unknown,
): value is DashboardQuotaUsagePlan {
  return (
    isRecord(value) &&
    isDashboardAnalyticsIdentifier(value.id) &&
    isNonEmptyBoundedString(value.name, 256) &&
    isNonNegativeSafeInteger(value.quotaLimit) &&
    isDashboardQuotaWindow(value.quotaWindow) &&
    typeof value.enabled === "boolean"
  );
}

export function isDashboardApiKeyQuotaState(
  value: unknown,
): value is DashboardApiKeyQuotaState {
  if (
    !isRecord(value) ||
    !isDashboardAnalyticsIdentifier(value.apiKeyId) ||
    !isNullableAnalyticsIdentifier(value.consumerId) ||
    !isRecord(value.quota)
  ) {
    return false;
  }

  const quota = value.quota;

  if (
    !isNonNegativeSafeInteger(quota.usedRequests) ||
    !isNullableNonNegativeSafeInteger(
      quota.remainingRequests,
    ) ||
    !isNullableIsoTimestamp(
      quota.windowStartedAt,
    ) ||
    !isNullableIsoTimestamp(quota.windowEndsAt) ||
    !isNullableIsoTimestamp(quota.resetAt) ||
    typeof quota.exceeded !== "boolean" ||
    typeof quota.enforced !== "boolean"
  ) {
    return false;
  }

  if (value.reason === "NO_USAGE_PLAN") {
    return (
      value.usagePlan === null &&
      quota.usedRequests === 0 &&
      quota.remainingRequests === null &&
      quota.windowStartedAt === null &&
      quota.windowEndsAt === null &&
      quota.resetAt === null &&
      quota.exceeded === false &&
      quota.enforced === false
    );
  }

  if (
    value.reason === "USAGE_PLAN_DISABLED"
  ) {
    return (
      isDashboardQuotaUsagePlan(value.usagePlan) &&
      value.usagePlan.enabled === false &&
      quota.remainingRequests === null &&
      isDashboardAnalyticsIsoTimestamp(
        quota.windowStartedAt,
      ) &&
      isDashboardAnalyticsIsoTimestamp(
        quota.windowEndsAt,
      ) &&
      isDashboardAnalyticsIsoTimestamp(
        quota.resetAt,
      ) &&
      quota.exceeded === false &&
      quota.enforced === false
    );
  }

  if (value.reason === "ACTIVE_USAGE_PLAN") {
    return (
      isDashboardQuotaUsagePlan(value.usagePlan) &&
      value.usagePlan.enabled === true &&
      isNonNegativeSafeInteger(
        quota.remainingRequests,
      ) &&
      isDashboardAnalyticsIsoTimestamp(
        quota.windowStartedAt,
      ) &&
      isDashboardAnalyticsIsoTimestamp(
        quota.windowEndsAt,
      ) &&
      isDashboardAnalyticsIsoTimestamp(
        quota.resetAt,
      ) &&
      quota.enforced === true
    );
  }

  return false;
}

export function isDashboardApiKeyQuotaStateForKey(
  value: unknown,
  apiKeyId: string,
): value is DashboardApiKeyQuotaState {
  return (
    isDashboardAnalyticsIdentifier(apiKeyId) &&
    isDashboardApiKeyQuotaState(value) &&
    value.apiKeyId === apiKeyId
  );
}

function isDashboardUsagePlanTopApiKey(
  value: unknown,
): value is DashboardUsagePlanTopApiKey {
  return (
    isRecord(value) &&
    isDashboardAnalyticsIdentifier(value.apiKeyId) &&
    isDashboardAnalyticsIdentifier(
      value.consumerId,
    ) &&
    isNonEmptyBoundedString(value.name, 256) &&
    isNonEmptyBoundedString(value.keyPrefix, 128) &&
    isDashboardApiKeyStatus(value.status) &&
    isNonNegativeSafeInteger(value.usedRequests) &&
    isNullableNonNegativeSafeInteger(
      value.remainingRequests,
    ) &&
    isNullableNonNegativeFiniteNumber(
      value.usageRatio,
    ) &&
    typeof value.exceeded === "boolean"
  );
}

export function isDashboardUsagePlanUsageSummary(
  value: unknown,
): value is DashboardUsagePlanUsageSummary {
  if (
    !isRecord(value) ||
    !isDashboardQuotaUsagePlan(value.usagePlan) ||
    !isDashboardAnalyticsIsoTimestamp(
      value.windowStartedAt,
    ) ||
    !isDashboardAnalyticsIsoTimestamp(
      value.windowEndsAt,
    ) ||
    !isDashboardAnalyticsIsoTimestamp(value.resetAt) ||
    !isNonNegativeSafeInteger(
      value.assignedApiKeys,
    ) ||
    !isNonNegativeSafeInteger(value.activeApiKeys) ||
    !isNonNegativeSafeInteger(
      value.totalRequestsInCurrentWindow,
    ) ||
    !isNonNegativeSafeInteger(
      value.exceededApiKeys,
    ) ||
    !isNonNegativeSafeInteger(
      value.nearLimitApiKeys,
    ) ||
    !isBoundedArray(
      value.topApiKeysByUsage,
      isDashboardUsagePlanTopApiKey,
      5,
    )
  ) {
    return false;
  }

  if (
    value.activeApiKeys > value.assignedApiKeys ||
    value.exceededApiKeys > value.activeApiKeys ||
    value.nearLimitApiKeys > value.activeApiKeys ||
    value.topApiKeysByUsage.length >
      value.assignedApiKeys
  ) {
    return false;
  }

  if (!value.usagePlan.enabled) {
    return (
      value.exceededApiKeys === 0 &&
      value.nearLimitApiKeys === 0 &&
      value.topApiKeysByUsage.every(
        (item) =>
          item.remainingRequests === null &&
          item.usageRatio === null &&
          item.exceeded === false,
      )
    );
  }

  return value.topApiKeysByUsage.every(
    (item) =>
      isNonNegativeSafeInteger(
        item.remainingRequests,
      ) &&
      isNonNegativeFiniteNumber(
        item.usageRatio,
      ),
  );
}

export function isDashboardUsagePlanSummaryForPlan(
  value: unknown,
  usagePlanId: string,
): value is DashboardUsagePlanUsageSummary {
  return (
    isDashboardAnalyticsIdentifier(usagePlanId) &&
    isDashboardUsagePlanUsageSummary(value) &&
    value.usagePlan.id === usagePlanId
  );
}
export type DashboardUsageEvent = {
  id: string;
  requestId: string;
  routePath: string;
  routeMethod: DashboardAnalyticsRouteMethod;
  statusCode: number;
  durationMs: number;
  cacheStatus: DashboardAnalyticsCacheStatus | null;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
  occurredAt: string;
};

export type DashboardUsageEventsPagination = {
  limit: number;
  offset: number;
  total: number;
  hasNextPage: boolean;
  nextCursor: string | null;
};

export type DashboardUsageEventsFilters = {
  from: string | null;
  to: string | null;
  routePath: string | null;
  routeMethod: DashboardAnalyticsRouteMethod | null;
  statusCode: number | null;
  cacheStatus: DashboardAnalyticsCacheStatus | null;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
};

export type DashboardUsageEventsListing = {
  items: DashboardUsageEvent[];
  pagination: DashboardUsageEventsPagination;
  filters: DashboardUsageEventsFilters;
};

function isDashboardAnalyticsRouteMethod(
  value: unknown,
): value is DashboardAnalyticsRouteMethod {
  return (
    value === "GET" ||
    value === "POST" ||
    value === "PUT" ||
    value === "PATCH" ||
    value === "DELETE"
  );
}

function isDashboardAnalyticsCacheStatus(
  value: unknown,
): value is DashboardAnalyticsCacheStatus {
  return (
    value === "HIT" ||
    value === "MISS" ||
    value === "BYPASS"
  );
}

function isNullableAnalyticsRouteMethod(
  value: unknown,
): value is DashboardAnalyticsRouteMethod | null {
  return (
    value === null ||
    isDashboardAnalyticsRouteMethod(value)
  );
}

function isNullableAnalyticsCacheStatus(
  value: unknown,
): value is DashboardAnalyticsCacheStatus | null {
  return (
    value === null ||
    isDashboardAnalyticsCacheStatus(value)
  );
}

function isNullableBoundedString(
  value: unknown,
  maximumLength: number,
): value is string | null {
  return (
    value === null ||
    (
      typeof value === "string" &&
      value.trim().length > 0 &&
      value.length <= maximumLength
    )
  );
}

function isNullableStatusCode(
  value: unknown,
): value is number | null {
  return (
    value === null ||
    (
      Number.isSafeInteger(value) &&
      typeof value === "number" &&
      value >= 100 &&
      value <= 599
    )
  );
}

function isNullableUsageRoutePath(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    (
      typeof value === "string" &&
      value.startsWith("/") &&
      value.length <= 256 &&
      !value.includes("?") &&
      !value.includes("#")
    )
  );
}

function isDashboardUsageEvent(
  value: unknown,
): value is DashboardUsageEvent {
  return (
    isRecord(value) &&
    isDashboardAnalyticsIdentifier(value.id) &&
    isSafeRequestId(value.requestId) &&
    isNullableUsageRoutePath(value.routePath) &&
    value.routePath !== null &&
    isDashboardAnalyticsRouteMethod(
      value.routeMethod,
    ) &&
    isNullableStatusCode(value.statusCode) &&
    value.statusCode !== null &&
    isNonNegativeFiniteNumber(value.durationMs) &&
    isNullableAnalyticsCacheStatus(
      value.cacheStatus,
    ) &&
    isNullableBoundedString(
      value.apiKeyAuthSource,
      128,
    ) &&
    isNullableAnalyticsIdentifier(value.apiKeyId) &&
    isNullableAnalyticsIdentifier(
      value.consumerId,
    ) &&
    isDashboardAnalyticsIsoTimestamp(
      value.occurredAt,
    )
  );
}

function isDashboardUsageEventsPagination(
  value: unknown,
): value is DashboardUsageEventsPagination {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.limit) ||
    typeof value.limit !== "number" ||
    value.limit < 1 ||
    value.limit > DASHBOARD_ANALYTICS_MAX_LIMIT ||
    !isNonNegativeSafeInteger(value.offset) ||
    !isNonNegativeSafeInteger(value.total) ||
    typeof value.hasNextPage !== "boolean"
  ) {
    return false;
  }

  if (value.hasNextPage) {
    return isDashboardAnalyticsCursor(
      value.nextCursor,
    );
  }

  return value.nextCursor === null;
}

function isDashboardUsageEventsFilters(
  value: unknown,
): value is DashboardUsageEventsFilters {
  return (
    isRecord(value) &&
    (
      value.from === null ||
      isDashboardAnalyticsIsoTimestamp(value.from)
    ) &&
    (
      value.to === null ||
      isDashboardAnalyticsIsoTimestamp(value.to)
    ) &&
    isNullableUsageRoutePath(value.routePath) &&
    isNullableAnalyticsRouteMethod(
      value.routeMethod,
    ) &&
    isNullableStatusCode(value.statusCode) &&
    isNullableAnalyticsCacheStatus(
      value.cacheStatus,
    ) &&
    isNullableBoundedString(
      value.apiKeyAuthSource,
      128,
    ) &&
    isNullableAnalyticsIdentifier(value.apiKeyId) &&
    isNullableAnalyticsIdentifier(value.consumerId)
  );
}

export function isDashboardUsageEventsListing(
  value: unknown,
): value is DashboardUsageEventsListing {
  if (
    !isRecord(value) ||
    !isDashboardUsageEventsPagination(
      value.pagination,
    ) ||
    !isDashboardUsageEventsFilters(value.filters) ||
    !isBoundedArray(
      value.items,
      isDashboardUsageEvent,
      DASHBOARD_ANALYTICS_MAX_LIMIT,
    )
  ) {
    return false;
  }

  return value.items.length <= value.pagination.limit;
}

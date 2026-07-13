import type {
  DashboardRollupGranularity,
} from "./admin-rollup-query";

type NullableString = string | null;

export type DashboardRollupWindow = {
  requestedFrom: string;
  requestedTo: string;
  rebuildFrom: NullableString;
  rebuildTo: NullableString;
  bucketCount: number;
};

type DashboardRollupCommonFilters = {
  routePath: NullableString;
  routeMethod: NullableString;
  statusCode: number | null;
  apiKeyAuthSource: NullableString;
  apiKeyId: NullableString;
  consumerId: NullableString;
};

export type DashboardUsageRollupFilters =
  DashboardRollupCommonFilters & {
    cacheStatus: NullableString;
  };

export type DashboardRejectedRollupFilters =
  DashboardRollupCommonFilters & {
    rejectionReason: NullableString;
  };

export type DashboardUsageRollupItem = {
  id: string;
  granularity: DashboardRollupGranularity;
  bucketStart: string;
  bucketEnd: string;
  dimensionHash: string;
  consumerId: NullableString;
  apiKeyId: NullableString;
  routePath: NullableString;
  routeMethod: NullableString;
  statusClass: string;
  cacheStatus: NullableString;
  apiKeyAuthSource: NullableString;
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  totalDurationMs: number;
  averageDurationMs: number;
  cacheHits: number;
  cacheMisses: number;
  cacheBypasses: number;
  lastRequestAt: string;
  rolledUpAt: string;
  updatedAt: string;
};

export type DashboardRejectedRollupItem = {
  id: string;
  granularity: DashboardRollupGranularity;
  bucketStart: string;
  bucketEnd: string;
  dimensionHash: string;
  consumerId: NullableString;
  apiKeyId: NullableString;
  routePath: NullableString;
  routeMethod: NullableString;
  rejectionReason: string;
  statusCode: number;
  apiKeyAuthSource: NullableString;
  totalRejectedRequests: number;
  lastRejectedAt: string;
  rolledUpAt: string;
  updatedAt: string;
};

export type DashboardUsageRollupRead = {
  source: "usage";
  granularity: DashboardRollupGranularity;
  window: DashboardRollupWindow;
  limit: number;
  filters: DashboardUsageRollupFilters;
  count: number;
  items: DashboardUsageRollupItem[];
};

export type DashboardRejectedRollupRead = {
  source: "rejected";
  granularity: DashboardRollupGranularity;
  window: DashboardRollupWindow;
  limit: number;
  filters: DashboardRejectedRollupFilters;
  count: number;
  items: DashboardRejectedRollupItem[];
};

export type DashboardRollupRead =
  | DashboardUsageRollupRead
  | DashboardRejectedRollupRead;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actualKeys = Object.keys(value);

  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) =>
      Object.prototype.hasOwnProperty.call(
        value,
        key,
      ),
    )
  );
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 512
  );
}

function isNullableString(
  value: unknown,
): value is NullableString {
  return (
    value === null ||
    isNonEmptyString(value)
  );
}

function isIsoTimestamp(
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

function isNullableTimestamp(
  value: unknown,
): value is NullableString {
  return (
    value === null ||
    isIsoTimestamp(value)
  );
}

function isNonNegativeInteger(
  value: unknown,
): value is number {
  return (
    Number.isSafeInteger(value) &&
    Number(value) >= 0
  );
}

function isGranularity(
  value: unknown,
): value is DashboardRollupGranularity {
  return (
    value === "hour" ||
    value === "day"
  );
}

function isStatusCode(
  value: unknown,
): value is number {
  return (
    Number.isSafeInteger(value) &&
    Number(value) >= 100 &&
    Number(value) <= 599
  );
}

function isRollupWindow(
  value: unknown,
): value is DashboardRollupWindow {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "requestedFrom",
      "requestedTo",
      "rebuildFrom",
      "rebuildTo",
      "bucketCount",
    ])
  ) {
    return false;
  }

  return (
    isIsoTimestamp(value.requestedFrom) &&
    isIsoTimestamp(value.requestedTo) &&
    isNullableTimestamp(value.rebuildFrom) &&
    isNullableTimestamp(value.rebuildTo) &&
    isNonNegativeInteger(value.bucketCount) &&
    value.bucketCount <= 744
  );
}

function isCommonFilters(
  value: Record<string, unknown>,
): boolean {
  return (
    isNullableString(value.routePath) &&
    isNullableString(value.routeMethod) &&
    (
      value.statusCode === null ||
      isStatusCode(value.statusCode)
    ) &&
    isNullableString(value.apiKeyAuthSource) &&
    isNullableString(value.apiKeyId) &&
    isNullableString(value.consumerId)
  );
}

function isUsageFilters(
  value: unknown,
): value is DashboardUsageRollupFilters {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "routePath",
      "routeMethod",
      "statusCode",
      "apiKeyAuthSource",
      "apiKeyId",
      "consumerId",
      "cacheStatus",
    ])
  ) {
    return false;
  }

  return (
    isCommonFilters(value) &&
    isNullableString(value.cacheStatus)
  );
}

function isRejectedFilters(
  value: unknown,
): value is DashboardRejectedRollupFilters {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "routePath",
      "routeMethod",
      "statusCode",
      "apiKeyAuthSource",
      "apiKeyId",
      "consumerId",
      "rejectionReason",
    ])
  ) {
    return false;
  }

  return (
    isCommonFilters(value) &&
    isNullableString(value.rejectionReason)
  );
}

function isUsageItem(
  value: unknown,
  granularity: DashboardRollupGranularity,
): value is DashboardUsageRollupItem {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "id",
      "granularity",
      "bucketStart",
      "bucketEnd",
      "dimensionHash",
      "consumerId",
      "apiKeyId",
      "routePath",
      "routeMethod",
      "statusClass",
      "cacheStatus",
      "apiKeyAuthSource",
      "totalRequests",
      "successfulRequests",
      "errorRequests",
      "totalDurationMs",
      "averageDurationMs",
      "cacheHits",
      "cacheMisses",
      "cacheBypasses",
      "lastRequestAt",
      "rolledUpAt",
      "updatedAt",
    ])
  ) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    value.granularity === granularity &&
    isIsoTimestamp(value.bucketStart) &&
    isIsoTimestamp(value.bucketEnd) &&
    isNonEmptyString(value.dimensionHash) &&
    isNullableString(value.consumerId) &&
    isNullableString(value.apiKeyId) &&
    isNullableString(value.routePath) &&
    isNullableString(value.routeMethod) &&
    isNonEmptyString(value.statusClass) &&
    isNullableString(value.cacheStatus) &&
    isNullableString(value.apiKeyAuthSource) &&
    isNonNegativeInteger(value.totalRequests) &&
    isNonNegativeInteger(value.successfulRequests) &&
    isNonNegativeInteger(value.errorRequests) &&
    isNonNegativeInteger(value.totalDurationMs) &&
    isNonNegativeInteger(value.averageDurationMs) &&
    isNonNegativeInteger(value.cacheHits) &&
    isNonNegativeInteger(value.cacheMisses) &&
    isNonNegativeInteger(value.cacheBypasses) &&
    isIsoTimestamp(value.lastRequestAt) &&
    isIsoTimestamp(value.rolledUpAt) &&
    isIsoTimestamp(value.updatedAt)
  );
}

function isRejectedItem(
  value: unknown,
  granularity: DashboardRollupGranularity,
): value is DashboardRejectedRollupItem {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "id",
      "granularity",
      "bucketStart",
      "bucketEnd",
      "dimensionHash",
      "consumerId",
      "apiKeyId",
      "routePath",
      "routeMethod",
      "rejectionReason",
      "statusCode",
      "apiKeyAuthSource",
      "totalRejectedRequests",
      "lastRejectedAt",
      "rolledUpAt",
      "updatedAt",
    ])
  ) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    value.granularity === granularity &&
    isIsoTimestamp(value.bucketStart) &&
    isIsoTimestamp(value.bucketEnd) &&
    isNonEmptyString(value.dimensionHash) &&
    isNullableString(value.consumerId) &&
    isNullableString(value.apiKeyId) &&
    isNullableString(value.routePath) &&
    isNullableString(value.routeMethod) &&
    isNonEmptyString(value.rejectionReason) &&
    isStatusCode(value.statusCode) &&
    isNullableString(value.apiKeyAuthSource) &&
    isNonNegativeInteger(
      value.totalRejectedRequests,
    ) &&
    isIsoTimestamp(value.lastRejectedAt) &&
    isIsoTimestamp(value.rolledUpAt) &&
    isIsoTimestamp(value.updatedAt)
  );
}

function isBoundedItems(
  items: unknown,
  limit: number,
  validator: (value: unknown) => boolean,
): boolean {
  return (
    Array.isArray(items) &&
    items.length <= limit &&
    items.every(validator)
  );
}

export function isDashboardRollupRead(
  value: unknown,
): value is DashboardRollupRead {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "source",
      "granularity",
      "window",
      "limit",
      "filters",
      "count",
      "items",
    ])
  ) {
    return false;
  }

  const {
    source,
    granularity,
    window,
    limit,
    filters,
    count,
    items,
  } = value;

  if (
    (
      source !== "usage" &&
      source !== "rejected"
    ) ||
    !isGranularity(granularity) ||
    !isRollupWindow(window) ||
    !Number.isSafeInteger(limit) ||
    Number(limit) < 1 ||
    Number(limit) > 100 ||
    !isNonNegativeInteger(count) ||
    !Array.isArray(items) ||
    items.length !== Number(count)
  ) {
    return false;
  }

  const boundedLimit = Number(limit);

  if (source === "usage") {
    return (
      isUsageFilters(filters) &&
      isBoundedItems(
        items,
        boundedLimit,
        (item) =>
          isUsageItem(item, granularity),
      )
    );
  }

  return (
    isRejectedFilters(filters) &&
    isBoundedItems(
      items,
      boundedLimit,
      (item) =>
        isRejectedItem(item, granularity),
    )
  );
}
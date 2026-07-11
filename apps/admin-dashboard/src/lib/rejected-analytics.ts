import {
  containsSensitiveAdminField,
  isBoundedArray,
  isRecord,
  isSafeRequestId,
} from "./admin-resource-contract";
import {
  isDashboardAnalyticsIdentifier,
} from "./admin-analytics-query";

export const DASHBOARD_REJECTION_REASONS = [
  "API_KEY_MISSING",
  "API_KEY_INVALID",
  "JWT_TOKEN_MISSING",
  "JWT_TOKEN_INVALID",
  "RATE_LIMIT_EXCEEDED",
  "QUOTA_EXCEEDED",
] as const;

export type DashboardRejectionReason =
  (typeof DASHBOARD_REJECTION_REASONS)[number];

export const DASHBOARD_REJECTED_ROUTE_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

export type DashboardRejectedRouteMethod =
  (typeof DASHBOARD_REJECTED_ROUTE_METHODS)[number];

export type DashboardRejectedEventsFilters = {
  from: string | null;
  to: string | null;
  rejectionReason: DashboardRejectionReason | null;
  statusCode: number | null;
  routePath: string | null;
  routeMethod: DashboardRejectedRouteMethod | null;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
};

export type DashboardRejectedEventsByReason = {
  rejectionReason: DashboardRejectionReason;
  count: number;
};

export type DashboardRejectedEventsByStatusCode = {
  statusCode: number;
  count: number;
};

export type DashboardRejectedEventsSummary = {
  totalRejectedRequests: number;
  byReason: DashboardRejectedEventsByReason[];
  byStatusCode: DashboardRejectedEventsByStatusCode[];
  lastRejectedAt: string | null;
  filters: DashboardRejectedEventsFilters;
};

export type DashboardRejectedEvent = {
  id: string;
  requestId: string;
  routePath: string | null;
  routeMethod: DashboardRejectedRouteMethod | null;
  statusCode: number;
  rejectionReason: DashboardRejectionReason;
  apiKeyAuthSource: string | null;
  apiKeyId: string | null;
  consumerId: string | null;
  occurredAt: string;
};

export type DashboardRejectedEventsPagination = {
  limit: number;
  offset: number;
  total: number;
  hasNextPage: boolean;
  nextCursor: string | null;
};

export type DashboardRejectedEventsListing = {
  items: DashboardRejectedEvent[];
  pagination: DashboardRejectedEventsPagination;
  filters: DashboardRejectedEventsFilters;
};

type UpstreamRejectedEvent =
  DashboardRejectedEvent & {
    metadata: unknown;
  };

type UpstreamRejectedEventsListing = {
  items: UpstreamRejectedEvent[];
  pagination: DashboardRejectedEventsPagination;
  filters: DashboardRejectedEventsFilters;
};

const REJECTION_REASON_SET =
  new Set<string>(DASHBOARD_REJECTION_REASONS);

const ROUTE_METHOD_SET =
  new Set<string>(DASHBOARD_REJECTED_ROUTE_METHODS);

const CURSOR_PATTERN =
  /^[A-Za-z0-9_-]{1,1024}$/;

const ROUTE_PATH_PATTERN =
  /^\/[^\u0000-\u001f\u007f?#]{0,255}$/;

const SAFE_TEXT_PATTERN =
  /^[^\u0000-\u001f\u007f]{1,128}$/;

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actualKeys = Object.keys(value).sort();
  const sortedExpected = [...expectedKeys].sort();

  return (
    actualKeys.length === sortedExpected.length &&
    actualKeys.every(
      (key, index) => key === sortedExpected[index],
    )
  );
}

function isNonnegativeSafeInteger(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isStatusCode(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 100 &&
    value <= 599
  );
}

function isCanonicalIsoTimestamp(
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

function isNullableCanonicalIsoTimestamp(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    isCanonicalIsoTimestamp(value)
  );
}

function isRejectionReason(
  value: unknown,
): value is DashboardRejectionReason {
  return (
    typeof value === "string" &&
    REJECTION_REASON_SET.has(value)
  );
}

function isNullableRejectionReason(
  value: unknown,
): value is DashboardRejectionReason | null {
  return value === null || isRejectionReason(value);
}

function isRouteMethod(
  value: unknown,
): value is DashboardRejectedRouteMethod {
  return (
    typeof value === "string" &&
    ROUTE_METHOD_SET.has(value)
  );
}

function isNullableRouteMethod(
  value: unknown,
): value is DashboardRejectedRouteMethod | null {
  return value === null || isRouteMethod(value);
}

function isNullableStatusCode(
  value: unknown,
): value is number | null {
  return value === null || isStatusCode(value);
}

function isNullableRoutePath(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    (
      typeof value === "string" &&
      ROUTE_PATH_PATTERN.test(value)
    )
  );
}

function isNullableIdentifier(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    (
      typeof value === "string" &&
      isDashboardAnalyticsIdentifier(value)
    )
  );
}

function isNullableSafeText(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    (
      typeof value === "string" &&
      SAFE_TEXT_PATTERN.test(value)
    )
  );
}

function isRejectedEventsFilters(
  value: unknown,
): value is DashboardRejectedEventsFilters {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "from",
      "to",
      "rejectionReason",
      "statusCode",
      "routePath",
      "routeMethod",
      "apiKeyAuthSource",
      "apiKeyId",
      "consumerId",
    ]) ||
    !isNullableCanonicalIsoTimestamp(value.from) ||
    !isNullableCanonicalIsoTimestamp(value.to) ||
    !isNullableRejectionReason(
      value.rejectionReason,
    ) ||
    !isNullableStatusCode(value.statusCode) ||
    !isNullableRoutePath(value.routePath) ||
    !isNullableRouteMethod(value.routeMethod) ||
    !isNullableSafeText(value.apiKeyAuthSource) ||
    !isNullableIdentifier(value.apiKeyId) ||
    !isNullableIdentifier(value.consumerId)
  ) {
    return false;
  }

  if (value.from && value.to) {
    const fromTime = Date.parse(value.from);
    const toTime = Date.parse(value.to);

    if (
      fromTime > toTime ||
      toTime - fromTime >
        31 * 24 * 60 * 60 * 1000
    ) {
      return false;
    }
  }

  return true;
}

function isByReasonItem(
  value: unknown,
): value is DashboardRejectedEventsByReason {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "rejectionReason",
      "count",
    ]) &&
    isRejectionReason(value.rejectionReason) &&
    isNonnegativeSafeInteger(value.count)
  );
}

function isByStatusCodeItem(
  value: unknown,
): value is DashboardRejectedEventsByStatusCode {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "statusCode",
      "count",
    ]) &&
    isStatusCode(value.statusCode) &&
    isNonnegativeSafeInteger(value.count)
  );
}

function hasUniqueValues<T>(
  items: readonly T[],
  selectValue: (item: T) => string | number,
): boolean {
  return (
    new Set(items.map(selectValue)).size ===
    items.length
  );
}

export function isDashboardRejectedEventsSummary(
  value: unknown,
): value is DashboardRejectedEventsSummary {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "totalRejectedRequests",
      "byReason",
      "byStatusCode",
      "lastRejectedAt",
      "filters",
    ]) ||
    !isNonnegativeSafeInteger(
      value.totalRejectedRequests,
    ) ||
    !isBoundedArray(
      value.byReason,
      isByReasonItem,
      DASHBOARD_REJECTION_REASONS.length,
    ) ||
    !isBoundedArray(
      value.byStatusCode,
      isByStatusCodeItem,
      500,
    ) ||
    !isNullableCanonicalIsoTimestamp(
      value.lastRejectedAt,
    ) ||
    !isRejectedEventsFilters(value.filters)
  ) {
    return false;
  }

  if (
    !hasUniqueValues(
      value.byReason,
      (item) => item.rejectionReason,
    ) ||
    !hasUniqueValues(
      value.byStatusCode,
      (item) => item.statusCode,
    )
  ) {
    return false;
  }

  const reasonTotal = value.byReason.reduce(
    (total, item) => total + item.count,
    0,
  );

  const statusTotal = value.byStatusCode.reduce(
    (total, item) => total + item.count,
    0,
  );

  if (
    reasonTotal !== value.totalRejectedRequests ||
    statusTotal !== value.totalRejectedRequests
  ) {
    return false;
  }

  if (value.totalRejectedRequests === 0) {
    return (
      value.byReason.length === 0 &&
      value.byStatusCode.length === 0 &&
      value.lastRejectedAt === null
    );
  }

  return value.lastRejectedAt !== null;
}

function isUpstreamRejectedEvent(
  value: unknown,
): value is UpstreamRejectedEvent {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "id",
      "requestId",
      "routePath",
      "routeMethod",
      "statusCode",
      "rejectionReason",
      "apiKeyAuthSource",
      "apiKeyId",
      "consumerId",
      "metadata",
      "occurredAt",
    ]) &&
    typeof value.id === "string" &&
    isDashboardAnalyticsIdentifier(value.id) &&
    isSafeRequestId(value.requestId) &&
    isNullableRoutePath(value.routePath) &&
    isNullableRouteMethod(value.routeMethod) &&
    isStatusCode(value.statusCode) &&
    isRejectionReason(value.rejectionReason) &&
    isNullableSafeText(value.apiKeyAuthSource) &&
    isNullableIdentifier(value.apiKeyId) &&
    isNullableIdentifier(value.consumerId) &&
    !containsSensitiveAdminField(value.metadata) &&
    isCanonicalIsoTimestamp(value.occurredAt)
  );
}

function isRejectedEventsPagination(
  value: unknown,
): value is DashboardRejectedEventsPagination {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "limit",
      "offset",
      "total",
      "hasNextPage",
      "nextCursor",
    ]) &&
    typeof value.limit === "number" &&
    Number.isInteger(value.limit) &&
    value.limit >= 1 &&
    value.limit <= 100 &&
    isNonnegativeSafeInteger(value.offset) &&
    isNonnegativeSafeInteger(value.total) &&
    typeof value.hasNextPage === "boolean" &&
    (
      value.nextCursor === null ||
      (
        typeof value.nextCursor === "string" &&
        CURSOR_PATTERN.test(value.nextCursor)
      )
    ) &&
    value.hasNextPage ===
      (value.nextCursor !== null)
  );
}

function isDescendingRejectedEvents(
  items: readonly UpstreamRejectedEvent[],
): boolean {
  for (let index = 1; index < items.length; index++) {
    const previous = items[index - 1];
    const current = items[index];

    if (!previous || !current) {
      return false;
    }

    const previousTime =
      Date.parse(previous.occurredAt);
    const currentTime =
      Date.parse(current.occurredAt);

    if (previousTime < currentTime) {
      return false;
    }

    if (
      previousTime === currentTime &&
      previous.id <= current.id
    ) {
      return false;
    }
  }

  return true;
}

function isUpstreamRejectedEventsListing(
  value: unknown,
): value is UpstreamRejectedEventsListing {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "items",
      "pagination",
      "filters",
    ]) ||
    !isBoundedArray(
      value.items,
      isUpstreamRejectedEvent,
      100,
    ) ||
    !isRejectedEventsPagination(
      value.pagination,
    ) ||
    !isRejectedEventsFilters(value.filters)
  ) {
    return false;
  }

  if (
    value.items.length >
      value.pagination.limit ||
    value.pagination.total <
      value.items.length ||
    (
      value.pagination.hasNextPage &&
      value.items.length === 0
    ) ||
    !hasUniqueValues(
      value.items,
      (item) => item.id,
    ) ||
    !isDescendingRejectedEvents(value.items)
  ) {
    return false;
  }

  return true;
}

export function sanitizeDashboardRejectedEventsListing(
  value: unknown,
): DashboardRejectedEventsListing | null {
  if (!isUpstreamRejectedEventsListing(value)) {
    return null;
  }

  return {
    items: value.items.map((item) => ({
      id: item.id,
      requestId: item.requestId,
      routePath: item.routePath,
      routeMethod: item.routeMethod,
      statusCode: item.statusCode,
      rejectionReason: item.rejectionReason,
      apiKeyAuthSource: item.apiKeyAuthSource,
      apiKeyId: item.apiKeyId,
      consumerId: item.consumerId,
      occurredAt: item.occurredAt,
    })),
    pagination: value.pagination,
    filters: value.filters,
  };
}

export function isDashboardRejectedEventsListing(
  value: unknown,
): value is DashboardRejectedEventsListing {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "items",
      "pagination",
      "filters",
    ]) ||
    !isBoundedArray(
      value.items,
      (item): item is DashboardRejectedEvent =>
        (
          isRecord(item) &&
          hasExactKeys(item, [
            "id",
            "requestId",
            "routePath",
            "routeMethod",
            "statusCode",
            "rejectionReason",
            "apiKeyAuthSource",
            "apiKeyId",
            "consumerId",
            "occurredAt",
          ]) &&
          typeof item.id === "string" &&
          isDashboardAnalyticsIdentifier(item.id) &&
          isSafeRequestId(item.requestId) &&
          isNullableRoutePath(item.routePath) &&
          isNullableRouteMethod(item.routeMethod) &&
          isStatusCode(item.statusCode) &&
          isRejectionReason(item.rejectionReason) &&
          isNullableSafeText(
            item.apiKeyAuthSource,
          ) &&
          isNullableIdentifier(item.apiKeyId) &&
          isNullableIdentifier(item.consumerId) &&
          isCanonicalIsoTimestamp(
            item.occurredAt,
          )
        ),
      100,
    ) ||
    !isRejectedEventsPagination(
      value.pagination,
    ) ||
    !isRejectedEventsFilters(value.filters)
  ) {
    return false;
  }

  return value.items.every(
    (item) =>
      !Object.prototype.hasOwnProperty.call(
        item,
        "metadata",
      ),
  );
}

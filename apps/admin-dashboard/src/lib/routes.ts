import {
  isOptionalRouteRequestHost,
  type RouteRequestHost,
} from "./route-host";
import {
  loadDashboardAdminResource,
} from "./admin-resource";
import {
  containsSensitiveAdminField,
  isBoundedArray,
  isRecord,
  readSafeRequestId,
  type DashboardAdminResourceError,
  type DashboardAdminResourceErrorCode,
  type DashboardAdminResourceLoadResult,
} from "./admin-resource-contract";

export const MAX_DASHBOARD_ROUTES = 500;
export const MAX_DASHBOARD_ROUTE_HEADERS = 32;
export const MAX_DASHBOARD_RETRY_STATUSES = 20;

export type DashboardRouteMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export type DashboardRouteHeaderMap =
  Record<string, string>;

export type DashboardRouteTransformPolicy = {
  enabled: boolean;
  addHeaders?: DashboardRouteHeaderMap | null;
  removeHeaders?: string[] | null;
};

export type DashboardRoutePolicies = {
  auth: {
    requireApiKey: boolean;
    requireJwt: boolean;
  };
  timeout: {
    enabled: boolean;
    timeoutMs: number;
  };
  cache: {
    enabled: boolean;
    ttlSeconds: number;
  };
  rateLimit: {
    enabled: boolean;
    limit: number;
    windowMs: number;
  };
  requestTransform: DashboardRouteTransformPolicy;
  responseTransform: DashboardRouteTransformPolicy;
  retry: {
    enabled: boolean;
    attempts: number;
    retryOnStatuses: number[];
  };
};

export type DashboardPersistedRoute = {
  id: string;
  serviceName: string;
  gatewayPath: string;
  requestHost?: RouteRequestHost;
  downstreamUrl: string;
  method: DashboardRouteMethod;
  enabled: boolean;
  priority: number;
  policies: DashboardRoutePolicies;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
};

export type DashboardRuntimeRoute = {
  method: DashboardRouteMethod;
  gatewayPath: string;
  requestHost?: RouteRequestHost;
  serviceName: string;
};

export type DashboardRouteRuntimeSnapshot = {
  mode: "runtime-registry";
  available: boolean;
  version: number | null;
  loadedAt: string | null;
  routeCount: number;
  routes: DashboardRuntimeRoute[];
};

export type DashboardRoutesLoadResult =
  DashboardAdminResourceLoadResult<
    DashboardPersistedRoute[]
  >;

export type DashboardRouteLoadResult =
  DashboardAdminResourceLoadResult<
    DashboardPersistedRoute
  >;

export type DashboardRouteRuntimeLoadResult =
  DashboardAdminResourceLoadResult<
    DashboardRouteRuntimeSnapshot
  >;

const SAFE_ERROR_CODES =
  new Set<DashboardAdminResourceErrorCode>([
    "ADMIN_DASHBOARD_CONFIG_MISSING",
    "ADMIN_DASHBOARD_CONFIG_INVALID",
    "ADMIN_DASHBOARD_UNAUTHORIZED",
    "ADMIN_DASHBOARD_FORBIDDEN",
    "ADMIN_DASHBOARD_NOT_FOUND",
    "ADMIN_DASHBOARD_TIMEOUT",
    "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE",
    "ADMIN_DASHBOARD_UPSTREAM_ERROR",
    "ADMIN_DASHBOARD_INVALID_RESPONSE",
  ]);

const ROUTE_ID_PATTERN =
  /^[A-Za-z0-9_-]{1,128}$/;
const HEADER_NAME_PATTERN =
  /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

function invalidResponseError(): DashboardAdminResourceError {
  return {
    code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
    message:
      "The Dashboard received an invalid route response.",
    requestId: null,
  };
}

function isNullableString(
  value: unknown,
): value is string | null {
  return value === null || typeof value === "string";
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

function isSafeIntegerBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isIsoTimestamp(
  value: unknown,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parsedTime = Date.parse(value);

  return (
    !Number.isNaN(parsedTime) &&
    new Date(parsedTime).toISOString() === value
  );
}

function isNullableIsoTimestamp(
  value: unknown,
): value is string | null {
  return value === null || isIsoTimestamp(value);
}

function isDashboardRouteMethod(
  value: unknown,
): value is DashboardRouteMethod {
  return (
    value === "GET" ||
    value === "POST" ||
    value === "PUT" ||
    value === "PATCH" ||
    value === "DELETE"
  );
}

function isGatewayPath(
  value: unknown,
): value is string {
  return (
    isNonEmptyBoundedString(value, 2_048) &&
    value.startsWith("/") &&
    !value.includes("?") &&
    !value.includes("#")
  );
}

function isSafeDownstreamUrl(
  value: unknown,
): value is string {
  if (
    !isNonEmptyBoundedString(value, 2_048)
  ) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" ||
        url.protocol === "https:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function isHeaderMapOrAbsent(
  value: unknown,
): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  const entries = Object.entries(value);

  return (
    entries.length <= MAX_DASHBOARD_ROUTE_HEADERS &&
    entries.every(
      ([name, headerValue]) =>
        HEADER_NAME_PATTERN.test(name) &&
        typeof headerValue === "string" &&
        headerValue.length <= 512,
    )
  );
}

function isHeaderListOrAbsent(
  value: unknown,
): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  return (
    Array.isArray(value) &&
    value.length <= MAX_DASHBOARD_ROUTE_HEADERS &&
    value.every(
      (headerName) =>
        typeof headerName === "string" &&
        HEADER_NAME_PATTERN.test(headerName),
    )
  );
}

function isTransformPolicy(
  value: unknown,
): value is DashboardRouteTransformPolicy {
  return (
    isRecord(value) &&
    typeof value.enabled === "boolean" &&
    isHeaderMapOrAbsent(value.addHeaders) &&
    isHeaderListOrAbsent(value.removeHeaders)
  );
}

function isDashboardRoutePolicies(
  value: unknown,
): value is DashboardRoutePolicies {
  if (
    !isRecord(value) ||
    !isRecord(value.auth) ||
    !isRecord(value.timeout) ||
    !isRecord(value.cache) ||
    !isRecord(value.rateLimit) ||
    !isTransformPolicy(value.requestTransform) ||
    !isTransformPolicy(value.responseTransform) ||
    !isRecord(value.retry)
  ) {
    return false;
  }

  return (
    typeof value.auth.requireApiKey === "boolean" &&
    typeof value.auth.requireJwt === "boolean" &&
    typeof value.timeout.enabled === "boolean" &&
    isSafeIntegerBetween(
      value.timeout.timeoutMs,
      0,
      600_000,
    ) &&
    typeof value.cache.enabled === "boolean" &&
    isSafeIntegerBetween(
      value.cache.ttlSeconds,
      0,
      86_400,
    ) &&
    typeof value.rateLimit.enabled === "boolean" &&
    isSafeIntegerBetween(
      value.rateLimit.limit,
      0,
      10_000_000,
    ) &&
    isSafeIntegerBetween(
      value.rateLimit.windowMs,
      0,
      86_400_000,
    ) &&
    typeof value.retry.enabled === "boolean" &&
    isSafeIntegerBetween(
      value.retry.attempts,
      0,
      20,
    ) &&
    Array.isArray(value.retry.retryOnStatuses) &&
    value.retry.retryOnStatuses.length <=
      MAX_DASHBOARD_RETRY_STATUSES &&
    value.retry.retryOnStatuses.every(
      (statusCode) =>
        isSafeIntegerBetween(statusCode, 100, 599),
    )
  );
}

function readErrorPayload(
  value: unknown,
): DashboardAdminResourceError | null {
  if (
    !isRecord(value) ||
    !isRecord(value.error) ||
    typeof value.error.code !== "string" ||
    !SAFE_ERROR_CODES.has(
      value.error.code as DashboardAdminResourceErrorCode,
    ) ||
    typeof value.error.message !== "string"
  ) {
    return null;
  }

  return {
    code:
      value.error.code as DashboardAdminResourceErrorCode,
    message: value.error.message,
    requestId:
      value.error.requestId === null
        ? null
        : readSafeRequestId(value.error.requestId),
  };
}

async function loadFixedRouteResource<T>(
  path: string,
  validateData: (value: unknown) => value is T,
  fetchImplementation: typeof fetch,
  signal?: AbortSignal,
): Promise<DashboardAdminResourceLoadResult<T>> {
  try {
    const requestInit: RequestInit = {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    };

    if (signal) {
      requestInit.signal = signal;
    }

    const response = await fetchImplementation(
      path,
      requestInit,
    );

    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (response.ok) {
      if (
        !isRecord(payload) ||
        !("data" in payload) ||
        containsSensitiveAdminField(payload.data) ||
        !validateData(payload.data)
      ) {
        return {
          status: "error",
          error: invalidResponseError(),
        };
      }

      return {
        status: "success",
        data: payload.data,
      };
    }

    return {
      status: "error",
      error:
        readErrorPayload(payload) ??
        invalidResponseError(),
    };
  } catch {
    return {
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_UNAVAILABLE",
        message:
          "The Dashboard route endpoint is unavailable.",
        requestId: null,
      },
    };
  }
}

export function isDashboardRouteId(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    ROUTE_ID_PATTERN.test(value)
  );
}

export function getDashboardRoutePath(
  routeId: string,
): string | null {
  if (!isDashboardRouteId(routeId)) {
    return null;
  }

  return (
    `/api/admin/routes/${encodeURIComponent(
      routeId,
    )}`
  );
}

export function isDashboardPersistedRoute(
  value: unknown,
): value is DashboardPersistedRoute {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isDashboardRouteId(value.id) &&
    isNonEmptyBoundedString(
      value.serviceName,
      256,
    ) &&
    isGatewayPath(value.gatewayPath) &&
    isOptionalRouteRequestHost(value.requestHost) &&
    isSafeDownstreamUrl(value.downstreamUrl) &&
    isDashboardRouteMethod(value.method) &&
    typeof value.enabled === "boolean" &&
    isSafeIntegerBetween(
      value.priority,
      0,
      1_000_000,
    ) &&
    isDashboardRoutePolicies(value.policies) &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt) &&
    isNullableString(value.createdBy) &&
    isNullableString(value.updatedBy) &&
    isNullableIsoTimestamp(value.deletedAt) &&
    isNullableString(value.deletedBy)
  );
}

export function isDashboardPersistedRouteList(
  value: unknown,
): value is DashboardPersistedRoute[] {
  return isBoundedArray(
    value,
    isDashboardPersistedRoute,
    MAX_DASHBOARD_ROUTES,
  );
}

export function isDashboardRuntimeRoute(
  value: unknown,
): value is DashboardRuntimeRoute {
  return (
    isRecord(value) &&
    isDashboardRouteMethod(value.method) &&
    isGatewayPath(value.gatewayPath) &&
    isOptionalRouteRequestHost(value.requestHost) &&
    isNonEmptyBoundedString(
      value.serviceName,
      256,
    )
  );
}

export function isDashboardRouteRuntimeSnapshot(
  value: unknown,
): value is DashboardRouteRuntimeSnapshot {
  if (
    !isRecord(value) ||
    value.mode !== "runtime-registry" ||
    typeof value.available !== "boolean" ||
    !isSafeIntegerBetween(
      value.routeCount,
      0,
      MAX_DASHBOARD_ROUTES,
    ) ||
    !isBoundedArray(
      value.routes,
      isDashboardRuntimeRoute,
      MAX_DASHBOARD_ROUTES,
    ) ||
    value.routeCount !== value.routes.length
  ) {
    return false;
  }

  if (!value.available) {
    return (
      value.version === null &&
      value.loadedAt === null &&
      value.routeCount === 0
    );
  }

  return (
    isSafeIntegerBetween(
      value.version,
      1,
      Number.MAX_SAFE_INTEGER,
    ) &&
    isIsoTimestamp(value.loadedAt)
  );
}

export async function loadDashboardRoutes(
  fetchImplementation: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<DashboardRoutesLoadResult> {
  return loadDashboardAdminResource(
    "routes",
    isDashboardPersistedRouteList,
    fetchImplementation,
    signal,
  );
}

export async function loadDashboardRoute(
  routeId: string,
  fetchImplementation: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<DashboardRouteLoadResult> {
  const path = getDashboardRoutePath(routeId);

  if (!path) {
    return {
      status: "error",
      error: invalidResponseError(),
    };
  }

  const result = await loadFixedRouteResource(
    path,
    isDashboardPersistedRoute,
    fetchImplementation,
    signal,
  );

  if (
    result.status === "success" &&
    result.data.id !== routeId
  ) {
    return {
      status: "error",
      error: invalidResponseError(),
    };
  }

  return result;
}

export async function loadDashboardRouteRuntime(
  fetchImplementation: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<DashboardRouteRuntimeLoadResult> {
  return loadFixedRouteResource(
    "/api/admin/routes/runtime",
    isDashboardRouteRuntimeSnapshot,
    fetchImplementation,
    signal,
  );
}

export function summarizeDashboardRoutes(
  routes: readonly DashboardPersistedRoute[],
) {
  const enabled = routes.filter(
    (route) => route.enabled,
  ).length;
  const apiKeyProtected = routes.filter(
    (route) =>
      route.policies.auth.requireApiKey,
  ).length;
  const jwtProtected = routes.filter(
    (route) =>
      route.policies.auth.requireJwt,
  ).length;

  return {
    total: routes.length,
    enabled,
    disabled: routes.length - enabled,
    apiKeyProtected,
    jwtProtected,
  };
}

export function countEnabledRoutePolicies(
  route: DashboardPersistedRoute,
): number {
  return [
    route.policies.auth.requireApiKey ||
      route.policies.auth.requireJwt,
    route.policies.timeout.enabled,
    route.policies.cache.enabled,
    route.policies.rateLimit.enabled,
    route.policies.requestTransform.enabled,
    route.policies.responseTransform.enabled,
    route.policies.retry.enabled,
  ].filter(Boolean).length;
}

export function formatDashboardRouteTimestamp(
  timestamp: string,
): string {
  return timestamp
    .replace("T", " ")
    .replace(/Z$/, " UTC");
}

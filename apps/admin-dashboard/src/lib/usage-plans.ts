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

export const MAX_DASHBOARD_USAGE_PLANS = 500;

export type DashboardUsagePlanQuotaWindow =
  | "DAILY"
  | "MONTHLY";

export type DashboardUsagePlan = {
  id: string;
  name: string;
  description: string | null;
  quotaLimit: number;
  quotaWindow: DashboardUsagePlanQuotaWindow;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type DashboardUsagePlansLoadResult =
  DashboardAdminResourceLoadResult<DashboardUsagePlan[]>;

export type DashboardUsagePlanLoadResult =
  DashboardAdminResourceLoadResult<DashboardUsagePlan>;

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

const USAGE_PLAN_ID_PATTERN =
  /^[A-Za-z0-9_-]{1,128}$/;

function invalidResponseError(): DashboardAdminResourceError {
  return {
    code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
    message:
      "The Dashboard received an invalid usage plan response.",
    requestId: null,
  };
}

function isNullableString(
  value: unknown,
): value is string | null {
  return value === null || typeof value === "string";
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

export function isDashboardUsagePlanId(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    USAGE_PLAN_ID_PATTERN.test(value)
  );
}

export function getDashboardUsagePlanPath(
  usagePlanId: string,
): string | null {
  if (!isDashboardUsagePlanId(usagePlanId)) {
    return null;
  }

  return (
    `/api/admin/usage-plans/${encodeURIComponent(
      usagePlanId,
    )}`
  );
}

export function isDashboardUsagePlan(
  value: unknown,
): value is DashboardUsagePlan {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isDashboardUsagePlanId(value.id) &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    isNullableString(value.description) &&
    typeof value.quotaLimit === "number" &&
    Number.isSafeInteger(value.quotaLimit) &&
    value.quotaLimit > 0 &&
    (
      value.quotaWindow === "DAILY" ||
      value.quotaWindow === "MONTHLY"
    ) &&
    typeof value.enabled === "boolean" &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt) &&
    isNullableString(value.createdBy) &&
    isNullableString(value.updatedBy)
  );
}

export function isDashboardUsagePlanList(
  value: unknown,
): value is DashboardUsagePlan[] {
  return isBoundedArray(
    value,
    isDashboardUsagePlan,
    MAX_DASHBOARD_USAGE_PLANS,
  );
}

export async function loadDashboardUsagePlans(
  fetchImplementation: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<DashboardUsagePlansLoadResult> {
  return loadDashboardAdminResource(
    "usagePlans",
    isDashboardUsagePlanList,
    fetchImplementation,
    signal,
  );
}

export async function loadDashboardUsagePlan(
  usagePlanId: string,
  fetchImplementation: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<DashboardUsagePlanLoadResult> {
  const path = getDashboardUsagePlanPath(usagePlanId);

  if (!path) {
    return {
      status: "error",
      error: invalidResponseError(),
    };
  }

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
        !isDashboardUsagePlan(payload.data) ||
        payload.data.id !== usagePlanId
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
          "The Dashboard usage plan endpoint is unavailable.",
        requestId: null,
      },
    };
  }
}

export function summarizeDashboardUsagePlans(
  usagePlans: readonly DashboardUsagePlan[],
) {
  const enabled = usagePlans.filter(
    (usagePlan) => usagePlan.enabled,
  ).length;
  const daily = usagePlans.filter(
    (usagePlan) =>
      usagePlan.quotaWindow === "DAILY",
  ).length;

  return {
    total: usagePlans.length,
    enabled,
    disabled: usagePlans.length - enabled,
    daily,
    monthly: usagePlans.length - daily,
  };
}

export function formatDashboardUsagePlanTimestamp(
  timestamp: string,
): string {
  return timestamp
    .replace("T", " ")
    .replace(/Z$/, " UTC");
}

export function formatDashboardQuotaLimit(
  quotaLimit: number,
): string {
  return new Intl.NumberFormat("en-US").format(
    quotaLimit,
  );
}

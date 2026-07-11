export const DASHBOARD_ADMIN_RESOURCE_PATHS = {
  consumers: "/api/admin/consumers",
  usagePlans: "/api/admin/usage-plans",
  routes: "/api/admin/routes",
} as const;

export type DashboardAdminResource =
  keyof typeof DASHBOARD_ADMIN_RESOURCE_PATHS;

export type DashboardAdminResourceErrorCode =
  | "ADMIN_DASHBOARD_CONFIG_MISSING"
  | "ADMIN_DASHBOARD_CONFIG_INVALID"
  | "ADMIN_DASHBOARD_UNAUTHORIZED"
  | "ADMIN_DASHBOARD_FORBIDDEN"
  | "ADMIN_DASHBOARD_NOT_FOUND"
  | "ADMIN_DASHBOARD_TIMEOUT"
  | "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE"
  | "ADMIN_DASHBOARD_UPSTREAM_ERROR"
  | "ADMIN_DASHBOARD_INVALID_RESPONSE"
  | "ADMIN_DASHBOARD_INVALID_QUERY"
  | "ADMIN_DASHBOARD_UNAVAILABLE";

export type DashboardAdminResourceError = {
  code: DashboardAdminResourceErrorCode;
  message: string;
  requestId: string | null;
};

export type DashboardAdminResourceLoadResult<T> =
  | {
      status: "success";
      data: T;
    }
  | {
      status: "error";
      error: DashboardAdminResourceError;
    };

const SENSITIVE_ADMIN_RESPONSE_FIELDS = new Set([
  "rawKey",
  "keyHash",
  "readOnlyApiKey",
  "adminApiKey",
  "adminReadOnlyApiKey",
]);

const SAFE_REQUEST_ID_PATTERN =
  /^[A-Za-z0-9._:@/-]{1,128}$/;

export function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function isSafeRequestId(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    SAFE_REQUEST_ID_PATTERN.test(value)
  );
}

export function readSafeRequestId(
  value: unknown,
): string | null {
  return isSafeRequestId(value) ? value : null;
}

export function containsSensitiveAdminField(
  value: unknown,
  seen: WeakSet<object> = new WeakSet<object>(),
): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) =>
      containsSensitiveAdminField(item, seen),
    );
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (SENSITIVE_ADMIN_RESPONSE_FIELDS.has(key)) {
      return true;
    }

    if (containsSensitiveAdminField(nestedValue, seen)) {
      return true;
    }
  }

  return false;
}

export function isBoundedArray<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T,
  maximumItems = 500,
): value is T[] {
  return (
    Number.isInteger(maximumItems) &&
    maximumItems > 0 &&
    maximumItems <= 1_000 &&
    Array.isArray(value) &&
    value.length <= maximumItems &&
    value.every(itemGuard)
  );
}

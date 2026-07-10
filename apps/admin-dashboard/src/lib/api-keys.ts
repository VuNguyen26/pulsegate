import {
  containsSensitiveAdminField,
  isBoundedArray,
  isRecord,
  readSafeRequestId,
  type DashboardAdminResourceError,
  type DashboardAdminResourceErrorCode,
  type DashboardAdminResourceLoadResult,
} from "./admin-resource-contract";

export const MAX_DASHBOARD_API_KEYS = 500;

export type DashboardApiKeyStatus =
  | "ACTIVE"
  | "REVOKED";

export type DashboardApiKey = {
  id: string;
  consumerId: string;
  usagePlanId: string | null;
  name: string;
  keyPrefix: string;
  status: DashboardApiKeyStatus;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
};

export type DashboardApiKeysLoadResult =
  DashboardAdminResourceLoadResult<DashboardApiKey[]>;

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

const CONSUMER_ID_PATTERN =
  /^[A-Za-z0-9_-]{1,128}$/;

function invalidResponseError(): DashboardAdminResourceError {
  return {
    code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
    message:
      "The Dashboard received an invalid API key response.",
    requestId: null,
  };
}

function isNullableString(
  value: unknown,
): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNonEmptyString(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    (
      typeof value === "string" &&
      value.trim().length > 0
    )
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

export function isDashboardConsumerId(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    CONSUMER_ID_PATTERN.test(value)
  );
}

export function getDashboardConsumerApiKeysPath(
  consumerId: string,
): string | null {
  if (!isDashboardConsumerId(consumerId)) {
    return null;
  }

  return (
    `/api/admin/consumers/${encodeURIComponent(
      consumerId,
    )}/api-keys`
  );
}

export function isDashboardApiKey(
  value: unknown,
): value is DashboardApiKey {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    isDashboardConsumerId(value.consumerId) &&
    isNullableNonEmptyString(value.usagePlanId) &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.keyPrefix === "string" &&
    value.keyPrefix.trim().length > 0 &&
    (
      value.status === "ACTIVE" ||
      value.status === "REVOKED"
    ) &&
    isNullableIsoTimestamp(value.expiresAt) &&
    isNullableIsoTimestamp(value.lastUsedAt) &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt) &&
    isNullableString(value.createdBy) &&
    isNullableIsoTimestamp(value.revokedAt) &&
    isNullableString(value.revokedBy)
  );
}

export function isDashboardApiKeyList(
  value: unknown,
): value is DashboardApiKey[] {
  return isBoundedArray(
    value,
    isDashboardApiKey,
    MAX_DASHBOARD_API_KEYS,
  );
}

export async function loadDashboardConsumerApiKeys(
  consumerId: string,
  fetchImplementation: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<DashboardApiKeysLoadResult> {
  const path =
    getDashboardConsumerApiKeysPath(consumerId);

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
        !isDashboardApiKeyList(payload.data) ||
        payload.data.some(
          (apiKey) =>
            apiKey.consumerId !== consumerId,
        )
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
          "The Dashboard API key endpoint is unavailable.",
        requestId: null,
      },
    };
  }
}

export function summarizeDashboardApiKeys(
  apiKeys: readonly DashboardApiKey[],
) {
  const active = apiKeys.filter(
    (apiKey) => apiKey.status === "ACTIVE",
  ).length;
  const assigned = apiKeys.filter(
    (apiKey) => apiKey.usagePlanId !== null,
  ).length;

  return {
    total: apiKeys.length,
    active,
    revoked: apiKeys.length - active,
    assigned,
  };
}

export function formatDashboardApiKeyTimestamp(
  timestamp: string,
): string {
  return timestamp
    .replace("T", " ")
    .replace(/Z$/, " UTC");
}

import type {
  DashboardAdminResourceError,
  DashboardAdminResourceErrorCode,
  DashboardAdminResourceLoadResult,
} from "./admin-resource-contract";
import {
  isDashboardRetentionPreview,
  type DashboardRetentionPreview,
} from "./admin-retention-preview";

type FetchImplementation = typeof fetch;

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
    "ADMIN_DASHBOARD_INVALID_QUERY",
    "ADMIN_DASHBOARD_UNAVAILABLE",
  ]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function unavailableError():
  DashboardAdminResourceError {
  return {
    code: "ADMIN_DASHBOARD_UNAVAILABLE",
    message:
      "The Dashboard retention preview is unavailable.",
    requestId: null,
  };
}

function invalidResponseError():
  DashboardAdminResourceError {
  return {
    code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
    message:
      "The Dashboard received an invalid retention preview response.",
    requestId: null,
  };
}

function readErrorPayload(
  value: unknown,
): DashboardAdminResourceError | null {
  if (
    !isRecord(value) ||
    !isRecord(value.error) ||
    typeof value.error.code !== "string" ||
    !SAFE_ERROR_CODES.has(
      value.error.code as
        DashboardAdminResourceErrorCode,
    ) ||
    typeof value.error.message !== "string" ||
    value.error.message.trim().length === 0 ||
    value.error.message.length > 512
  ) {
    return null;
  }

  return {
    code:
      value.error.code as
        DashboardAdminResourceErrorCode,
    message: value.error.message,
    requestId:
      typeof value.error.requestId === "string" &&
      value.error.requestId.length <= 128
        ? value.error.requestId
        : null,
  };
}

export async function loadDashboardRetentionPreview(
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<
  DashboardAdminResourceLoadResult<
    DashboardRetentionPreview
  >
> {
  try {
    const response = await fetchImplementation(
      "/api/admin/analytics/retention-preview",
      {
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
        ...(signal ? { signal } : {}),
      },
    );

    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      return {
        status: "error",
        error:
          readErrorPayload(payload) ??
          unavailableError(),
      };
    }

    if (
      !isRecord(payload) ||
      !("data" in payload) ||
      !isDashboardRetentionPreview(
        payload.data,
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
  } catch {
    return {
      status: "error",
      error: unavailableError(),
    };
  }
}
import {
  DASHBOARD_ADMIN_RESOURCE_PATHS,
  containsSensitiveAdminField,
  isRecord,
  readSafeRequestId,
  type DashboardAdminResource,
  type DashboardAdminResourceError,
  type DashboardAdminResourceErrorCode,
  type DashboardAdminResourceLoadResult,
} from "./admin-resource-contract";

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
  ]);

function isDashboardAdminResource(
  value: string,
): value is DashboardAdminResource {
  return Object.prototype.hasOwnProperty.call(
    DASHBOARD_ADMIN_RESOURCE_PATHS,
    value,
  );
}

function invalidResponseError(): DashboardAdminResourceError {
  return {
    code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
    message:
      "The Dashboard received an invalid admin resource response.",
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

export async function loadDashboardAdminResource<T>(
  resource: DashboardAdminResource,
  validateData: (value: unknown) => value is T,
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<DashboardAdminResourceLoadResult<T>> {
  if (!isDashboardAdminResource(resource)) {
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
      DASHBOARD_ADMIN_RESOURCE_PATHS[resource],
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
          "The Dashboard admin resource endpoint is unavailable.",
        requestId: null,
      },
    };
  }
}

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminReadResource,
  type AdminReadResourceClientResult,
} from "./admin-read-resource";
import {
  containsSensitiveAdminField,
  isRecord,
  readSafeRequestId,
  type DashboardAdminResourceErrorCode,
} from "../lib/admin-resource-contract";
import {
  isDashboardPersistedRoute,
  isDashboardPersistedRouteList,
  isDashboardRouteId,
  isDashboardRouteRuntimeSnapshot,
  type DashboardPersistedRoute,
  type DashboardRouteRuntimeSnapshot,
} from "../lib/routes";

type FetchImplementation = typeof fetch;

type ReadErrorCode = Extract<
  DashboardAdminResourceErrorCode,
  | "ADMIN_DASHBOARD_UNAUTHORIZED"
  | "ADMIN_DASHBOARD_FORBIDDEN"
  | "ADMIN_DASHBOARD_NOT_FOUND"
  | "ADMIN_DASHBOARD_TIMEOUT"
  | "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE"
  | "ADMIN_DASHBOARD_UPSTREAM_ERROR"
  | "ADMIN_DASHBOARD_INVALID_RESPONSE"
>;

function clientError<T>(
  code: ReadErrorCode,
  message: string,
  status: number | null,
  requestId: string | null,
): AdminReadResourceClientResult<T> {
  return {
    ok: false,
    error: {
      code,
      message,
      status,
      requestId,
    },
  };
}

function readRequestId(
  value: unknown,
): string | null {
  if (
    !isRecord(value) ||
    !isRecord(value.error)
  ) {
    return null;
  }

  return readSafeRequestId(value.error.requestId);
}

async function fetchFixedRouteResource<T>(
  config: DashboardAdminApiConfig,
  path: string,
  validateData: (value: unknown) => value is T,
  fetchImplementation: FetchImplementation,
): Promise<AdminReadResourceClientResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.requestTimeoutMs,
  );

  try {
    const response = await fetchImplementation(
      new URL(path, config.gatewayBaseUrl),
      {
        method: "GET",
        headers: {
          accept: "application/json",
          [config.apiKeyHeader]:
            config.readOnlyApiKey,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const requestId = readRequestId(payload);

    if (response.status === 401) {
      return clientError(
        "ADMIN_DASHBOARD_UNAUTHORIZED",
        "The Dashboard Admin API credential was not accepted.",
        401,
        requestId,
      );
    }

    if (response.status === 403) {
      return clientError(
        "ADMIN_DASHBOARD_FORBIDDEN",
        "The Dashboard is not permitted to read route configuration.",
        403,
        requestId,
      );
    }

    if (response.status === 404) {
      return clientError(
        "ADMIN_DASHBOARD_NOT_FOUND",
        "The selected persisted route was not found.",
        404,
        requestId,
      );
    }

    if (!response.ok) {
      return clientError(
        "ADMIN_DASHBOARD_UPSTREAM_ERROR",
        "PulseGate Gateway returned an unexpected route response.",
        response.status,
        requestId,
      );
    }

    if (
      !isRecord(payload) ||
      !("data" in payload) ||
      containsSensitiveAdminField(payload.data) ||
      !validateData(payload.data)
    ) {
      return clientError(
        "ADMIN_DASHBOARD_INVALID_RESPONSE",
        "PulseGate Gateway returned an invalid route response.",
        response.status,
        null,
      );
    }

    return {
      ok: true,
      accessMode: "read-only",
      data: payload.data,
    };
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      error.name === "AbortError";

    return clientError(
      timedOut
        ? "ADMIN_DASHBOARD_TIMEOUT"
        : "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE",
      timedOut
        ? "PulseGate Gateway route request timed out."
        : "PulseGate Gateway is unavailable.",
      null,
      null,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAdminRoutes(
  config: DashboardAdminApiConfig,
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<
    DashboardPersistedRoute[]
  >
> {
  return fetchAdminReadResource(
    config,
    "routes",
    isDashboardPersistedRouteList,
    fetchImplementation,
  );
}

export async function fetchAdminRouteById(
  config: DashboardAdminApiConfig,
  routeId: string,
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<
    DashboardPersistedRoute
  >
> {
  if (!isDashboardRouteId(routeId)) {
    return clientError(
      "ADMIN_DASHBOARD_NOT_FOUND",
      "The selected persisted route was not found.",
      404,
      null,
    );
  }

  const result = await fetchFixedRouteResource(
    config,
    `/internal/admin/routes/${encodeURIComponent(
      routeId,
    )}`,
    isDashboardPersistedRoute,
    fetchImplementation,
  );

  if (
    result.ok &&
    result.data.id !== routeId
  ) {
    return clientError(
      "ADMIN_DASHBOARD_INVALID_RESPONSE",
      "PulseGate Gateway returned a mismatched route response.",
      200,
      null,
    );
  }

  return result;
}

export async function fetchAdminRouteRuntime(
  config: DashboardAdminApiConfig,
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<
    DashboardRouteRuntimeSnapshot
  >
> {
  return fetchFixedRouteResource(
    config,
    "/internal/admin/routes/runtime",
    isDashboardRouteRuntimeSnapshot,
    fetchImplementation,
  );
}

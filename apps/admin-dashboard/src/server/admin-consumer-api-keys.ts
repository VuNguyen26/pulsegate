import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import type {
  AdminReadResourceClientResult,
} from "./admin-read-resource";
import {
  containsSensitiveAdminField,
  isRecord,
  readSafeRequestId,
  type DashboardAdminResourceErrorCode,
} from "../lib/admin-resource-contract";
import {
  isDashboardApiKeyList,
  isDashboardConsumerId,
  type DashboardApiKey,
} from "../lib/api-keys";

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

export async function fetchAdminConsumerApiKeys(
  config: DashboardAdminApiConfig,
  consumerId: string,
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<DashboardApiKey[]>
> {
  if (!isDashboardConsumerId(consumerId)) {
    return clientError(
      "ADMIN_DASHBOARD_NOT_FOUND",
      "The selected API consumer was not found.",
      404,
      null,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.requestTimeoutMs,
  );

  try {
    const path =
      `/internal/admin/consumers/${encodeURIComponent(
        consumerId,
      )}/api-keys`;

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
        "The Dashboard is not permitted to read API keys.",
        403,
        requestId,
      );
    }

    if (response.status === 404) {
      return clientError(
        "ADMIN_DASHBOARD_NOT_FOUND",
        "The selected API consumer was not found.",
        404,
        requestId,
      );
    }

    if (!response.ok) {
      return clientError(
        "ADMIN_DASHBOARD_UPSTREAM_ERROR",
        "PulseGate Gateway returned an unexpected API key response.",
        response.status,
        requestId,
      );
    }

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
      return clientError(
        "ADMIN_DASHBOARD_INVALID_RESPONSE",
        "PulseGate Gateway returned an invalid API key response.",
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
        ? "PulseGate Gateway API key request timed out."
        : "PulseGate Gateway is unavailable.",
      null,
      null,
    );
  } finally {
    clearTimeout(timeout);
  }
}

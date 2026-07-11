import type {
  DashboardAdminApiConfig,
  DashboardAdminApiConfigResult,
} from "./admin-api-config";
import {
  containsSensitiveAdminField,
  isRecord,
  readSafeRequestId,
  type DashboardAdminResourceErrorCode,
} from "../lib/admin-resource-contract";

export const ADMIN_GATEWAY_READ_RESOURCE_PATHS = {
  consumers: "/internal/admin/consumers",
  usagePlans: "/internal/admin/usage-plans",
  routes: "/internal/admin/routes",
} as const;

export type AdminGatewayReadResource =
  keyof typeof ADMIN_GATEWAY_READ_RESOURCE_PATHS;

export type AdminReadResourceClientResult<T> =
  | {
      ok: true;
      accessMode: "read-only";
      data: T;
    }
  | {
      ok: false;
      error: {
        code:
          | "ADMIN_DASHBOARD_UNAUTHORIZED"
          | "ADMIN_DASHBOARD_FORBIDDEN"
          | "ADMIN_DASHBOARD_NOT_FOUND"
          | "ADMIN_DASHBOARD_TIMEOUT"
          | "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE"
          | "ADMIN_DASHBOARD_UPSTREAM_ERROR"
          | "ADMIN_DASHBOARD_INVALID_RESPONSE";
        message: string;
        status: number | null;
        requestId: string | null;
      };
    };

type FetchImplementation = typeof fetch;

function isAdminGatewayReadResource(
  value: string,
): value is AdminGatewayReadResource {
  return Object.prototype.hasOwnProperty.call(
    ADMIN_GATEWAY_READ_RESOURCE_PATHS,
    value,
  );
}

function readRequestId(value: unknown): string | null {
  if (
    !isRecord(value) ||
    !isRecord(value.error)
  ) {
    return null;
  }

  return readSafeRequestId(value.error.requestId);
}

function clientError(
  code: Extract<
    DashboardAdminResourceErrorCode,
    | "ADMIN_DASHBOARD_UNAUTHORIZED"
    | "ADMIN_DASHBOARD_FORBIDDEN"
    | "ADMIN_DASHBOARD_NOT_FOUND"
    | "ADMIN_DASHBOARD_TIMEOUT"
    | "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE"
    | "ADMIN_DASHBOARD_UPSTREAM_ERROR"
    | "ADMIN_DASHBOARD_INVALID_RESPONSE"
  >,
  message: string,
  status: number | null,
  requestId: string | null,
): AdminReadResourceClientResult<never> {
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

function isAllowedAdminReadUrl(
  config: DashboardAdminApiConfig,
  url: URL,
): boolean {
  const baseUrl = new URL(config.gatewayBaseUrl);

  return (
    url.origin === baseUrl.origin &&
    url.username.length === 0 &&
    url.password.length === 0 &&
    url.hash.length === 0 &&
    url.pathname.startsWith("/internal/admin/")
  );
}

export async function fetchAdminReadUrl<T>(
  config: DashboardAdminApiConfig,
  url: URL,
  validateData: (value: unknown) => value is T,
  fetchImplementation: FetchImplementation = fetch,
): Promise<AdminReadResourceClientResult<T>> {
  if (!isAllowedAdminReadUrl(config, url)) {
    return clientError(
      "ADMIN_DASHBOARD_INVALID_RESPONSE",
      "The requested Dashboard URL is not allowlisted.",
      null,
      null,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.requestTimeoutMs,
  );

  try {
    const response = await fetchImplementation(
      url,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          [config.apiKeyHeader]: config.readOnlyApiKey,
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
        "The Dashboard is not permitted to read this resource.",
        403,
        requestId,
      );
    }

    if (response.status === 404) {
      return clientError(
        "ADMIN_DASHBOARD_NOT_FOUND",
        "The requested PulseGate resource was not found.",
        404,
        requestId,
      );
    }

    if (!response.ok) {
      return clientError(
        "ADMIN_DASHBOARD_UPSTREAM_ERROR",
        "PulseGate Gateway returned an unexpected response.",
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
        "PulseGate Gateway returned an invalid response.",
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
        ? "PulseGate Gateway request timed out."
        : "PulseGate Gateway is unavailable.",
      null,
      null,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAdminReadResource<T>(
  config: DashboardAdminApiConfig,
  resource: AdminGatewayReadResource,
  validateData: (value: unknown) => value is T,
  fetchImplementation: FetchImplementation = fetch,
): Promise<AdminReadResourceClientResult<T>> {
  if (!isAdminGatewayReadResource(resource)) {
    return clientError(
      "ADMIN_DASHBOARD_INVALID_RESPONSE",
      "The requested Dashboard resource is not allowlisted.",
      null,
      null,
    );
  }

  return fetchAdminReadUrl(
    config,
    new URL(
      ADMIN_GATEWAY_READ_RESOURCE_PATHS[resource],
      config.gatewayBaseUrl,
    ),
    validateData,
    fetchImplementation,
  );
}
export type AdminReadResourceServerResult<T> =
  | Extract<
      DashboardAdminApiConfigResult,
      { ok: false }
    >
  | AdminReadResourceClientResult<T>;

export function mapAdminReadResourceResponse<T>(
  result: AdminReadResourceServerResult<T>,
) {
  if (result.ok) {
    return {
      status: 200,
      body: {
        data: result.data,
      },
    };
  }

  const status = (() => {
    switch (result.error.code) {
      case "ADMIN_DASHBOARD_UNAUTHORIZED":
        return 401;
      case "ADMIN_DASHBOARD_FORBIDDEN":
        return 403;
      case "ADMIN_DASHBOARD_NOT_FOUND":
        return 404;
      case "ADMIN_DASHBOARD_TIMEOUT":
        return 504;
      case "ADMIN_DASHBOARD_UPSTREAM_ERROR":
      case "ADMIN_DASHBOARD_INVALID_RESPONSE":
        return 502;
      case "ADMIN_DASHBOARD_CONFIG_MISSING":
      case "ADMIN_DASHBOARD_CONFIG_INVALID":
      case "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE":
        return 503;
    }
  })();

  const requestId =
    "requestId" in result.error
      ? result.error.requestId
      : null;

  return {
    status,
    body: {
      error: {
        code: result.error.code,
        message: result.error.message,
        requestId,
      },
    },
  };
}

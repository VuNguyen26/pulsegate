import type {
  RouteRequestHost,
} from "../lib/route-host";
import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";

export const ADMIN_RUNTIME_STATUS_PATH =
  "/internal/admin/routes/runtime";

export type AdminRuntimeStatus = {
  mode: "runtime-registry";
  available: boolean;
  version: number | null;
  loadedAt: string | null;
  routeCount: number;
  routes: Array<{
    method: string;
    gatewayPath: string;
    requestHost?: RouteRequestHost;
    serviceName: string;
  }>;
};

export type AdminApiClientResult =
  | {
      ok: true;
      accessMode: "read-only";
      data: AdminRuntimeStatus;
    }
  | {
      ok: false;
      error: {
        code:
          | "ADMIN_DASHBOARD_UNAUTHORIZED"
          | "ADMIN_DASHBOARD_FORBIDDEN"
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

function readRequestId(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value
  ) {
    const error = value.error;

    if (
      typeof error === "object" &&
      error !== null &&
      "requestId" in error &&
      typeof error.requestId === "string"
    ) {
      return error.requestId;
    }
  }

  return null;
}

function isRuntimeStatus(
  value: unknown,
): value is AdminRuntimeStatus {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate =
    value as Partial<AdminRuntimeStatus>;

  return (
    candidate.mode === "runtime-registry" &&
    typeof candidate.available === "boolean" &&
    (
      candidate.version === null ||
      typeof candidate.version === "number"
    ) &&
    (
      candidate.loadedAt === null ||
      typeof candidate.loadedAt === "string"
    ) &&
    typeof candidate.routeCount === "number" &&
    Array.isArray(candidate.routes)
  );
}

export async function fetchAdminRuntimeStatus(
  config: DashboardAdminApiConfig,
  fetchImplementation: FetchImplementation = fetch,
): Promise<AdminApiClientResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.requestTimeoutMs,
  );

  try {
    const response = await fetchImplementation(
      new URL(
        ADMIN_RUNTIME_STATUS_PATH,
        config.gatewayBaseUrl,
      ),
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
      return {
        ok: false,
        error: {
          code: "ADMIN_DASHBOARD_UNAUTHORIZED",
          message:
            "The Dashboard Admin API credential was not accepted.",
          status: 401,
          requestId,
        },
      };
    }

    if (response.status === 403) {
      return {
        ok: false,
        error: {
          code: "ADMIN_DASHBOARD_FORBIDDEN",
          message:
            "The Dashboard is not permitted to read this resource.",
          status: 403,
          requestId,
        },
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "ADMIN_DASHBOARD_UPSTREAM_ERROR",
          message:
            "PulseGate Gateway returned an unexpected response.",
          status: response.status,
          requestId,
        },
      };
    }

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("data" in payload) ||
      !isRuntimeStatus(payload.data)
    ) {
      return {
        ok: false,
        error: {
          code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
          message:
            "PulseGate Gateway returned an invalid response.",
          status: response.status,
          requestId: null,
        },
      };
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

    return {
      ok: false,
      error: {
        code: timedOut
          ? "ADMIN_DASHBOARD_TIMEOUT"
          : "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE",
        message: timedOut
          ? "PulseGate Gateway request timed out."
          : "PulseGate Gateway is unavailable.",
        status: null,
        requestId: null,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
export const DASHBOARD_RUNTIME_STATUS_PATH =
  "/api/admin/runtime-status";

export type DashboardRuntimeRoute = {
  method: string;
  gatewayPath: string;
  serviceName: string;
};

export type DashboardRuntimeStatusData = {
  accessMode: "read-only";
  runtime: {
    mode: "runtime-registry";
    available: boolean;
    version: number | null;
    loadedAt: string | null;
    routeCount: number;
    routes: DashboardRuntimeRoute[];
  };
};

export type DashboardRuntimeStatusErrorCode =
  | "ADMIN_DASHBOARD_CONFIG_MISSING"
  | "ADMIN_DASHBOARD_CONFIG_INVALID"
  | "ADMIN_DASHBOARD_UNAUTHORIZED"
  | "ADMIN_DASHBOARD_FORBIDDEN"
  | "ADMIN_DASHBOARD_TIMEOUT"
  | "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE"
  | "ADMIN_DASHBOARD_UPSTREAM_ERROR"
  | "ADMIN_DASHBOARD_INVALID_RESPONSE"
  | "ADMIN_DASHBOARD_UNAVAILABLE";

export type DashboardRuntimeStatusState =
  | {
      status: "connected";
      data: DashboardRuntimeStatusData;
    }
  | {
      status: "error";
      error: {
        code: DashboardRuntimeStatusErrorCode;
        message: string;
        requestId: string | null;
      };
    };

type FetchImplementation = typeof fetch;

const SAFE_ERROR_CODES =
  new Set<DashboardRuntimeStatusErrorCode>([
    "ADMIN_DASHBOARD_CONFIG_MISSING",
    "ADMIN_DASHBOARD_CONFIG_INVALID",
    "ADMIN_DASHBOARD_UNAUTHORIZED",
    "ADMIN_DASHBOARD_FORBIDDEN",
    "ADMIN_DASHBOARD_TIMEOUT",
    "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE",
    "ADMIN_DASHBOARD_UPSTREAM_ERROR",
    "ADMIN_DASHBOARD_INVALID_RESPONSE",
  ]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRuntimeRoute(
  value: unknown,
): value is DashboardRuntimeRoute {
  return (
    isRecord(value) &&
    typeof value.method === "string" &&
    typeof value.gatewayPath === "string" &&
    typeof value.serviceName === "string"
  );
}

function isRuntimeStatusData(
  value: unknown,
): value is DashboardRuntimeStatusData {
  if (
    !isRecord(value) ||
    value.accessMode !== "read-only" ||
    !isRecord(value.runtime)
  ) {
    return false;
  }

  const runtime = value.runtime;

  return (
    runtime.mode === "runtime-registry" &&
    typeof runtime.available === "boolean" &&
    (
      runtime.version === null ||
      Number.isInteger(runtime.version)
    ) &&
    (
      runtime.loadedAt === null ||
      typeof runtime.loadedAt === "string"
    ) &&
    Number.isInteger(runtime.routeCount) &&
    Number(runtime.routeCount) >= 0 &&
    Array.isArray(runtime.routes) &&
    runtime.routes.every(isRuntimeRoute) &&
    runtime.routeCount === runtime.routes.length
  );
}

function readSuccessPayload(
  value: unknown,
): DashboardRuntimeStatusData | null {
  if (
    !isRecord(value) ||
    !("data" in value) ||
    !isRuntimeStatusData(value.data)
  ) {
    return null;
  }

  return value.data;
}

function readErrorPayload(
  value: unknown,
): DashboardRuntimeStatusState | null {
  if (
    !isRecord(value) ||
    !isRecord(value.error) ||
    typeof value.error.code !== "string" ||
    !SAFE_ERROR_CODES.has(
      value.error.code as DashboardRuntimeStatusErrorCode,
    ) ||
    typeof value.error.message !== "string" ||
    !(
      value.error.requestId === null ||
      typeof value.error.requestId === "string"
    )
  ) {
    return null;
  }

  return {
    status: "error",
    error: {
      code:
        value.error.code as DashboardRuntimeStatusErrorCode,
      message: value.error.message,
      requestId: value.error.requestId,
    },
  };
}

function invalidResponseState(): DashboardRuntimeStatusState {
  return {
    status: "error",
    error: {
      code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      message:
        "The Dashboard received an invalid runtime status response.",
      requestId: null,
    },
  };
}

export async function loadDashboardRuntimeStatus(
  fetchImplementation: FetchImplementation = fetch,
  signal?: AbortSignal,
): Promise<DashboardRuntimeStatusState> {
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
      DASHBOARD_RUNTIME_STATUS_PATH,
      requestInit,
    );

    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (response.ok) {
      const data = readSuccessPayload(payload);

      if (!data) {
        return invalidResponseState();
      }

      return {
        status: "connected",
        data,
      };
    }

    return (
      readErrorPayload(payload) ??
      invalidResponseState()
    );
  } catch {
    return {
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_UNAVAILABLE",
        message:
          "The Dashboard runtime status endpoint is unavailable.",
        requestId: null,
      },
    };
  }
}

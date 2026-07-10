import type {
  DashboardAdminApiConfigResult,
} from "./admin-api-config";
import type {
  AdminApiClientResult,
} from "./admin-api-client";

export type DashboardRuntimeStatusResult =
  | Extract<
      DashboardAdminApiConfigResult,
      { ok: false }
    >
  | AdminApiClientResult;

export function mapRuntimeStatusResponse(
  result: DashboardRuntimeStatusResult,
) {
  if (result.ok) {
    return {
      status: 200,
      body: {
        data: {
          accessMode: result.accessMode,
          runtime: result.data,
        },
      },
    };
  }

  const status = (() => {
    switch (result.error.code) {
      case "ADMIN_DASHBOARD_UNAUTHORIZED":
        return 401;
      case "ADMIN_DASHBOARD_FORBIDDEN":
        return 403;
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
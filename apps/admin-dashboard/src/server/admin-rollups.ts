import type {
  DashboardRollupQuery,
} from "../lib/admin-rollup-query";
import {
  serializeDashboardRollupQuery,
} from "../lib/admin-rollup-query";
import {
  isDashboardRollupRead,
  type DashboardRollupRead,
} from "../lib/admin-rollups";
import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminReadUrl,
  type AdminReadResourceClientResult,
} from "./admin-read-resource";

type FetchImplementation = typeof fetch;

function invalidRollupQueryResult():
  AdminReadResourceClientResult<never> {
  return {
    ok: false,
    error: {
      code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      message:
        "The Dashboard rollup query is invalid.",
      status: null,
      requestId: null,
    },
  };
}

export async function fetchAdminRollups(
  config: DashboardAdminApiConfig,
  query: DashboardRollupQuery,
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<
    DashboardRollupRead
  >
> {
  const serialized =
    serializeDashboardRollupQuery(query);

  if (!serialized.ok) {
    return invalidRollupQueryResult();
  }

  const url = new URL(
    "/internal/admin/analytics/rollups",
    config.gatewayBaseUrl,
  );

  url.search = serialized.value;

  return fetchAdminReadUrl(
    config,
    url,
    isDashboardRollupRead,
    fetchImplementation,
  );
}
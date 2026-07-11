import {
  isDashboardSchedulerPreview,
  type DashboardSchedulerPreview,
} from "../lib/admin-scheduler-preview";
import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminReadUrl,
  type AdminReadResourceClientResult,
} from "./admin-read-resource";

type FetchImplementation = typeof fetch;

export async function fetchAdminSchedulerPreview(
  config: DashboardAdminApiConfig,
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<
    DashboardSchedulerPreview
  >
> {
  return fetchAdminReadUrl(
    config,
    new URL(
      "/internal/admin/analytics/scheduler-preview",
      config.gatewayBaseUrl,
    ),
    isDashboardSchedulerPreview,
    fetchImplementation,
  );
}
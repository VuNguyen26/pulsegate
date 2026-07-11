import {
  isDashboardRetentionPreview,
  type DashboardRetentionPreview,
} from "../lib/admin-retention-preview";
import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminReadUrl,
  type AdminReadResourceClientResult,
} from "./admin-read-resource";

type FetchImplementation = typeof fetch;

export async function fetchAdminRetentionPreview(
  config: DashboardAdminApiConfig,
  fetchImplementation: FetchImplementation = fetch,
): Promise<
  AdminReadResourceClientResult<
    DashboardRetentionPreview
  >
> {
  return fetchAdminReadUrl(
    config,
    new URL(
      "/internal/admin/analytics/retention-preview",
      config.gatewayBaseUrl,
    ),
    isDashboardRetentionPreview,
    fetchImplementation,
  );
}
import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminReadResource,
  type AdminReadResourceClientResult,
} from "./admin-read-resource";
import {
  isDashboardConsumerList,
  type DashboardConsumer,
} from "../lib/consumers";

export async function fetchAdminConsumers(
  config: DashboardAdminApiConfig,
  fetchImplementation: typeof fetch = fetch,
): Promise<
  AdminReadResourceClientResult<DashboardConsumer[]>
> {
  return fetchAdminReadResource(
    config,
    "consumers",
    isDashboardConsumerList,
    fetchImplementation,
  );
}

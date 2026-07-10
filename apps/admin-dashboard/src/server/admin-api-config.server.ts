import "server-only";

import { readDashboardAdminApiConfig } from "./admin-api-config";

export function getDashboardAdminApiConfig() {
  return readDashboardAdminApiConfig(process.env);
}
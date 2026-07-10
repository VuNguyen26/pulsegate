import {
  loadDashboardAdminResource,
} from "./admin-resource";
import {
  isBoundedArray,
  isRecord,
  type DashboardAdminResourceLoadResult,
} from "./admin-resource-contract";

export const MAX_DASHBOARD_CONSUMERS = 500;

export type DashboardConsumerStatus =
  | "ACTIVE"
  | "DISABLED";

export type DashboardConsumer = {
  id: string;
  name: string;
  description: string | null;
  status: DashboardConsumerStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type DashboardConsumersLoadResult =
  DashboardAdminResourceLoadResult<DashboardConsumer[]>;

function isNullableString(
  value: unknown,
): value is string | null {
  return value === null || typeof value === "string";
}

function isIsoTimestamp(
  value: unknown,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parsedTime = Date.parse(value);

  return (
    !Number.isNaN(parsedTime) &&
    new Date(parsedTime).toISOString() === value
  );
}

export function isDashboardConsumer(
  value: unknown,
): value is DashboardConsumer {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    isNullableString(value.description) &&
    (
      value.status === "ACTIVE" ||
      value.status === "DISABLED"
    ) &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt) &&
    isNullableString(value.createdBy) &&
    isNullableString(value.updatedBy)
  );
}

export function isDashboardConsumerList(
  value: unknown,
): value is DashboardConsumer[] {
  return isBoundedArray(
    value,
    isDashboardConsumer,
    MAX_DASHBOARD_CONSUMERS,
  );
}

export async function loadDashboardConsumers(
  fetchImplementation: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<DashboardConsumersLoadResult> {
  return loadDashboardAdminResource(
    "consumers",
    isDashboardConsumerList,
    fetchImplementation,
    signal,
  );
}

export function summarizeDashboardConsumers(
  consumers: readonly DashboardConsumer[],
) {
  const active = consumers.filter(
    (consumer) => consumer.status === "ACTIVE",
  ).length;

  return {
    total: consumers.length,
    active,
    disabled: consumers.length - active,
  };
}

export function formatDashboardConsumerTimestamp(
  timestamp: string,
): string {
  return timestamp
    .replace("T", " ")
    .replace(/Z$/, " UTC");
}

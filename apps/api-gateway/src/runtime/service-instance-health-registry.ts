import {
  MAX_SERVICE_DISCOVERY_SERVICE_COUNT,
  MAX_SERVICE_INSTANCE_COUNT,
  type ServiceDiscoverySnapshot,
} from "../config/service-discovery.js";

export const SERVICE_INSTANCE_FAILURE_THRESHOLD = 2;
export const SERVICE_INSTANCE_COOLDOWN_MS = 30_000;

export const MAX_SERVICE_INSTANCE_HEALTH_ENTRY_COUNT =
  MAX_SERVICE_DISCOVERY_SERVICE_COUNT *
  MAX_SERVICE_INSTANCE_COUNT;

export type ServiceInstanceHealthState =
  | "healthy"
  | "cooldown"
  | "probe";

export type ServiceInstanceHealthStatus = Readonly<{
  serviceName: string;
  baseUrl: string;
  state: ServiceInstanceHealthState;
  eligible: boolean;
  consecutiveFailures: number;
  cooldownUntil: Date | null;
}>;

export type ServiceInstanceHealthSnapshot = Readonly<{
  entryCount: number;
  entries: readonly ServiceInstanceHealthStatus[];
}>;

export type ServiceInstanceHealthRegistry = {
  getSnapshot: () => ServiceInstanceHealthSnapshot;
  getStatus: (
    serviceName: string,
    baseUrl: string,
  ) => ServiceInstanceHealthStatus | null;
  reconcile: (
    snapshot: ServiceDiscoverySnapshot,
  ) => void;
  recordFailure: (
    serviceName: string,
    baseUrl: string,
  ) => boolean;
  recordSuccess: (
    serviceName: string,
    baseUrl: string,
  ) => boolean;
};

type MutableServiceInstanceHealthEntry = {
  serviceName: string;
  baseUrl: string;
  consecutiveFailures: number;
  cooldownUntilMs: number | null;
};

type CreateServiceInstanceHealthRegistryOptions = {
  initialSnapshot: ServiceDiscoverySnapshot;
  now?: () => Date;
};

function createEntryKey(
  serviceName: string,
  baseUrl: string,
): string {
  return JSON.stringify([
    serviceName,
    baseUrl,
  ]);
}

function readNowMs(now: () => Date): number {
  const value = now().getTime();

  if (!Number.isFinite(value)) {
    throw new Error(
      "Service instance health clock must return a valid date",
    );
  }

  return value;
}

function createEntries(
  snapshot: ServiceDiscoverySnapshot,
  previousEntries?: ReadonlyMap<
    string,
    MutableServiceInstanceHealthEntry
  >,
): Map<string, MutableServiceInstanceHealthEntry> {
  if (
    snapshot.serviceCount !==
    snapshot.services.length
  ) {
    throw new Error(
      "Invalid service instance health snapshot: serviceCount does not match services",
    );
  }

  if (
    snapshot.services.length >
    MAX_SERVICE_DISCOVERY_SERVICE_COUNT
  ) {
    throw new Error(
      `Invalid service instance health snapshot: must contain at most ${MAX_SERVICE_DISCOVERY_SERVICE_COUNT} services`,
    );
  }

  const nextEntries =
    new Map<
      string,
      MutableServiceInstanceHealthEntry
    >();

  for (const service of snapshot.services) {
    if (
      service.instances.length < 1 ||
      service.instances.length >
        MAX_SERVICE_INSTANCE_COUNT
    ) {
      throw new Error(
        `Invalid service instance health snapshot: ${service.serviceName} must contain 1-${MAX_SERVICE_INSTANCE_COUNT} instances`,
      );
    }

    for (const instance of service.instances) {
      const key = createEntryKey(
        service.serviceName,
        instance.baseUrl,
      );

      if (nextEntries.has(key)) {
        throw new Error(
          `Invalid service instance health snapshot: duplicate instance for ${service.serviceName}`,
        );
      }

      if (
        nextEntries.size >=
        MAX_SERVICE_INSTANCE_HEALTH_ENTRY_COUNT
      ) {
        throw new Error(
          `Invalid service instance health snapshot: must contain at most ${MAX_SERVICE_INSTANCE_HEALTH_ENTRY_COUNT} instances`,
        );
      }

      const previous =
        previousEntries?.get(key);

      nextEntries.set(key, {
        serviceName: service.serviceName,
        baseUrl: instance.baseUrl,
        consecutiveFailures:
          previous?.consecutiveFailures ?? 0,
        cooldownUntilMs:
          previous?.cooldownUntilMs ?? null,
      });
    }
  }

  return nextEntries;
}

function resolveState(
  entry: MutableServiceInstanceHealthEntry,
  nowMs: number,
): ServiceInstanceHealthState {
  if (entry.cooldownUntilMs === null) {
    return "healthy";
  }

  if (nowMs < entry.cooldownUntilMs) {
    return "cooldown";
  }

  return "probe";
}

function toStatus(
  entry: MutableServiceInstanceHealthEntry,
  nowMs: number,
): ServiceInstanceHealthStatus {
  const state = resolveState(
    entry,
    nowMs,
  );

  return Object.freeze({
    serviceName: entry.serviceName,
    baseUrl: entry.baseUrl,
    state,
    eligible: state !== "cooldown",
    consecutiveFailures:
      entry.consecutiveFailures,
    cooldownUntil:
      entry.cooldownUntilMs === null
        ? null
        : new Date(
            entry.cooldownUntilMs,
          ),
  });
}

export function createServiceInstanceHealthRegistry(
  options: CreateServiceInstanceHealthRegistryOptions,
): ServiceInstanceHealthRegistry {
  const now =
    options.now ?? (() => new Date());

  let entries = createEntries(
    options.initialSnapshot,
  );

  function findEntry(
    serviceName: string,
    baseUrl: string,
  ): MutableServiceInstanceHealthEntry | null {
    return (
      entries.get(
        createEntryKey(
          serviceName,
          baseUrl,
        ),
      ) ?? null
    );
  }

  return {
    getSnapshot() {
      const nowMs = readNowMs(now);

      const statuses = [
        ...entries.values(),
      ]
        .map((entry) =>
          toStatus(entry, nowMs),
        )
        .sort((left, right) => {
          const serviceComparison =
            left.serviceName.localeCompare(
              right.serviceName,
            );

          return serviceComparison !== 0
            ? serviceComparison
            : left.baseUrl.localeCompare(
                right.baseUrl,
              );
        });

      return Object.freeze({
        entryCount: statuses.length,
        entries: Object.freeze(
          statuses,
        ),
      });
    },

    getStatus(
      serviceName,
      baseUrl,
    ) {
      const entry = findEntry(
        serviceName,
        baseUrl,
      );

      return entry
        ? toStatus(
            entry,
            readNowMs(now),
          )
        : null;
    },

    reconcile(snapshot) {
      const nextEntries =
        createEntries(
          snapshot,
          entries,
        );

      entries = nextEntries;
    },

    recordFailure(
      serviceName,
      baseUrl,
    ) {
      const entry = findEntry(
        serviceName,
        baseUrl,
      );

      if (!entry) {
        return false;
      }

      const nowMs = readNowMs(now);
      const state = resolveState(
        entry,
        nowMs,
      );

      if (state === "cooldown") {
        return true;
      }

      if (state === "probe") {
        entry.consecutiveFailures =
          SERVICE_INSTANCE_FAILURE_THRESHOLD;
        entry.cooldownUntilMs =
          nowMs +
          SERVICE_INSTANCE_COOLDOWN_MS;

        return true;
      }

      entry.consecutiveFailures =
        Math.min(
          SERVICE_INSTANCE_FAILURE_THRESHOLD,
          entry.consecutiveFailures + 1,
        );

      if (
        entry.consecutiveFailures >=
        SERVICE_INSTANCE_FAILURE_THRESHOLD
      ) {
        entry.cooldownUntilMs =
          nowMs +
          SERVICE_INSTANCE_COOLDOWN_MS;
      }

      return true;
    },

    recordSuccess(
      serviceName,
      baseUrl,
    ) {
      const entry = findEntry(
        serviceName,
        baseUrl,
      );

      if (!entry) {
        return false;
      }

      entry.consecutiveFailures = 0;
      entry.cooldownUntilMs = null;

      return true;
    },
  };
}

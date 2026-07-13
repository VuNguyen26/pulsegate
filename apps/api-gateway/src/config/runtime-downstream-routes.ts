import {
  downstreamRouteConfigs,
  type DownstreamRouteConfig,
} from "./downstream-routes.js";
import { loadDatabaseDownstreamRouteConfigs } from "./database-route-config.repository.js";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import {
  buildRuntimeRouteFallbackLogPayload,
} from "../observability/logging.js";

export type RuntimeRouteConfigLogger = {
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
};

export type RuntimeDownstreamRouteConfigLoaderOptions = {
  loadFromDatabase?: () => Promise<DownstreamRouteConfig[]>;
  staticRouteConfigs?: readonly DownstreamRouteConfig[];
  logger?: RuntimeRouteConfigLogger;
};

const defaultLogger: RuntimeRouteConfigLogger = {
  info: (message, context) => {
    console.info(message, context ?? {});
  },
  warn: (message, context) => {
    console.warn(message, context ?? {});
  },
};

export async function loadRuntimeDownstreamRouteConfigs(
  options: RuntimeDownstreamRouteConfigLoaderOptions = {},
): Promise<readonly DownstreamRouteConfig[]> {
  const logger = options.logger ?? defaultLogger;
  const staticRouteConfigs = options.staticRouteConfigs ?? downstreamRouteConfigs;
  const loadFromDatabase =
    options.loadFromDatabase ??
    (() => loadDatabaseDownstreamRouteConfigs(gatewayPrisma));

  try {
    const databaseRouteConfigs = await loadFromDatabase();

    if (databaseRouteConfigs.length === 0) {
      logger.warn(
        "No database downstream route configs found; falling back to static downstream route configs",
        {
          fallbackRouteCount: staticRouteConfigs.length,
        },
      );

      return staticRouteConfigs;
    }

    logger.info("Loaded downstream route configs from database", {
      routeCount: databaseRouteConfigs.length,
    });

    return databaseRouteConfigs;
  } catch {
    logger.warn(
      "Failed to load database downstream route configs; falling back to static downstream route configs",
      buildRuntimeRouteFallbackLogPayload(
        staticRouteConfigs.length,
      ),
    );

    return staticRouteConfigs;
  }
}
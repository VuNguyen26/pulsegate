import {
  downstreamRouteConfigs,
  type DownstreamRouteConfig,
} from "./downstream-routes.js";
import { loadDatabaseDownstreamRouteConfigs } from "./database-route-config.repository.js";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import {
  buildRuntimeRouteEmptyFallbackLogPayload,
  buildRuntimeRouteFallbackLogPayload,
  buildRuntimeRoutesLoadedLogPayload,
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

function writeBootstrapRuntimeRouteLog(
  level: 30 | 40,
  message: string,
  context?: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    ...(context ?? {}),
    level,
    time: Date.now(),
    msg: message,
  });

  if (level === 30) {
    console.info(line);
    return;
  }

  console.warn(line);
}

const defaultLogger: RuntimeRouteConfigLogger = {
  info: (message, context) => {
    writeBootstrapRuntimeRouteLog(
      30,
      message,
      context,
    );
  },
  warn: (message, context) => {
    writeBootstrapRuntimeRouteLog(
      40,
      message,
      context,
    );
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
        buildRuntimeRouteEmptyFallbackLogPayload(
          staticRouteConfigs.length,
        ),
      );

      return staticRouteConfigs;
    }

    logger.info(
      "Loaded downstream route configs from database",
      buildRuntimeRoutesLoadedLogPayload(
        databaseRouteConfigs.length,
      ),
    );

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
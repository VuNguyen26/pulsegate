import { describe, expect, it, vi } from "vitest";
import type { DownstreamRouteConfig } from "./downstream-routes.js";
import { loadRuntimeDownstreamRouteConfigs } from "./runtime-downstream-routes.js";

function createRouteConfig(
  gatewayPath: string,
  downstreamUrl: string,
): DownstreamRouteConfig {
  return {
    serviceName: "product-service",
    gatewayPath,
    downstreamUrl,
    method: "GET",
    policies: {
      auth: {
        requireApiKey: false,
        requireJwt: false,
      },
      timeout: {
        enabled: true,
        timeoutMs: 3000,
      },
      cache: {
        enabled: false,
        ttlSeconds: 0,
      },
      rateLimit: {
        enabled: false,
        limit: 0,
        windowMs: 0,
      },
      requestTransform: {
        enabled: false,
      },
      responseTransform: {
        enabled: false,
      },
      retry: {
        enabled: false,
        attempts: 0,
        retryOnStatuses: [502, 503, 504],
      },
    },
  };
}

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
  };
}

describe("runtime downstream route config loader", () => {
  it("should use database route configs when database loading succeeds", async () => {
    const logger = createLogger();

    const databaseRouteConfigs = [
      createRouteConfig("/api/db-route", "http://service:3001/db-route"),
    ];

    const staticRouteConfigs = [
      createRouteConfig("/api/static-route", "http://service:3001/static-route"),
    ];

    const routes = await loadRuntimeDownstreamRouteConfigs({
      loadFromDatabase: async () => databaseRouteConfigs,
      staticRouteConfigs,
      logger,
    });

    expect(routes).toBe(databaseRouteConfigs);
    expect(logger.info).toHaveBeenCalledWith(
      "Loaded downstream route configs from database",
      {
        routeCount: 1,
      },
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("should fallback to static route configs when database returns no routes", async () => {
    const logger = createLogger();

    const staticRouteConfigs = [
      createRouteConfig("/api/static-route", "http://service:3001/static-route"),
    ];

    const routes = await loadRuntimeDownstreamRouteConfigs({
      loadFromDatabase: async () => [],
      staticRouteConfigs,
      logger,
    });

    expect(routes).toBe(staticRouteConfigs);
    expect(logger.warn).toHaveBeenCalledWith(
      "No database downstream route configs found; falling back to static downstream route configs",
      {
        fallbackRouteCount: 1,
      },
    );
  });

  it("should fallback to static route configs when database loading fails", async () => {
    const logger = createLogger();
    const databaseError = new Error("database unavailable");

    const staticRouteConfigs = [
      createRouteConfig("/api/static-route", "http://service:3001/static-route"),
    ];

    const routes = await loadRuntimeDownstreamRouteConfigs({
      loadFromDatabase: async () => {
        throw databaseError;
      },
      staticRouteConfigs,
      logger,
    });

    expect(routes).toBe(staticRouteConfigs);
    expect(logger.warn).toHaveBeenCalledWith(
      "Failed to load database downstream route configs; falling back to static downstream route configs",
      {
        event: "runtime_routes_database_fallback",
        errorCode: "DATABASE_ROUTE_LOAD_FAILED",
        fallbackRouteCount: 1,
      },
    );
  });
});
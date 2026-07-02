import { describe, expect, it } from "vitest";
import {
  productProductsRouteConfig,
  productServiceHealthRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
import { createRouteRuntimeRegistry } from "./route-runtime-registry.js";

describe("route runtime registry", () => {
  it("should initialize with an empty snapshot", () => {
    const registry = createRouteRuntimeRegistry({
      now: () => new Date("2026-07-02T00:00:00.000Z"),
    });

    const snapshot = registry.getSnapshot();

    expect(snapshot.version).toBe(1);
    expect(snapshot.loadedAt.toISOString()).toBe("2026-07-02T00:00:00.000Z");
    expect(snapshot.routeCount).toBe(0);
    expect(snapshot.routes).toEqual([]);
  });

  it("should initialize with initial routes", () => {
    const registry = createRouteRuntimeRegistry({
      initialRoutes: [productProductsRouteConfig, productServiceHealthRouteConfig],
      now: () => new Date("2026-07-02T00:00:00.000Z"),
    });

    const snapshot = registry.getSnapshot();

    expect(snapshot.version).toBe(1);
    expect(snapshot.routeCount).toBe(2);
    expect(snapshot.routes.map((route) => route.gatewayPath)).toEqual([
      "/api/products",
      "/api/product-service/health",
    ]);
  });

  it("should replace routes and increase snapshot version", () => {
    const timestamps = [
      new Date("2026-07-02T00:00:00.000Z"),
      new Date("2026-07-02T01:00:00.000Z"),
    ];

    const registry = createRouteRuntimeRegistry({
      initialRoutes: [productProductsRouteConfig],
      now: () => timestamps.shift() ?? new Date("2026-07-02T02:00:00.000Z"),
    });

    const result = registry.replaceRoutes([
      productProductsRouteConfig,
      productServiceHealthRouteConfig,
    ]);

    expect(result).toMatchObject({
      previousVersion: 1,
      currentVersion: 2,
      routeCount: 2,
    });
    expect(result.loadedAt.toISOString()).toBe("2026-07-02T01:00:00.000Z");

    const snapshot = registry.getSnapshot();

    expect(snapshot.version).toBe(2);
    expect(snapshot.routeCount).toBe(2);
    expect(snapshot.loadedAt.toISOString()).toBe("2026-07-02T01:00:00.000Z");
  });

  it("should find a route by method and gateway path", () => {
    const registry = createRouteRuntimeRegistry({
      initialRoutes: [productProductsRouteConfig, productServiceHealthRouteConfig],
    });

    const route = registry.findRoute("GET", "/api/products");

    expect(route).toMatchObject({
      method: "GET",
      gatewayPath: "/api/products",
      serviceName: "product-service",
    });
  });

  it("should return null when route does not exist", () => {
    const registry = createRouteRuntimeRegistry({
      initialRoutes: [productProductsRouteConfig],
    });

    const route = registry.findRoute("GET", "/api/unknown");

    expect(route).toBeNull();
  });

  it("should not allow external mutation to change the current snapshot", () => {
    const registry = createRouteRuntimeRegistry({
      initialRoutes: [productProductsRouteConfig],
    });

    const snapshot = registry.getSnapshot();

    const mutableRoute = snapshot.routes[0] as DownstreamRouteConfig;
    mutableRoute.gatewayPath = "/mutated-path";
    mutableRoute.policies.auth.requireApiKey = false;

    const nextSnapshot = registry.getSnapshot();

    expect(nextSnapshot.routes[0].gatewayPath).toBe("/api/products");
    expect(nextSnapshot.routes[0].policies.auth.requireApiKey).toBe(true);
  });

  it("should not allow external mutation to change a found route", () => {
    const registry = createRouteRuntimeRegistry({
      initialRoutes: [productProductsRouteConfig],
    });

    const route = registry.findRoute("GET", "/api/products");

    expect(route).not.toBeNull();

    const mutableRoute = route as DownstreamRouteConfig;
    mutableRoute.gatewayPath = "/mutated-path";
    mutableRoute.policies.auth.requireApiKey = false;

    const foundAgain = registry.findRoute("GET", "/api/products");

    expect(foundAgain?.gatewayPath).toBe("/api/products");
    expect(foundAgain?.policies.auth.requireApiKey).toBe(true);
  });

  it("should reject invalid replacement routes and keep the previous snapshot", () => {
    const registry = createRouteRuntimeRegistry({
      initialRoutes: [productProductsRouteConfig],
    });

    const invalidRoute: DownstreamRouteConfig = {
      ...productServiceHealthRouteConfig,
      gatewayPath: "invalid-path",
    };

    expect(() => registry.replaceRoutes([invalidRoute])).toThrow(
      "Invalid downstream route configuration",
    );

    const snapshot = registry.getSnapshot();

    expect(snapshot.version).toBe(1);
    expect(snapshot.routeCount).toBe(1);
    expect(snapshot.routes[0].gatewayPath).toBe("/api/products");
  });

  it("should reject duplicate replacement routes and keep the previous snapshot", () => {
    const registry = createRouteRuntimeRegistry({
      initialRoutes: [productProductsRouteConfig],
    });

    expect(() =>
      registry.replaceRoutes([productProductsRouteConfig, productProductsRouteConfig]),
    ).toThrow("Duplicate downstream route config: GET:/api/products");

    const snapshot = registry.getSnapshot();

    expect(snapshot.version).toBe(1);
    expect(snapshot.routeCount).toBe(1);
    expect(snapshot.routes[0].gatewayPath).toBe("/api/products");
  });
});
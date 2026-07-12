import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
import {
  createRouteRuntimeRegistry,
} from "../runtime/route-runtime-registry.js";
import {
  resolveDownstreamTargetUrl,
} from "./downstream-target-resolver.js";

function createRoute(
  overrides: Partial<DownstreamRouteConfig> = {},
): DownstreamRouteConfig {
  const route =
    structuredClone(
      productProductsRouteConfig,
    );

  return {
    ...route,
    downstreamUrl:
      "http://product-a:3001/products?version=1",
    policies: {
      ...route.policies,
      auth: {
        requireApiKey: false,
        requireJwt: false,
      },
    },
    ...overrides,
  };
}

describe("downstream target resolver", () => {
  it("preserves legacy direct routing", () => {
    const route = createRoute();

    expect(
      resolveDownstreamTargetUrl({
        routeConfig: route,
      }),
    ).toBe(
      "http://product-a:3001/products?version=1",
    );
  });

  it("preserves legacy weighted routing", () => {
    const weightedRandomSource =
      vi.fn(() => 0.75);

    const route = createRoute({
      weightedUpstreams: [
        {
          downstreamUrl:
            "http://product-a:3001/products?version=1",
          weight: 50,
        },
        {
          downstreamUrl:
            "http://product-b:3001/products?version=1",
          weight: 50,
        },
      ],
    });

    expect(
      resolveDownstreamTargetUrl({
        routeConfig: route,
        weightedRandomSource,
      }),
    ).toBe(
      "http://product-b:3001/products?version=1",
    );

    expect(
      weightedRandomSource,
    ).toHaveBeenCalledTimes(1);
  });

  it("resolves one configured instance for a direct discovery route", () => {
    const route = createRoute({
      serviceInstances: [
        {
          baseUrl:
            "http://product-a:3001",
        },
        {
          baseUrl:
            "http://product-b:3001",
        },
      ],
    });

    const registry =
      createRouteRuntimeRegistry({
        initialRoutes: [route],
      });

    const serviceDiscoveryRandomSource =
      vi.fn(() => 0.999);

    expect(
      resolveDownstreamTargetUrl({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        serviceDiscoveryRandomSource,
      }),
    ).toBe(
      "http://product-b:3001/products?version=1",
    );

    expect(
      serviceDiscoveryRandomSource,
    ).toHaveBeenCalledTimes(1);
  });

  it("returns null when a discovery route has no runtime registry", () => {
    const route = createRoute({
      serviceInstances: [
        {
          baseUrl:
            "http://product-a:3001",
        },
      ],
    });

    expect(
      resolveDownstreamTargetUrl({
        routeConfig: route,
      }),
    ).toBeNull();
  });

  it("returns null when the service is absent from the runtime snapshot", () => {
    const route = createRoute({
      serviceInstances: [
        {
          baseUrl:
            "http://product-a:3001",
        },
      ],
    });

    const registry =
      createRouteRuntimeRegistry();

    const serviceDiscoveryRandomSource =
      vi.fn(() => 0);

    expect(
      resolveDownstreamTargetUrl({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        serviceDiscoveryRandomSource,
      }),
    ).toBeNull();

    expect(
      serviceDiscoveryRandomSource,
    ).not.toHaveBeenCalled();
  });

  it("keeps weighted discovery on the existing weighted selector", () => {
    const route = createRoute({
      serviceInstances: [
        {
          baseUrl:
            "http://product-a:3001",
        },
        {
          baseUrl:
            "http://product-b:3001",
        },
      ],
      weightedUpstreams: [
        {
          downstreamUrl:
            "http://product-a:3001/products?version=1",
          weight: 25,
        },
        {
          downstreamUrl:
            "http://product-b:3001/products?version=1",
          weight: 75,
        },
      ],
    });

    const registry =
      createRouteRuntimeRegistry({
        initialRoutes: [route],
      });

    const weightedRandomSource =
      vi.fn(() => 0.5);

    const serviceDiscoveryRandomSource =
      vi.fn(() => 0);

    expect(
      resolveDownstreamTargetUrl({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        weightedRandomSource,
        serviceDiscoveryRandomSource,
      }),
    ).toBe(
      "http://product-b:3001/products?version=1",
    );

    expect(
      weightedRandomSource,
    ).toHaveBeenCalledTimes(1);

    expect(
      serviceDiscoveryRandomSource,
    ).not.toHaveBeenCalled();
  });
});
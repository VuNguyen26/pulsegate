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
  resolveDownstreamTarget,
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

  it("returns discovery target metadata for health observation", () => {
    const route = createRoute({
      serviceInstances: [
        {
          baseUrl:
            "http://product-a:3001",
        },
      ],
    });

    const registry =
      createRouteRuntimeRegistry({
        initialRoutes: [route],
      });

    expect(
      resolveDownstreamTarget({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        serviceDiscoveryRandomSource:
          () => 0,
      }),
    ).toEqual({
      downstreamUrl:
        "http://product-a:3001/products?version=1",
      serviceInstanceBaseUrl:
        "http://product-a:3001",
    });

    expect(
      resolveDownstreamTarget({
        routeConfig: createRoute(),
      }),
    ).toEqual({
      downstreamUrl:
        "http://product-a:3001/products?version=1",
      serviceInstanceBaseUrl: null,
    });
  });

  it("filters a direct discovery instance in cooldown", () => {
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

    registry.recordServiceInstanceFailure(
      "product-service",
      "http://product-a:3001",
    );

    registry.recordServiceInstanceFailure(
      "product-service",
      "http://product-a:3001",
    );

    const randomSource =
      vi.fn(() => 0);

    expect(
      resolveDownstreamTargetUrl({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        serviceDiscoveryRandomSource:
          randomSource,
      }),
    ).toBe(
      "http://product-b:3001/products?version=1",
    );

    expect(randomSource).toHaveBeenCalledTimes(1);
  });

  it("excludes previously attempted direct discovery targets", () => {
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

    expect(
      resolveDownstreamTarget({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        serviceDiscoveryRandomSource:
          () => 0,
        excludedServiceInstanceBaseUrls: [
          "http://product-a:3001",
        ],
      }),
    ).toEqual({
      downstreamUrl:
        "http://product-b:3001/products?version=1",
      serviceInstanceBaseUrl:
        "http://product-b:3001",
    });
  });

  it("returns null without calling random selection when no direct instance is eligible", () => {
    const route = createRoute({
      serviceInstances: [
        {
          baseUrl:
            "http://product-a:3001",
        },
      ],
    });

    const registry =
      createRouteRuntimeRegistry({
        initialRoutes: [route],
      });

    const randomSource =
      vi.fn(() => 0);

    expect(
      resolveDownstreamTargetUrl({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        serviceDiscoveryRandomSource:
          randomSource,
        excludedServiceInstanceBaseUrls: [
          "http://product-a:3001",
        ],
      }),
    ).toBeNull();

    expect(randomSource).not.toHaveBeenCalled();
  });

  it("filters weighted discovery and recalculates remaining weights", () => {
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
          weight: 99,
        },
        {
          downstreamUrl:
            "http://product-b:3001/products?version=1",
          weight: 1,
        },
      ],
    });

    const registry =
      createRouteRuntimeRegistry({
        initialRoutes: [route],
      });

    registry.recordServiceInstanceFailure(
      "product-service",
      "http://product-a:3001",
    );

    registry.recordServiceInstanceFailure(
      "product-service",
      "http://product-a:3001",
    );

    const weightedRandomSource =
      vi.fn(() => 0);

    expect(
      resolveDownstreamTarget({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        weightedRandomSource,
      }),
    ).toEqual({
      downstreamUrl:
        "http://product-b:3001/products?version=1",
      serviceInstanceBaseUrl:
        "http://product-b:3001",
    });

    expect(
      weightedRandomSource,
    ).toHaveBeenCalledTimes(1);
  });

  it("returns null when no weighted discovery target remains eligible", () => {
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
      vi.fn(() => 0);

    expect(
      resolveDownstreamTargetUrl({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        weightedRandomSource,
        excludedServiceInstanceBaseUrls: [
          "http://product-a:3001",
          "http://product-b:3001",
        ],
      }),
    ).toBeNull();

    expect(
      weightedRandomSource,
    ).not.toHaveBeenCalled();
  });

  it("rejects an exclusion list beyond the configured instance bound", () => {
    const route = createRoute({
      serviceInstances: [
        {
          baseUrl:
            "http://product-a:3001",
        },
      ],
    });

    const registry =
      createRouteRuntimeRegistry({
        initialRoutes: [route],
      });

    expect(() =>
      resolveDownstreamTargetUrl({
        routeConfig: route,
        routeRuntimeRegistry: registry,
        excludedServiceInstanceBaseUrls:
          Array.from(
            { length: 9 },
            (_, index) =>
              `http://excluded-${index}:3001`,
          ),
      }),
    ).toThrow(
      /at most 8 entries/,
    );
  });});
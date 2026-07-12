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
} from "./route-runtime-registry.js";

function createDiscoveryRoute(
  options: {
    gatewayPath?: string;
    downstreamUrl?: string;
    instanceBaseUrls?: string[];
  } = {},
): DownstreamRouteConfig {
  const route =
    structuredClone(
      productProductsRouteConfig,
    );

  return {
    ...route,
    gatewayPath:
      options.gatewayPath ??
      "/api/products",
    downstreamUrl:
      options.downstreamUrl ??
      "http://product-a:3001/products",
    serviceInstances:
      (
        options.instanceBaseUrls ?? [
          "http://product-a:3001",
          "http://product-b:3001",
        ]
      ).map((baseUrl) => ({
        baseUrl,
      })),
    policies: {
      ...route.policies,
      auth: {
        requireApiKey: false,
        requireJwt: false,
      },
    },
  };
}

describe(
  "route runtime registry service discovery",
  () => {
    it(
      "builds discovery with the route snapshot",
      () => {
        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              createDiscoveryRoute(),
            ],
          });

        const snapshot =
          registry.getSnapshot();

        expect(
          snapshot.serviceDiscovery,
        ).toEqual({
          serviceCount: 1,
          services: [
            {
              serviceName:
                "product-service",
              instances: [
                {
                  baseUrl:
                    "http://product-a:3001",
                },
                {
                  baseUrl:
                    "http://product-b:3001",
                },
              ],
            },
          ],
        });
      },
    );

    it(
      "resolves deterministic configured instances",
      () => {
        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              createDiscoveryRoute(),
            ],
          });

        const firstRandomSource =
          vi.fn(() => 0);

        const lastRandomSource =
          vi.fn(() => 0.999);

        expect(
          registry
            .resolveServiceInstanceBaseUrl(
              "product-service",
              firstRandomSource,
            ),
        ).toBe(
          "http://product-a:3001",
        );

        expect(
          registry
            .resolveServiceInstanceBaseUrl(
              "product-service",
              lastRandomSource,
            ),
        ).toBe(
          "http://product-b:3001",
        );

        expect(
          firstRandomSource,
        ).toHaveBeenCalledTimes(1);

        expect(
          lastRandomSource,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "returns null without randomness for an unknown service",
      () => {
        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              createDiscoveryRoute(),
            ],
          });

        const randomSource =
          vi.fn(() => 0);

        expect(
          registry
            .resolveServiceInstanceBaseUrl(
              "unknown-service",
              randomSource,
            ),
        ).toBeNull();

        expect(
          randomSource,
        ).not.toHaveBeenCalled();
      },
    );

    it.each([
      Number.NaN,
      Number.POSITIVE_INFINITY,
      -0.01,
      1,
    ])(
      "rejects invalid random value %s",
      (value) => {
        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              createDiscoveryRoute(),
            ],
          });

        expect(() =>
          registry
            .resolveServiceInstanceBaseUrl(
              "product-service",
              () => value,
            ),
        ).toThrow(
          /Service discovery random source/,
        );
      },
    );

    it(
      "does not expose mutable discovery state",
      () => {
        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              createDiscoveryRoute(),
            ],
          });

        const snapshot =
          registry.getSnapshot();

        const instance =
          snapshot
            .serviceDiscovery
            .services[0]
            ?.instances[0] as
            | { baseUrl: string }
            | undefined;

        expect(instance).toBeDefined();

        if (instance) {
          instance.baseUrl =
            "http://mutated.example";
        }

        expect(
          registry
            .resolveServiceInstanceBaseUrl(
              "product-service",
              () => 0,
            ),
        ).toBe(
          "http://product-a:3001",
        );
      },
    );

    it(
      "preserves the previous snapshot after a conflicting replacement",
      () => {
        const initialRoute =
          createDiscoveryRoute();

        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              initialRoute,
            ],
          });

        const conflictingRoute =
          createDiscoveryRoute({
            gatewayPath:
              "/api/product-service/health",
            downstreamUrl:
              "http://product-a:3001/health",
            instanceBaseUrls: [
              "http://product-a:3001",
              "http://product-c:3001",
            ],
          });

        expect(() =>
          registry.replaceRoutes([
            initialRoute,
            conflictingRoute,
          ]),
        ).toThrow(
          /conflicting serviceInstances across routes/,
        );

        const snapshot =
          registry.getSnapshot();

        expect(snapshot.version).toBe(1);
        expect(snapshot.routeCount).toBe(1);

        expect(
          snapshot
            .serviceDiscovery
            .services[0]
            ?.instances,
        ).toEqual([
          {
            baseUrl:
              "http://product-a:3001",
          },
          {
            baseUrl:
              "http://product-b:3001",
          },
        ]);
      },
    );
  },
);
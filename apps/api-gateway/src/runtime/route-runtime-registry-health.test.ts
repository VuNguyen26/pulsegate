import {
  describe,
  expect,
  it,
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
  };
}

describe(
  "route runtime registry instance health",
  () => {
    it(
      "owns health state for the configured discovery snapshot",
      () => {
        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              createDiscoveryRoute(),
            ],
          });

        expect(
          registry
            .getServiceInstanceHealthSnapshot(),
        ).toMatchObject({
          entryCount: 2,
          entries: [
            {
              serviceName:
                "product-service",
              baseUrl:
                "http://product-a:3001",
              state: "healthy",
              eligible: true,
            },
            {
              serviceName:
                "product-service",
              baseUrl:
                "http://product-b:3001",
              state: "healthy",
              eligible: true,
            },
          ],
        });
      },
    );

    it(
      "preserves retained health and prunes removed instances on route replacement",
      () => {
        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              createDiscoveryRoute(),
            ],
          });

        registry.recordServiceInstanceFailure(
          "product-service",
          "http://product-a:3001",
        );

        registry.replaceRoutes([
          createDiscoveryRoute({
            instanceBaseUrls: [
              "http://product-a:3001",
              "http://product-c:3001",
            ],
          }),
        ]);

        expect(
          registry.getServiceInstanceHealthStatus(
            "product-service",
            "http://product-a:3001",
          ),
        ).toMatchObject({
          consecutiveFailures: 1,
          state: "healthy",
        });

        expect(
          registry.getServiceInstanceHealthStatus(
            "product-service",
            "http://product-b:3001",
          ),
        ).toBeNull();

        expect(
          registry.getServiceInstanceHealthStatus(
            "product-service",
            "http://product-c:3001",
          ),
        ).toMatchObject({
          consecutiveFailures: 0,
          state: "healthy",
          eligible: true,
        });
      },
    );

    it(
      "keeps route and health state after an invalid replacement",
      () => {
        const initialRoute =
          createDiscoveryRoute();

        const registry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              initialRoute,
            ],
          });

        registry.recordServiceInstanceFailure(
          "product-service",
          "http://product-a:3001",
        );

        const routeBefore =
          registry.getSnapshot();

        const healthBefore =
          registry
            .getServiceInstanceHealthSnapshot();

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

        expect(
          registry.getSnapshot(),
        ).toEqual(routeBefore);

        expect(
          registry
            .getServiceInstanceHealthSnapshot(),
        ).toEqual(healthBefore);
      },
    );

    it(
      "starts with fresh health state in a new registry instance",
      () => {
        const route =
          createDiscoveryRoute();

        const firstRegistry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              route,
            ],
          });

        firstRegistry.recordServiceInstanceFailure(
          "product-service",
          "http://product-a:3001",
        );

        const restartedRegistry =
          createRouteRuntimeRegistry({
            initialRoutes: [
              route,
            ],
          });

        expect(
          restartedRegistry.getServiceInstanceHealthStatus(
            "product-service",
            "http://product-a:3001",
          ),
        ).toMatchObject({
          state: "healthy",
          eligible: true,
          consecutiveFailures: 0,
          cooldownUntil: null,
        });
      },
    );
  },
);

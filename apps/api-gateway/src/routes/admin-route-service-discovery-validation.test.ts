import Fastify, {
  type FastifyInstance,
} from "fastify";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  RouteConfigCreateData,
  RouteConfigReadModel,
  RouteConfigUpdateData,
  RouteManagementRepository,
} from "../route-management/route-management.types.js";
import {
  adminRouteConfigRoute,
} from "./admin-route-config.route.js";

const createdAt =
  new Date("2026-07-12T00:00:00.000Z");

const updatedAt =
  new Date("2026-07-12T01:00:00.000Z");

const serviceInstances = [
  {
    baseUrl:
      "http://product-service-a:3001",
  },
  {
    baseUrl:
      "http://product-service-b:3001",
  },
];

function createReadModel(
  options: {
    id: string;
    gatewayPath: string;
    downstreamUrl: string;
  },
): RouteConfigReadModel {
  return {
    id: options.id,
    serviceName: "product-service",
    gatewayPath:
      options.gatewayPath,
    requestHost: null,
    downstreamUrl:
      options.downstreamUrl,
    weightedUpstreams: null,
    serviceInstances:
      serviceInstances.map(
        (instance) => ({
          ...instance,
        }),
      ),
    method: "GET",
    enabled: true,
    priority: 100,
    requireApiKey: false,
    requireJwt: false,
    timeoutEnabled: true,
    timeoutMs: 3000,
    cacheEnabled: false,
    cacheTtlSeconds: 30,
    rateLimitEnabled: false,
    rateLimitLimit: 100,
    rateLimitWindowMs: 60_000,
    requestTransformEnabled: false,
    requestAddHeaders: null,
    requestRemoveHeaders: null,
    responseTransformEnabled: false,
    responseAddHeaders: null,
    responseRemoveHeaders: null,
    retryEnabled: false,
    retryAttempts: 0,
    retryOnStatuses: [
      502,
      503,
      504,
    ],
    createdAt,
    updatedAt,
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
  };
}

function createRepository(
  routes: RouteConfigReadModel[],
): {
  repository: RouteManagementRepository;
  createRoute: ReturnType<typeof vi.fn>;
  updateRoute: ReturnType<typeof vi.fn>;
} {
  const createRoute = vi.fn(
    async (
      data: RouteConfigCreateData,
    ): Promise<RouteConfigReadModel> => ({
      ...routes[0],
      ...data,
      id: "route-created",
      createdAt,
      updatedAt,
    }),
  );

  const updateRoute = vi.fn(
    async (
      id: string,
      data: RouteConfigUpdateData,
    ): Promise<RouteConfigReadModel> => ({
      ...routes[0],
      ...data,
      id,
      createdAt,
      updatedAt,
    }),
  );

  const repository:
    RouteManagementRepository = {
    listRoutes: vi.fn(
      async () => routes,
    ),

    findRouteById: vi.fn(
      async (id: string) =>
        routes.find(
          (route) =>
            route.id === id,
        ) ?? null,
    ),

    findRouteByMethodAndGatewayPath:
      vi.fn(
        async (
          method,
          gatewayPath,
          requestHost,
        ) =>
          routes.find(
            (route) =>
              route.method === method &&
              route.gatewayPath ===
                gatewayPath &&
              (route.requestHost ?? null) ===
                (requestHost ?? null),
          ) ?? null,
      ),

    createRoute,
    updateRoute,

    softDeleteRoute: vi.fn(
      async (
        id: string,
      ): Promise<RouteConfigReadModel> => {
        const route =
          routes.find(
            (candidate) =>
              candidate.id === id,
          );

        if (!route) {
          throw new Error(
            "Route config not found",
          );
        }

        return {
          ...route,
          enabled: false,
          deletedAt: updatedAt,
        };
      },
    ),
  };

  return {
    repository,
    createRoute,
    updateRoute,
  };
}

async function buildApp(
  repository: RouteManagementRepository,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(
    adminRouteConfigRoute,
    {
      repository,
      adminApiKey:
        "test-admin-key",
      adminApiKeyHeader:
        "x-admin-api-key",
    },
  );

  return app;
}

describe(
  "Admin route service discovery candidate validation",
  () => {
    let app:
      | FastifyInstance
      | undefined;

    afterEach(async () => {
      if (app) {
        await app.close();
        app = undefined;
      }
    });

    it(
      "rejects a create that conflicts with persisted service instances before writing",
      async () => {
        const existing =
          createReadModel({
            id: "route-products",
            gatewayPath:
              "/api/products",
            downstreamUrl:
              "http://product-service-a:3001/products",
          });

        const {
          repository,
          createRoute,
        } = createRepository([
          existing,
        ]);

        app =
          await buildApp(
            repository,
          );

        const response =
          await app.inject({
            method: "POST",
            url:
              "/internal/admin/routes",
            headers: {
              "x-admin-api-key":
                "test-admin-key",
            },
            payload: {
              serviceName:
                "product-service",
              gatewayPath:
                "/api/orders",
              downstreamUrl:
                "http://product-service-c:3001/orders",
              serviceInstances: [
                {
                  baseUrl:
                    "http://product-service-c:3001",
                },
                {
                  baseUrl:
                    "http://product-service-d:3001",
                },
              ],
              method: "GET",
            },
          });

        expect(
          response.statusCode,
        ).toBe(400);

        expect(
          response.json(),
        ).toMatchObject({
          error: {
            code:
              "ROUTE_CONFIG_INVALID",
            details:
              expect.stringMatching(
                /conflicting serviceInstances across routes/,
              ),
          },
        });

        expect(
          createRoute,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects an update that conflicts with a sibling route before writing",
      async () => {
        const productRoute =
          createReadModel({
            id: "route-products",
            gatewayPath:
              "/api/products",
            downstreamUrl:
              "http://product-service-a:3001/products",
          });

        const orderRoute =
          createReadModel({
            id: "route-orders",
            gatewayPath:
              "/api/orders",
            downstreamUrl:
              "http://product-service-b:3001/orders",
          });

        const {
          repository,
          updateRoute,
        } = createRepository([
          productRoute,
          orderRoute,
        ]);

        app =
          await buildApp(
            repository,
          );

        const response =
          await app.inject({
            method: "PATCH",
            url:
              "/internal/admin/routes/route-orders",
            headers: {
              "x-admin-api-key":
                "test-admin-key",
            },
            payload: {
              downstreamUrl:
                "http://product-service-c:3001/orders",
              serviceInstances: [
                {
                  baseUrl:
                    "http://product-service-c:3001",
                },
                {
                  baseUrl:
                    "http://product-service-d:3001",
                },
              ],
            },
          });

        expect(
          response.statusCode,
        ).toBe(400);

        expect(
          response.json(),
        ).toMatchObject({
          error: {
            code:
              "ROUTE_CONFIG_INVALID",
            details:
              expect.stringMatching(
                /conflicting serviceInstances across routes/,
              ),
          },
        });

        expect(
          updateRoute,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  mapGatewayRouteRecordsToDownstreamRouteConfigs,
  mapGatewayRouteRecordToDownstreamRouteConfig,
  type DatabaseGatewayRouteRecord,
} from "../config/database-route-config.mapper.js";
import type {
  ServiceInstance,
} from "../config/downstream-routes.js";
import {
  Prisma,
} from "../generated/prisma/index.js";
import {
  createRouteRuntimeRegistry,
} from "../runtime/route-runtime-registry.js";
import {
  mapRouteConfigCreateRequestToCreateData,
  mapRouteConfigReadModelToResponse,
  mapRouteConfigUpdateRequestToUpdateData,
} from "./route-management.mapper.js";
import {
  createPrismaRouteManagementRepository,
} from "./route-management.repository.js";
import type {
  RouteConfigCreateData,
  RouteConfigReadModel,
} from "./route-management.types.js";

const serviceInstances: ServiceInstance[] = [
  {
    baseUrl:
      "http://product-service-a:3001",
  },
  {
    baseUrl:
      "http://product-service-b:3001",
  },
];

function createData(
  overrides: Partial<RouteConfigCreateData> = {},
): RouteConfigCreateData {
  return {
    serviceName: "product-service",
    gatewayPath: "/api/products",
    requestHost: null,
    downstreamUrl:
      "http://product-service-a:3001/products",
    weightedUpstreams: null,
    serviceInstances: null,
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
    rateLimitWindowMs: 60000,
    requestTransformEnabled: false,
    requestAddHeaders: null,
    requestRemoveHeaders: null,
    responseTransformEnabled: false,
    responseAddHeaders: null,
    responseRemoveHeaders: null,
    retryEnabled: false,
    retryAttempts: 0,
    retryOnStatuses: [502, 503, 504],
    ...overrides,
  };
}

function createReadModel(
  overrides: Partial<RouteConfigReadModel> = {},
): RouteConfigReadModel {
  return {
    ...createData(),
    id: "route-products",
    createdAt:
      new Date("2026-07-12T00:00:00.000Z"),
    updatedAt:
      new Date("2026-07-12T00:00:00.000Z"),
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function createRecord(
  overrides: Partial<DatabaseGatewayRouteRecord> = {},
): DatabaseGatewayRouteRecord {
  const data = createData();

  return {
    serviceName: data.serviceName,
    gatewayPath: data.gatewayPath,
    requestHost: data.requestHost,
    downstreamUrl: data.downstreamUrl,
    weightedUpstreams:
      data.weightedUpstreams,
    serviceInstances:
      data.serviceInstances,
    method: data.method,
    enabled: data.enabled,
    priority: data.priority,
    deletedAt: null,
    requireApiKey: data.requireApiKey,
    requireJwt: data.requireJwt,
    timeoutEnabled: data.timeoutEnabled,
    timeoutMs: data.timeoutMs,
    cacheEnabled: data.cacheEnabled,
    cacheTtlSeconds:
      data.cacheTtlSeconds,
    rateLimitEnabled:
      data.rateLimitEnabled,
    rateLimitLimit:
      data.rateLimitLimit,
    rateLimitWindowMs:
      data.rateLimitWindowMs,
    requestTransformEnabled:
      data.requestTransformEnabled,
    requestAddHeaders:
      data.requestAddHeaders,
    requestRemoveHeaders:
      data.requestRemoveHeaders,
    responseTransformEnabled:
      data.responseTransformEnabled,
    responseAddHeaders:
      data.responseAddHeaders,
    responseRemoveHeaders:
      data.responseRemoveHeaders,
    retryEnabled: data.retryEnabled,
    retryAttempts: data.retryAttempts,
    retryOnStatuses:
      data.retryOnStatuses,
    ...overrides,
  };
}

describe(
  "service discovery route persistence",
  () => {
    it(
      "maps create/read and preserves, replaces, and clears Admin updates",
      () => {
        const created =
          mapRouteConfigCreateRequestToCreateData({
            serviceName:
              "product-service",
            gatewayPath:
              "/api/products",
            downstreamUrl:
              "http://product-service-a:3001/products",
            serviceInstances,
            method: "GET",
          });

        expect(
          created.serviceInstances,
        ).toEqual(serviceInstances);

        expect(
          mapRouteConfigReadModelToResponse(
            createReadModel(created),
          ).serviceInstances,
        ).toEqual(serviceInstances);

        const existing =
          createReadModel({
            serviceInstances,
          });

        expect(
          mapRouteConfigUpdateRequestToUpdateData(
            existing,
            {
              priority: 200,
            },
          ).serviceInstances,
        ).toEqual(serviceInstances);

        const replacement:
          ServiceInstance[] = [
            {
              baseUrl:
                "http://product-service-a:3001",
            },
            {
              baseUrl:
                "http://product-service-c:3001",
            },
          ];

        expect(
          mapRouteConfigUpdateRequestToUpdateData(
            existing,
            {
              serviceInstances:
                replacement,
            },
          ).serviceInstances,
        ).toEqual(replacement);

        const cleared =
          mapRouteConfigUpdateRequestToUpdateData(
            existing,
            {
              serviceInstances: null,
            },
          );

        expect(
          cleared.serviceInstances,
        ).toBeNull();

        expect(cleared.downstreamUrl).toBe(
          existing.downstreamUrl,
        );
      },
    );

    it(
      "enforces discovery relationships on Admin writes",
      () => {
        expect(() =>
          mapRouteConfigCreateRequestToCreateData({
            serviceName:
              "product-service",
            gatewayPath:
              "/api/products",
            downstreamUrl:
              "http://product-service-a:3001/products",
            serviceInstances: [
              {
                baseUrl:
                  "http://product-service-b:3001",
              },
            ],
            method: "GET",
          }),
        ).toThrow(
          /downstreamUrl origin must exist in serviceInstances/,
        );
      },
    );

    it(
      "maps legacy and discovery rows and rejects malformed persisted JSON",
      () => {
        expect(
          mapGatewayRouteRecordToDownstreamRouteConfig(
            createRecord({
              serviceInstances,
            }),
          ).serviceInstances,
        ).toEqual(serviceInstances);

        expect(
          mapGatewayRouteRecordToDownstreamRouteConfig(
            createRecord({
              serviceInstances: null,
            }),
          ).serviceInstances,
        ).toBeUndefined();

        expect(() =>
          mapGatewayRouteRecordToDownstreamRouteConfig(
            createRecord({
              serviceInstances: [
                {
                  baseUrl: 3001,
                },
              ],
            }),
          ),
        ).toThrow(
          /service instance baseUrl must be a string/,
        );
      },
    );

    it(
      "writes arrays and Prisma DbNull through the repository",
      async () => {
        const create = vi.fn(
          async () =>
            createReadModel({
              serviceInstances,
            }),
        );

        const update = vi.fn(
          async () =>
            createReadModel({
              serviceInstances: null,
            }),
        );

        const repository =
          createPrismaRouteManagementRepository({
            gatewayRoute: {
              create,
              update,
            },
          } as never);

        await repository.createRoute(
          createData({
            serviceInstances,
          }),
        );

        expect(create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            serviceInstances,
          }),
        });

        await repository.updateRoute(
          "route-products",
          createData({
            serviceInstances: null,
          }),
        );

        expect(update).toHaveBeenCalledWith({
          where: {
            id: "route-products",
          },
          data: expect.objectContaining({
            serviceInstances:
              Prisma.DbNull,
          }),
        });
      },
    );

    it(
      "preserves discovery metadata during runtime reload",
      () => {
        const registry =
          createRouteRuntimeRegistry({
            initialRoutes:
              mapGatewayRouteRecordsToDownstreamRouteConfigs([
                createRecord({
                  serviceInstances: null,
                }),
              ]),
          });

        registry.replaceRoutes(
          mapGatewayRouteRecordsToDownstreamRouteConfigs([
            createRecord({
              serviceInstances,
            }),
          ]),
        );

        expect(
          registry.findRoute(
            "GET",
            "/api/products",
          )?.serviceInstances,
        ).toEqual(serviceInstances);

        expect(
          registry.getSnapshot()
            .serviceDiscovery.services,
        ).toEqual([
          {
            serviceName:
              "product-service",
            instances:
              serviceInstances,
          },
        ]);
      },
    );
  },
);
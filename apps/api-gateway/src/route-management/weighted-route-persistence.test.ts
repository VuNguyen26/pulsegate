import { describe, expect, it, vi } from "vitest";

import {
  mapGatewayRouteRecordsToDownstreamRouteConfigs,
  mapGatewayRouteRecordToDownstreamRouteConfig,
  type DatabaseGatewayRouteRecord,
} from "../config/database-route-config.mapper.js";
import type {
  WeightedUpstream,
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

const weightedUpstreams: WeightedUpstream[] = [
  {
    downstreamUrl:
      "http://product-service-a:3001/products",
    weight: 1,
  },
  {
    downstreamUrl:
      "http://product-service-b:3001/products",
    weight: 3,
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
    weightedUpstreams: data.weightedUpstreams,
    method: data.method,
    enabled: data.enabled,
    priority: data.priority,
    deletedAt: null,
    requireApiKey: data.requireApiKey,
    requireJwt: data.requireJwt,
    timeoutEnabled: data.timeoutEnabled,
    timeoutMs: data.timeoutMs,
    cacheEnabled: data.cacheEnabled,
    cacheTtlSeconds: data.cacheTtlSeconds,
    rateLimitEnabled: data.rateLimitEnabled,
    rateLimitLimit: data.rateLimitLimit,
    rateLimitWindowMs: data.rateLimitWindowMs,
    requestTransformEnabled:
      data.requestTransformEnabled,
    requestAddHeaders: data.requestAddHeaders,
    requestRemoveHeaders: data.requestRemoveHeaders,
    responseTransformEnabled:
      data.responseTransformEnabled,
    responseAddHeaders: data.responseAddHeaders,
    responseRemoveHeaders:
      data.responseRemoveHeaders,
    retryEnabled: data.retryEnabled,
    retryAttempts: data.retryAttempts,
    retryOnStatuses: data.retryOnStatuses,
    ...overrides,
  };
}

describe("weighted route persistence", () => {
  it("maps create/read and preserves, replaces, and clears Admin updates", () => {
    const created =
      mapRouteConfigCreateRequestToCreateData({
        serviceName: "product-service",
        gatewayPath: "/api/products",
        downstreamUrl:
          "http://product-service-a:3001/products",
        weightedUpstreams,
        method: "GET",
      });

    expect(created.weightedUpstreams).toEqual(
      weightedUpstreams,
    );

    expect(
      mapRouteConfigReadModelToResponse(
        createReadModel(created),
      ).weightedUpstreams,
    ).toEqual(weightedUpstreams);

    const existing = createReadModel({
      weightedUpstreams,
    });

    expect(
      mapRouteConfigUpdateRequestToUpdateData(
        existing,
        {
          priority: 200,
        },
      ).weightedUpstreams,
    ).toEqual(weightedUpstreams);

    const replacement: WeightedUpstream[] = [
      {
        downstreamUrl:
          "http://product-service-a:3001/products",
        weight: 4,
      },
      {
        downstreamUrl:
          "http://product-service-c:3001/products",
        weight: 1,
      },
    ];

    expect(
      mapRouteConfigUpdateRequestToUpdateData(
        existing,
        {
          weightedUpstreams: replacement,
        },
      ).weightedUpstreams,
    ).toEqual(replacement);

    const cleared =
      mapRouteConfigUpdateRequestToUpdateData(
        existing,
        {
          weightedUpstreams: null,
        },
      );

    expect(cleared.weightedUpstreams).toBeNull();
    expect(cleared.downstreamUrl).toBe(
      existing.downstreamUrl,
    );
  });

  it("maps legacy and weighted rows and rejects malformed persisted JSON", () => {
    expect(
      mapGatewayRouteRecordToDownstreamRouteConfig(
        createRecord({
          weightedUpstreams,
        }),
      ).weightedUpstreams,
    ).toEqual(weightedUpstreams);

    expect(
      mapGatewayRouteRecordToDownstreamRouteConfig(
        createRecord({
          weightedUpstreams: null,
        }),
      ).weightedUpstreams,
    ).toBeUndefined();

    expect(() =>
      mapGatewayRouteRecordToDownstreamRouteConfig(
        createRecord({
          weightedUpstreams: [
            {
              downstreamUrl:
                "http://product-service-a:3001/products",
              weight: "1",
            },
          ],
        }),
      ),
    ).toThrow(
      /weightedUpstreams\[0\]\.weight must be an integer/,
    );

    expect(() =>
      mapGatewayRouteRecordsToDownstreamRouteConfigs([
        createRecord({
          weightedUpstreams: [
            {
              downstreamUrl:
                "http://product-service-a:3001/products",
              weight: 1,
            },
          ],
        }),
      ]),
    ).toThrow(
      /weightedUpstreams must contain at least 2 upstreams/,
    );
  });

  it("writes weighted arrays and Prisma DbNull through the repository", async () => {
    const create = vi.fn(
      async () =>
        createReadModel({
          weightedUpstreams,
        }),
    );

    const update = vi.fn(
      async () =>
        createReadModel({
          weightedUpstreams: null,
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
        weightedUpstreams,
      }),
    );

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weightedUpstreams,
      }),
    });

    await repository.updateRoute(
      "route-products",
      createData({
        weightedUpstreams: null,
      }),
    );

    expect(update).toHaveBeenCalledWith({
      where: {
        id: "route-products",
      },
      data: expect.objectContaining({
        weightedUpstreams: Prisma.DbNull,
      }),
    });
  });

  it("preserves weighted metadata during runtime registry reload", () => {
    const registry =
      createRouteRuntimeRegistry({
        initialRoutes:
          mapGatewayRouteRecordsToDownstreamRouteConfigs([
            createRecord({
              weightedUpstreams: null,
            }),
          ]),
      });

    registry.replaceRoutes(
      mapGatewayRouteRecordsToDownstreamRouteConfigs([
        createRecord({
          weightedUpstreams,
        }),
      ]),
    );

    expect(
      registry.findRoute(
        "GET",
        "/api/products",
      )?.weightedUpstreams,
    ).toEqual(weightedUpstreams);
  });
});

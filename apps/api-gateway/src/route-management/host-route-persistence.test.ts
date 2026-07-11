import { describe, expect, it, vi } from "vitest";

import {
  mapGatewayRouteRecordToDownstreamRouteConfig,
  type DatabaseGatewayRouteRecord,
} from "../config/database-route-config.mapper.js";
import {
  mapRouteConfigCreateRequestToCreateData,
  mapRouteConfigUpdateRequestToUpdateData,
} from "./route-management.mapper.js";
import {
  createPrismaRouteManagementRepository,
} from "./route-management.repository.js";
import type {
  RouteConfigReadModel,
} from "./route-management.types.js";

function createRecord(
  requestHost: string | null,
): DatabaseGatewayRouteRecord {
  return {
    serviceName: "product-service",
    gatewayPath: "/api/products",
    requestHost,
    downstreamUrl:
      "http://product-service:3001/products",
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
  };
}

describe("host route persistence", () => {
  it("normalizes, preserves, and clears requestHost", () => {
    const base =
      mapRouteConfigCreateRequestToCreateData({
        serviceName: "product-service",
        gatewayPath: "/api/products",
        requestHost: "Api.Example.COM.",
        downstreamUrl:
          "http://product-service:3001/products",
        method: "GET",
      });

    expect(base.requestHost).toBe("api.example.com");

    const existing: RouteConfigReadModel = {
      ...base,
      id: "route-products",
      createdAt:
        new Date("2026-07-11T00:00:00.000Z"),
      updatedAt:
        new Date("2026-07-11T00:00:00.000Z"),
    };

    expect(
      mapRouteConfigUpdateRequestToUpdateData(
        existing,
        { priority: 200 },
      ).requestHost,
    ).toBe("api.example.com");

    expect(
      mapRouteConfigUpdateRequestToUpdateData(
        existing,
        { requestHost: null },
      ).requestHost,
    ).toBeNull();
  });

  it("maps persisted host and path-only records", () => {
    expect(
      mapGatewayRouteRecordToDownstreamRouteConfig(
        createRecord("api.example.com"),
      ).requestHost,
    ).toBe("api.example.com");

    expect(
      mapGatewayRouteRecordToDownstreamRouteConfig(
        createRecord(null),
      ).requestHost,
    ).toBeUndefined();
  });

  it("includes host identity in repository conflict lookup", async () => {
    const findFirst = vi.fn(async () => null);

    const repository =
      createPrismaRouteManagementRepository({
        gatewayRoute: { findFirst },
      } as never);

    await repository.findRouteByMethodAndGatewayPath(
      "GET",
      "/api/products",
      "api.example.com",
    );

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        method: "GET",
        gatewayPath: "/api/products",
        requestHost: "api.example.com",
        deletedAt: null,
      },
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  type DatabaseGatewayRouteRecord,
  mapGatewayRouteRecordsToDownstreamRouteConfigs,
  mapGatewayRouteRecordToDownstreamRouteConfig,
} from "./database-route-config.mapper.js";

function createRouteRecord(
  overrides: Partial<DatabaseGatewayRouteRecord> = {},
): DatabaseGatewayRouteRecord {
  return {
    serviceName: "product-service",
    gatewayPath: "/api/products",
    downstreamUrl: "http://product-service:3001/products",
    method: "GET",
    enabled: true,
    priority: 100,

    requireApiKey: true,
    requireJwt: true,

    timeoutEnabled: true,
    timeoutMs: 3000,

    cacheEnabled: true,
    cacheTtlSeconds: 30,

    rateLimitEnabled: true,
    rateLimitLimit: 5,
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

describe("database route config mapper", () => {
  it("should map a protected product route record to downstream route config", () => {
    const route = mapGatewayRouteRecordToDownstreamRouteConfig(
      createRouteRecord(),
    );

    expect(route).toEqual({
      serviceName: "product-service",
      gatewayPath: "/api/products",
      downstreamUrl: "http://product-service:3001/products",
      method: "GET",
      policies: {
        auth: {
          requireApiKey: true,
          requireJwt: true,
        },
        timeout: {
          enabled: true,
          timeoutMs: 3000,
        },
        cache: {
          enabled: true,
          ttlSeconds: 30,
        },
        rateLimit: {
          enabled: true,
          limit: 5,
          windowMs: 60000,
        },
        requestTransform: {
          enabled: false,
          addHeaders: undefined,
          removeHeaders: undefined,
        },
        responseTransform: {
          enabled: false,
          addHeaders: undefined,
          removeHeaders: undefined,
        },
        retry: {
          enabled: false,
          attempts: 0,
          retryOnStatuses: [502, 503, 504],
        },
      },
    });
  });

  it("should map a public route with disabled cache and rate limit", () => {
    const route = mapGatewayRouteRecordToDownstreamRouteConfig(
      createRouteRecord({
        gatewayPath: "/api/product-service/health",
        downstreamUrl: "http://product-service:3001/health",
        priority: 200,
        requireApiKey: false,
        requireJwt: false,
        cacheEnabled: false,
        cacheTtlSeconds: 30,
        rateLimitEnabled: false,
        rateLimitLimit: 5,
        rateLimitWindowMs: 60000,
      }),
    );

    expect(route.policies.auth).toEqual({
      requireApiKey: false,
      requireJwt: false,
    });
    expect(route.policies.cache).toEqual({
      enabled: false,
      ttlSeconds: 0,
    });
    expect(route.policies.rateLimit).toEqual({
      enabled: false,
      limit: 0,
      windowMs: 0,
    });
  });

  it("should map request and response transform JSON fields", () => {
    const route = mapGatewayRouteRecordToDownstreamRouteConfig(
      createRouteRecord({
        requestTransformEnabled: true,
        requestAddHeaders: {
          "x-from-gateway": "pulsegate",
        },
        requestRemoveHeaders: ["x-remove-request"],
        responseTransformEnabled: true,
        responseAddHeaders: {
          "x-powered-by": "pulsegate",
        },
        responseRemoveHeaders: ["server"],
      }),
    );

    expect(route.policies.requestTransform).toEqual({
      enabled: true,
      addHeaders: {
        "x-from-gateway": "pulsegate",
      },
      removeHeaders: ["x-remove-request"],
    });

    expect(route.policies.responseTransform).toEqual({
      enabled: true,
      addHeaders: {
        "x-powered-by": "pulsegate",
      },
      removeHeaders: ["server"],
    });
  });

  it("should filter disabled records and sort enabled records by priority", () => {
    const routes = mapGatewayRouteRecordsToDownstreamRouteConfigs([
      createRouteRecord({
        gatewayPath: "/disabled",
        enabled: false,
        priority: 1,
      }),
      createRouteRecord({
        gatewayPath: "/second",
        downstreamUrl: "http://product-service:3001/second",
        priority: 200,
      }),
      createRouteRecord({
        gatewayPath: "/first",
        downstreamUrl: "http://product-service:3001/first",
        priority: 100,
      }),
    ]);

    expect(routes.map((route) => route.gatewayPath)).toEqual([
      "/first",
      "/second",
    ]);
  });

  it("should reject invalid request addHeaders JSON", () => {
    expect(() =>
      mapGatewayRouteRecordToDownstreamRouteConfig(
        createRouteRecord({
          requestTransformEnabled: true,
          requestAddHeaders: ["not-an-object"],
        }),
      ),
    ).toThrow("requestAddHeaders must be an object with string values");
  });

  it("should reject invalid retryOnStatuses JSON", () => {
    expect(() =>
      mapGatewayRouteRecordToDownstreamRouteConfig(
        createRouteRecord({
          retryOnStatuses: ["502"],
        }),
      ),
    ).toThrow("retryOnStatuses must contain only integers");
  });

  it("should validate mapped downstream route config", () => {
    expect(() =>
      mapGatewayRouteRecordsToDownstreamRouteConfigs([
        createRouteRecord({
          gatewayPath: "missing-leading-slash",
        }),
      ]),
    ).toThrow("Invalid downstream route configuration");
  });
});
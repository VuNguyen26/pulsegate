import { describe, expect, it } from "vitest";

import type { DownstreamRouteConfig } from "./downstream-routes.js";
import { selectWeightedDownstreamUrl } from "./weighted-upstream-selector.js";

function createRoute(
  overrides: Partial<DownstreamRouteConfig> = {},
): DownstreamRouteConfig {
  return {
    serviceName: "product-service",
    gatewayPath: "/api/products",
    downstreamUrl: "http://product-a:3001/products",
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
        enabled: false,
        ttlSeconds: 30,
      },
      rateLimit: {
        enabled: false,
        limit: 100,
        windowMs: 60000,
      },
      requestTransform: {
        enabled: false,
      },
      responseTransform: {
        enabled: false,
      },
      retry: {
        enabled: false,
        attempts: 0,
        retryOnStatuses: [502, 503, 504],
      },
    },
    ...overrides,
  };
}

describe("selectWeightedDownstreamUrl", () => {
  it("should preserve legacy single-upstream routing", () => {
    const route = createRoute();

    expect(
      selectWeightedDownstreamUrl(route, () => {
        throw new Error("Random source must not be called");
      }),
    ).toBe("http://product-a:3001/products");
  });

  it("should select configured upstreams at deterministic weight boundaries", () => {
    const route = createRoute({
      weightedUpstreams: [
        {
          downstreamUrl: "http://product-a:3001/products",
          weight: 1,
        },
        {
          downstreamUrl: "http://product-b:3001/products",
          weight: 3,
        },
      ],
    });

    expect(selectWeightedDownstreamUrl(route, () => 0)).toBe(
      "http://product-a:3001/products",
    );

    expect(selectWeightedDownstreamUrl(route, () => 0.249999)).toBe(
      "http://product-a:3001/products",
    );

    expect(selectWeightedDownstreamUrl(route, () => 0.25)).toBe(
      "http://product-b:3001/products",
    );

    expect(selectWeightedDownstreamUrl(route, () => 0.999999)).toBe(
      "http://product-b:3001/products",
    );
  });

  it("should reject an invalid random source value", () => {
    const route = createRoute({
      weightedUpstreams: [
        {
          downstreamUrl: "http://product-a:3001/products",
          weight: 1,
        },
        {
          downstreamUrl: "http://product-b:3001/products",
          weight: 1,
        },
      ],
    });

    expect(() =>
      selectWeightedDownstreamUrl(route, () => -0.1),
    ).toThrow(/random source/);

    expect(() =>
      selectWeightedDownstreamUrl(route, () => 1),
    ).toThrow(/random source/);

    expect(() =>
      selectWeightedDownstreamUrl(route, () => Number.NaN),
    ).toThrow(/random source/);
  });

  it("should fail closed for an invalid weighted target set", () => {
    const emptyRoute = createRoute({
      weightedUpstreams: [],
    });

    expect(() =>
      selectWeightedDownstreamUrl(emptyRoute, () => 0),
    ).toThrow(/at least one upstream/);

    const invalidWeightRoute = createRoute({
      weightedUpstreams: [
        {
          downstreamUrl: "http://product-a:3001/products",
          weight: 0,
        },
      ],
    });

    expect(() =>
      selectWeightedDownstreamUrl(invalidWeightRoute, () => 0),
    ).toThrow(/positive integer weights/);
  });
});

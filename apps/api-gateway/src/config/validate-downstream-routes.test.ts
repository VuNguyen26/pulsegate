import { describe, expect, it } from "vitest";

import type { DownstreamRouteConfig } from "./downstream-routes.js";
import { validateDownstreamRoutes } from "./validate-downstream-routes.js";

function createValidRoute(
  overrides: Partial<DownstreamRouteConfig> = {},
): DownstreamRouteConfig {
  const route: DownstreamRouteConfig = {
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
  };

  return {
    ...route,
    ...overrides,
  };
}

describe("validateDownstreamRoutes", () => {
  it("should return routes when configuration is valid", () => {
    const routes = [createValidRoute()];

    expect(validateDownstreamRoutes(routes)).toBe(routes);
  });

  it("should reject duplicate method and gateway path combinations", () => {
    const routes = [
      createValidRoute(),
      createValidRoute({
        downstreamUrl: "http://product-service:3001/products-v2",
      }),
    ];

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /Duplicate downstream route config: GET:\/api\/products/,
    );
  });

  it("should reject invalid route identity and downstream URL values", () => {
    const routes = [
      createValidRoute({
        serviceName: "",
        gatewayPath: "api/products",
        downstreamUrl: "ftp://product-service/products",
      }),
    ];

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /serviceName is required/,
    );

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /gatewayPath must start with \//,
    );

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /downstreamUrl must use http or https/,
    );
  });

  it("should reject invalid timeout cache and rate limit policies", () => {
    const routes = [
      createValidRoute({
        policies: {
          ...createValidRoute().policies,
          timeout: {
            enabled: true,
            timeoutMs: 0,
          },
          cache: {
            enabled: true,
            ttlSeconds: -1,
          },
          rateLimit: {
            enabled: true,
            limit: 0,
            windowMs: 0,
          },
        },
      }),
    ];

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /policies.timeout.timeoutMs must be a positive integer/,
    );

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /policies.cache.ttlSeconds must be a positive integer/,
    );

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /policies.rateLimit.limit must be a positive integer/,
    );

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /policies.rateLimit.windowMs must be a positive integer/,
    );
  });

  it("should reject invalid request and response transform header names", () => {
    const routes = [
      createValidRoute({
        policies: {
          ...createValidRoute().policies,
          requestTransform: {
            enabled: true,
            addHeaders: {
              "bad header": "value",
            },
          },
          responseTransform: {
            enabled: true,
            removeHeaders: ["bad header"],
          },
        },
      }),
    ];

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /requestTransform.addHeaders contains invalid header name: bad header/,
    );

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /responseTransform.removeHeaders contains invalid header name: bad header/,
    );
  });

  it("should reject invalid retry policy values", () => {
    const routes = [
      createValidRoute({
        policies: {
          ...createValidRoute().policies,
          retry: {
            enabled: true,
            attempts: 0,
            retryOnStatuses: [99, 600],
          },
        },
      }),
    ];

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /policies.retry.attempts must be greater than 0 when retry is enabled/,
    );

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /policies.retry.retryOnStatuses contains invalid HTTP status: 99/,
    );

    expect(() => validateDownstreamRoutes(routes)).toThrow(
      /policies.retry.retryOnStatuses contains invalid HTTP status: 600/,
    );
  });
  it("should accept bounded relative weighted upstreams", () => {
    const route = createValidRoute({
      weightedUpstreams: [
        {
          downstreamUrl: "http://product-service:3001/products",
          weight: 1,
        },
        {
          downstreamUrl: "http://product-service-v2:3001/products",
          weight: 3,
        },
      ],
    });

    expect(validateDownstreamRoutes([route])).toEqual([route]);
  });

  it("should reject weighted upstream count outside the bounded range", () => {
    expect(() =>
      validateDownstreamRoutes([
        createValidRoute({
          weightedUpstreams: [],
        }),
      ]),
    ).toThrow(/must contain at least 2 upstreams/);

    const tooManyUpstreams = Array.from(
      {
        length: 9,
      },
      (_, index) => ({
        downstreamUrl:
          index === 0
            ? "http://product-service:3001/products"
            : `http://product-service-${index}:3001/products`,
        weight: 1,
      }),
    );

    expect(() =>
      validateDownstreamRoutes([
        createValidRoute({
          weightedUpstreams: tooManyUpstreams,
        }),
      ]),
    ).toThrow(/must contain at most 8 upstreams/);
  });

  it("should reject invalid weighted upstream weights", () => {
    for (const invalidWeight of [
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      1001,
    ]) {
      expect(() =>
        validateDownstreamRoutes([
          createValidRoute({
            weightedUpstreams: [
              {
                downstreamUrl:
                  "http://product-service:3001/products",
                weight: 1,
              },
              {
                downstreamUrl:
                  "http://product-service-v2:3001/products",
                weight: invalidWeight,
              },
            ],
          }),
        ]),
      ).toThrow(/weight must be an integer between 1 and 1000/);
    }
  });

  it("should reject duplicate weighted targets and a missing primary target", () => {
    expect(() =>
      validateDownstreamRoutes([
        createValidRoute({
          weightedUpstreams: [
            {
              downstreamUrl:
                "http://product-service:3001/products",
              weight: 1,
            },
            {
              downstreamUrl:
                "http://product-service:3001/products",
              weight: 2,
            },
          ],
        }),
      ]),
    ).toThrow(/contains duplicate downstreamUrl/);

    expect(() =>
      validateDownstreamRoutes([
        createValidRoute({
          weightedUpstreams: [
            {
              downstreamUrl:
                "http://product-service-v2:3001/products",
              weight: 1,
            },
            {
              downstreamUrl:
                "http://product-service-v3:3001/products",
              weight: 1,
            },
          ],
        }),
      ]),
    ).toThrow(
      /downstreamUrl must appear exactly once in weightedUpstreams/,
    );
  });

  it("should reject an invalid weighted downstream URL", () => {
    expect(() =>
      validateDownstreamRoutes([
        createValidRoute({
          weightedUpstreams: [
            {
              downstreamUrl:
                "http://product-service:3001/products",
              weight: 1,
            },
            {
              downstreamUrl: "ftp://product-service/products",
              weight: 1,
            },
          ],
        }),
      ]),
    ).toThrow(
      /weightedUpstreams\[1\] downstreamUrl must use http or https/,
    );
  });

  it("should reject retry attempts beyond the bounded maximum", () => {
    const route = createValidRoute({
      policies: {
        ...createValidRoute().policies,
        retry: {
          enabled: true,
          attempts: 8,
          retryOnStatuses: [502, 503, 504],
        },
      },
    });

    expect(() =>
      validateDownstreamRoutes([route]),
    ).toThrow(
      /policies\.retry\.attempts must not exceed 7/,
    );
  });});

import { describe, expect, it } from "vitest";

import type { ServiceDiscoveryRouteConfig } from "./service-discovery.js";
import {
  MAX_SERVICE_DISCOVERY_SERVICE_COUNT,
  MAX_SERVICE_INSTANCE_COUNT,
  buildServiceDiscoverySnapshot,
  composeServiceInstanceDownstreamUrl,
} from "./service-discovery.js";

function createRoute(
  overrides: Partial<ServiceDiscoveryRouteConfig> = {},
): ServiceDiscoveryRouteConfig {
  return {
    serviceName: "product-service",
    downstreamUrl:
      "http://product-a:3001/products?version=1",
    serviceInstances: [
      {
        baseUrl: "http://product-a:3001",
      },
      {
        baseUrl: "http://product-b:3001",
      },
    ],
    ...overrides,
  };
}

describe("service discovery contract", () => {
  it("builds a bounded immutable service snapshot", () => {
    const snapshot = buildServiceDiscoverySnapshot([
      createRoute(),
    ]);

    expect(snapshot).toEqual({
      serviceCount: 1,
      services: [
        {
          serviceName: "product-service",
          instances: [
            {
              baseUrl: "http://product-a:3001",
            },
            {
              baseUrl: "http://product-b:3001",
            },
          ],
        },
      ],
    });

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.services)).toBe(true);
    expect(
      Object.isFrozen(snapshot.services[0]?.instances),
    ).toBe(true);
  });

  it("keeps legacy routes outside the discovery snapshot", () => {
    const snapshot = buildServiceDiscoverySnapshot([
      createRoute({
        serviceInstances: undefined,
      }),
    ]);

    expect(snapshot).toEqual({
      serviceCount: 0,
      services: [],
    });
  });

  it.each([
    "",
    "Product-Service",
    "product_service",
    "-product-service",
    "product-service-",
    "a".repeat(65),
  ])("rejects invalid service identity %s", (serviceName) => {
    expect(() =>
      buildServiceDiscoverySnapshot([
        createRoute({ serviceName }),
      ]),
    ).toThrow(/serviceName/);
  });

  it.each([
    "ftp://product-a:3001",
    "http://user:password@product-a:3001",
    "http://product-a:3001/",
    "http://product-a:3001/path",
    "http://product-a:3001?version=1",
    "http://product-a:3001#fragment",
    "HTTP://product-a:3001",
  ])("rejects invalid instance base URL %s", (baseUrl) => {
    expect(() =>
      buildServiceDiscoverySnapshot([
        createRoute({
          serviceInstances: [{ baseUrl }],
        }),
      ]),
    ).toThrow(/baseUrl/);
  });

  it("rejects empty, duplicate, and oversized instance sets", () => {
    expect(() =>
      buildServiceDiscoverySnapshot([
        createRoute({
          serviceInstances: [],
        }),
      ]),
    ).toThrow(/at least one instance/);

    expect(() =>
      buildServiceDiscoverySnapshot([
        createRoute({
          serviceInstances: [
            {
              baseUrl: "http://product-a:3001",
            },
            {
              baseUrl: "http://product-a:3001",
            },
          ],
        }),
      ]),
    ).toThrow(/duplicate baseUrl/);

    expect(() =>
      buildServiceDiscoverySnapshot([
        createRoute({
          serviceInstances: Array.from(
            {
              length: MAX_SERVICE_INSTANCE_COUNT + 1,
            },
            (_, index) => ({
              baseUrl:
                `http://product-${index}:3001`,
            }),
          ),
        }),
      ]),
    ).toThrow(/at most 8 instances/);
  });

  it("requires the primary downstream origin in the instance set", () => {
    expect(() =>
      buildServiceDiscoverySnapshot([
        createRoute({
          serviceInstances: [
            {
              baseUrl: "http://product-b:3001",
            },
          ],
        }),
      ]),
    ).toThrow(
      /downstreamUrl origin must exist in serviceInstances/,
    );
  });

  it("accepts weighted targets that exactly match the instances", () => {
    const snapshot = buildServiceDiscoverySnapshot([
      createRoute({
        weightedUpstreams: [
          {
            downstreamUrl:
              "http://product-a:3001/products?version=1",
            weight: 75,
          },
          {
            downstreamUrl:
              "http://product-b:3001/products?version=1",
            weight: 25,
          },
        ],
      }),
    ]);

    expect(snapshot.serviceCount).toBe(1);
  });

  it("rejects weighted targets with a different path or query", () => {
    expect(() =>
      buildServiceDiscoverySnapshot([
        createRoute({
          weightedUpstreams: [
            {
              downstreamUrl:
                "http://product-a:3001/products?version=1",
              weight: 75,
            },
            {
              downstreamUrl:
                "http://product-b:3001/health",
              weight: 25,
            },
          ],
        }),
      ]),
    ).toThrow(/share the primary path and query/);
  });

  it("rejects weighted origins that differ from the instance set", () => {
    expect(() =>
      buildServiceDiscoverySnapshot([
        createRoute({
          weightedUpstreams: [
            {
              downstreamUrl:
                "http://product-a:3001/products?version=1",
              weight: 75,
            },
            {
              downstreamUrl:
                "http://product-c:3001/products?version=1",
              weight: 25,
            },
          ],
        }),
      ]),
    ).toThrow(
      /weighted upstream origins must exactly match serviceInstances/,
    );
  });

  it("rejects conflicting instances for the same service", () => {
    expect(() =>
      buildServiceDiscoverySnapshot([
        createRoute(),
        createRoute({
          downstreamUrl:
            "http://product-a:3001/health",
          serviceInstances: [
            {
              baseUrl: "http://product-a:3001",
            },
            {
              baseUrl: "http://product-c:3001",
            },
          ],
        }),
      ]),
    ).toThrow(
      /conflicting serviceInstances across routes/,
    );
  });

  it("rejects an oversized service snapshot", () => {
    const routes = Array.from(
      {
        length:
          MAX_SERVICE_DISCOVERY_SERVICE_COUNT + 1,
      },
      (_, index): ServiceDiscoveryRouteConfig => ({
        serviceName: `service-${index}`,
        downstreamUrl:
          `http://service-${index}:3001/products`,
        serviceInstances: [
          {
            baseUrl:
              `http://service-${index}:3001`,
          },
        ],
      }),
    );

    expect(() =>
      buildServiceDiscoverySnapshot(routes),
    ).toThrow(/at most 64 services/);
  });

  it("composes an instance URL while preserving path and query", () => {
    expect(
      composeServiceInstanceDownstreamUrl(
        "http://product-b:3001",
        "http://product-a:3001/products/42?version=1",
      ),
    ).toBe(
      "http://product-b:3001/products/42?version=1",
    );
  });

  it("does not allow a double-slash path to replace the configured origin", () => {
    expect(
      composeServiceInstanceDownstreamUrl(
        "http://product-b:3001",
        "http://product-a:3001//attacker.example/path?version=1",
      ),
    ).toBe(
      "http://product-b:3001//attacker.example/path?version=1",
    );
  });
});
import { describe, expect, it } from "vitest";

import {
  productProductsRouteConfig,
  type DownstreamRouteConfig,
} from "../config/downstream-routes.js";
import { createRouteRuntimeRegistry } from "./route-runtime-registry.js";

function createRoute(
  overrides: Partial<DownstreamRouteConfig> = {},
): DownstreamRouteConfig {
  return {
    ...structuredClone(productProductsRouteConfig),
    ...overrides,
  };
}

describe("host-aware route runtime registry", () => {
  it("prefers an exact host route before the path-only fallback", () => {
    const registry = createRouteRuntimeRegistry({
      initialRoutes: [
        createRoute({
          downstreamUrl:
            "http://fallback-service:3001/products",
        }),
        createRoute({
          requestHost: "api-a.example.com",
          downstreamUrl:
            "http://service-a:3001/products",
        }),
        createRoute({
          requestHost: "api-b.example.com",
          downstreamUrl:
            "http://service-b:3001/products",
        }),
      ],
    });

    expect(
      registry.findRoute(
        "GET",
        "/api/products",
        "api-a.example.com",
      )?.downstreamUrl,
    ).toBe("http://service-a:3001/products");

    expect(
      registry.findRoute(
        "GET",
        "/api/products",
        "api-b.example.com",
      )?.downstreamUrl,
    ).toBe("http://service-b:3001/products");

    expect(
      registry.findRoute(
        "GET",
        "/api/products",
        "unknown.example.com",
      )?.downstreamUrl,
    ).toBe("http://fallback-service:3001/products");

    expect(
      registry.findRoute(
        "GET",
        "/api/products",
      )?.downstreamUrl,
    ).toBe("http://fallback-service:3001/products");
  });

  it("returns null for an unknown host without a path-only fallback", () => {
    const registry = createRouteRuntimeRegistry({
      initialRoutes: [
        createRoute({
          requestHost: "api-a.example.com",
        }),
      ],
    });

    expect(
      registry.findRoute(
        "GET",
        "/api/products",
        "api-b.example.com",
      ),
    ).toBeNull();
  });

  it("allows the same method and path on different configured hosts", () => {
    expect(() =>
      createRouteRuntimeRegistry({
        initialRoutes: [
          createRoute({
            requestHost: "api-a.example.com",
          }),
          createRoute({
            requestHost: "api-b.example.com",
          }),
        ],
      }),
    ).not.toThrow();
  });

  it("rejects duplicate identities on the same configured host", () => {
    expect(() =>
      createRouteRuntimeRegistry({
        initialRoutes: [
          createRoute({
            requestHost: "api-a.example.com",
          }),
          createRoute({
            requestHost: "api-a.example.com",
            downstreamUrl:
              "http://duplicate-service:3001/products",
          }),
        ],
      }),
    ).toThrow(/Duplicate downstream route config/);
  });

  it("requires configured hosts to already be canonical", () => {
    expect(() =>
      createRouteRuntimeRegistry({
        initialRoutes: [
          createRoute({
            requestHost: "Api.Example.COM",
          }),
        ],
      }),
    ).toThrow(
      /requestHost must be canonical: api\.example\.com/,
    );
  });

  it("keeps the previous snapshot when a replacement is invalid", () => {
    const originalRoute = createRoute({
      requestHost: "api-a.example.com",
      downstreamUrl:
        "http://service-a:3001/products",
    });

    const registry = createRouteRuntimeRegistry({
      initialRoutes: [originalRoute],
    });

    const before = registry.getSnapshot();

    expect(() =>
      registry.replaceRoutes([
        originalRoute,
        createRoute({
          requestHost: "api-a.example.com",
          downstreamUrl:
            "http://duplicate-service:3001/products",
        }),
      ]),
    ).toThrow(/Duplicate downstream route config/);

    const after = registry.getSnapshot();

    expect(after.version).toBe(before.version);
    expect(after.loadedAt).toEqual(before.loadedAt);
    expect(
      registry.findRoute(
        "GET",
        "/api/products",
        "api-a.example.com",
      )?.downstreamUrl,
    ).toBe("http://service-a:3001/products");
  });
});
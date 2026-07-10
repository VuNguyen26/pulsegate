import type { RouteOptions } from "fastify";
import { describe, expect, it } from "vitest";

import { createAdminApiKeyAuthMiddleware } from "./admin-api-key-auth.middleware.js";
import { assertAdminRouteAuthBoundary } from "./admin-route-auth-boundary.js";

function createRouteOptions(
  url: string,
  preHandler?: RouteOptions["preHandler"],
): RouteOptions {
  return {
    method: "GET",
    url,
    handler: async () => ({
      ok: true,
    }),
    ...(preHandler ? { preHandler } : {}),
  };
}

describe("assertAdminRouteAuthBoundary", () => {
  it("should allow non-admin routes without an admin API key guard", () => {
    expect(() =>
      assertAdminRouteAuthBoundary(
        createRouteOptions("/health"),
      ),
    ).not.toThrow();
  });

  it("should allow a non-admin route with a similar prefix", () => {
    expect(() =>
      assertAdminRouteAuthBoundary(
        createRouteOptions("/internal/administrator"),
      ),
    ).not.toThrow();
  });

  it("should allow an admin route with the marked admin API key guard", () => {
    const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
      apiKey: "test-admin-key",
      headerName: "x-admin-api-key",
    });

    expect(() =>
      assertAdminRouteAuthBoundary(
        createRouteOptions(
          "/internal/admin/consumers",
          requireAdminApiKey,
        ),
      ),
    ).not.toThrow();
  });

  it("should recognize the admin API key guard inside a preHandler array", () => {
    const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
      apiKey: "test-admin-key",
      headerName: "x-admin-api-key",
    });

    const unrelatedPreHandler = async () => undefined;

    expect(() =>
      assertAdminRouteAuthBoundary(
        createRouteOptions("/internal/admin/routes", [
          unrelatedPreHandler,
          requireAdminApiKey,
        ]),
      ),
    ).not.toThrow();
  });

  it("should reject an admin route without a preHandler", () => {
    expect(() =>
      assertAdminRouteAuthBoundary(
        createRouteOptions("/internal/admin/usage/events"),
      ),
    ).toThrow(
      "Admin route GET /internal/admin/usage/events must use createAdminApiKeyAuthMiddleware",
    );
  });

  it("should reject an admin route with an unrelated preHandler", () => {
    const unrelatedPreHandler = async () => undefined;

    expect(() =>
      assertAdminRouteAuthBoundary(
        createRouteOptions(
          "/internal/admin/api-rejections/summary",
          unrelatedPreHandler,
        ),
      ),
    ).toThrow(
      "Admin route GET /internal/admin/api-rejections/summary must use createAdminApiKeyAuthMiddleware",
    );
  });
});
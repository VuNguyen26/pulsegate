import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("downstream route config", () => {
  it("should read product route rate limit config from environment variables", async () => {
    vi.stubEnv("PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS", "7");
    vi.stubEnv("PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS", "30000");

    const { productProductsRouteConfig } = await import(
      "./downstream-routes.js"
    );

    expect(productProductsRouteConfig.rateLimit).toEqual({
      limit: 7,
      windowMs: 30000,
    });
  });

  it("should define product route auth requirements", async () => {
    const { productProductsRouteConfig } = await import(
      "./downstream-routes.js"
    );

    expect(productProductsRouteConfig.auth).toEqual({
      requireApiKey: true,
      requireJwt: true,
    });
  });
});
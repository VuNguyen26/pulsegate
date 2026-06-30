import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("downstream route config", () => {
  it("should read product route rate limit policy from environment variables", async () => {
    vi.stubEnv("PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS", "7");
    vi.stubEnv("PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS", "30000");

    const { productProductsRouteConfig } = await import(
      "./downstream-routes.js"
    );

    expect(productProductsRouteConfig.policies.rateLimit).toEqual({
      enabled: true,
      limit: 7,
      windowMs: 30000,
    });
  });

  it("should define product route auth policy", async () => {
    const { productProductsRouteConfig } = await import(
      "./downstream-routes.js"
    );

    expect(productProductsRouteConfig.policies.auth).toEqual({
      requireApiKey: true,
      requireJwt: true,
    });
  });

  it("should define product route timeout policy", async () => {
    vi.stubEnv("DOWNSTREAM_REQUEST_TIMEOUT_MS", "2500");

    const { productProductsRouteConfig } = await import(
      "./downstream-routes.js"
    );

    expect(productProductsRouteConfig.policies.timeout).toEqual({
      enabled: true,
      timeoutMs: 2500,
    });
  });

  it("should define product route cache policy", async () => {
    const { productProductsRouteConfig } = await import(
      "./downstream-routes.js"
    );

    expect(productProductsRouteConfig.policies.cache).toEqual({
      enabled: true,
      ttlSeconds: 30,
    });
  });

  it("should define disabled transformation and retry policy foundations for the product route", async () => {
    const { productProductsRouteConfig } = await import(
      "./downstream-routes.js"
    );

    expect(productProductsRouteConfig.policies.requestTransform).toEqual({
      enabled: false,
    });

    expect(productProductsRouteConfig.policies.responseTransform).toEqual({
      enabled: false,
    });

    expect(productProductsRouteConfig.policies.retry).toEqual({
      enabled: false,
      attempts: 0,
      retryOnStatuses: [502, 503, 504],
    });
  });

  it("should define product service health route as a public downstream route", async () => {
    vi.stubEnv("PRODUCT_SERVICE_URL", "http://product-service.example");
    vi.stubEnv("DOWNSTREAM_REQUEST_TIMEOUT_MS", "2500");

    const { productServiceHealthRouteConfig } = await import(
      "./downstream-routes.js"
    );

    expect(productServiceHealthRouteConfig).toEqual({
      serviceName: "product-service",
      gatewayPath: "/api/product-service/health",
      downstreamUrl: "http://product-service.example/health",
      method: "GET",
      policies: {
        auth: {
          requireApiKey: false,
          requireJwt: false,
        },
        timeout: {
          enabled: true,
          timeoutMs: 2500,
        },
        cache: {
          enabled: false,
          ttlSeconds: 0,
        },
        rateLimit: {
          enabled: false,
          limit: 0,
          windowMs: 0,
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
    });
  });

  it("should include product and product service health routes in downstream route configs", async () => {
    const {
      downstreamRouteConfigs,
      productProductsRouteConfig,
      productServiceHealthRouteConfig,
    } = await import("./downstream-routes.js");

    expect(downstreamRouteConfigs).toEqual([
      productProductsRouteConfig,
      productServiceHealthRouteConfig,
    ]);
  });
});
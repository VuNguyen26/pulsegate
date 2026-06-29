import type { RoutePolicies } from "../policies/route-policy.types.js";
import { env } from "./env.js";
import { validateDownstreamRoutes } from "./validate-downstream-routes.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type DownstreamRouteConfig = {
  serviceName: string;
  gatewayPath: string;
  downstreamUrl: string;
  method: HttpMethod;
  policies: RoutePolicies;
};

export const productProductsRouteConfig: DownstreamRouteConfig = {
  serviceName: "product-service",
  gatewayPath: "/api/products",
  downstreamUrl: `${env.PRODUCT_SERVICE_URL}/products`,
  method: "GET",
  policies: {
    auth: {
      requireApiKey: true,
      requireJwt: true,
    },
    timeout: {
      enabled: true,
      timeoutMs: env.DOWNSTREAM_REQUEST_TIMEOUT_MS,
    },
    cache: {
      enabled: true,
      ttlSeconds: 30,
    },
    rateLimit: {
      enabled: true,
      limit: env.PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS,
      windowMs: env.PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS,
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

export const downstreamRouteConfigs = validateDownstreamRoutes([
  productProductsRouteConfig,
]);
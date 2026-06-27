import { env } from "./env.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RouteAuthConfig = {
  requireApiKey: boolean;
  requireJwt: boolean;
};

export type RouteRateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type DownstreamRouteConfig = {
  serviceName: string;
  gatewayPath: string;
  downstreamUrl: string;
  method: HttpMethod;
  timeoutMs: number;
  auth: RouteAuthConfig;
  rateLimit: RouteRateLimitConfig;
};

export const productProductsRouteConfig: DownstreamRouteConfig = {
  serviceName: "product-service",
  gatewayPath: "/api/products",
  downstreamUrl: `${env.PRODUCT_SERVICE_URL}/products`,
  method: "GET",
  timeoutMs: env.DOWNSTREAM_REQUEST_TIMEOUT_MS,
  auth: {
    requireApiKey: true,
    requireJwt: true,
  },
  rateLimit: {
    limit: env.PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS,
    windowMs: env.PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS,
  },
};
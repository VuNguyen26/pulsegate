import { env } from "./env.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type DownstreamRouteConfig = {
  serviceName: string;
  gatewayPath: string;
  downstreamUrl: string;
  method: HttpMethod;
  timeoutMs: number;
};

export const productProductsRouteConfig: DownstreamRouteConfig = {
  serviceName: "product-service",
  gatewayPath: "/api/products",
  downstreamUrl: `${env.PRODUCT_SERVICE_URL}/products`,
  method: "GET",
  timeoutMs: env.DOWNSTREAM_REQUEST_TIMEOUT_MS,
};
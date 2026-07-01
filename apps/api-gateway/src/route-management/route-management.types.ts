import type { DatabaseGatewayRouteRecord } from "../config/database-route-config.mapper.js";
import type { HttpMethod } from "../config/downstream-routes.js";

export type RouteConfigReadModel = DatabaseGatewayRouteRecord & {
  id: string;
  method: HttpMethod;
  createdAt: Date;
  updatedAt: Date;
};

export type RouteConfigCreateData = {
  serviceName: string;
  gatewayPath: string;
  downstreamUrl: string;
  method: HttpMethod;
  enabled: boolean;
  priority: number;
  requireApiKey: boolean;
  requireJwt: boolean;
  timeoutEnabled: boolean;
  timeoutMs: number;
  cacheEnabled: boolean;
  cacheTtlSeconds: number;
  rateLimitEnabled: boolean;
  rateLimitLimit: number;
  rateLimitWindowMs: number;
  requestTransformEnabled: boolean;
  requestAddHeaders: Record<string, string> | null;
  requestRemoveHeaders: string[] | null;
  responseTransformEnabled: boolean;
  responseAddHeaders: Record<string, string> | null;
  responseRemoveHeaders: string[] | null;
  retryEnabled: boolean;
  retryAttempts: number;
  retryOnStatuses: number[];
};

export type RouteManagementRepository = {
  listRoutes: () => Promise<RouteConfigReadModel[]>;
  findRouteById: (id: string) => Promise<RouteConfigReadModel | null>;
  findRouteByMethodAndGatewayPath: (
    method: HttpMethod,
    gatewayPath: string,
  ) => Promise<RouteConfigReadModel | null>;
  createRoute: (data: RouteConfigCreateData) => Promise<RouteConfigReadModel>;
};

export type RouteConfigResponse = {
  id: string;
  serviceName: string;
  gatewayPath: string;
  downstreamUrl: string;
  method: HttpMethod;
  enabled: boolean;
  priority: number;
  policies: {
    auth: {
      requireApiKey: boolean;
      requireJwt: boolean;
    };
    timeout: {
      enabled: boolean;
      timeoutMs: number;
    };
    cache: {
      enabled: boolean;
      ttlSeconds: number;
    };
    rateLimit: {
      enabled: boolean;
      limit: number;
      windowMs: number;
    };
    requestTransform: {
      enabled: boolean;
      addHeaders: Record<string, string>;
      removeHeaders: string[];
    };
    responseTransform: {
      enabled: boolean;
      addHeaders: Record<string, string>;
      removeHeaders: string[];
    };
    retry: {
      enabled: boolean;
      attempts: number;
      retryOnStatuses: number[];
    };
  };
  createdAt: string;
  updatedAt: string;
};
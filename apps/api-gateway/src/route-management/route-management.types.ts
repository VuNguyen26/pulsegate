import type { DatabaseGatewayRouteRecord } from "../config/database-route-config.mapper.js";
import type { HttpMethod } from "../config/downstream-routes.js";

export type RouteConfigReadModel = DatabaseGatewayRouteRecord & {
  id: string;
  method: HttpMethod;
  createdAt: Date;
  updatedAt: Date;
};

export type RouteManagementRepository = {
  listRoutes: () => Promise<RouteConfigReadModel[]>;
  findRouteById: (id: string) => Promise<RouteConfigReadModel | null>;
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
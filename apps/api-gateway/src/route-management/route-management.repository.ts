import type {
  GatewayRouteMethod,
  Prisma,
  PrismaClient,
} from "../generated/prisma/index.js";
import type {
  RouteConfigCreateData,
  RouteConfigReadModel,
  RouteManagementRepository,
} from "./route-management.types.js";

export function createPrismaRouteManagementRepository(
  prisma: PrismaClient,
): RouteManagementRepository {
  return {
    listRoutes: async () => {
      const routes = await prisma.gatewayRoute.findMany({
        orderBy: [
          {
            priority: "asc",
          },
          {
            gatewayPath: "asc",
          },
        ],
      });

      return routes as unknown as RouteConfigReadModel[];
    },

    findRouteById: async (id: string) => {
      const route = await prisma.gatewayRoute.findUnique({
        where: {
          id,
        },
      });

      return route as RouteConfigReadModel | null;
    },

    findRouteByMethodAndGatewayPath: async (
      method,
      gatewayPath,
    ) => {
      const route = await prisma.gatewayRoute.findUnique({
        where: {
          gateway_routes_method_gateway_path_key: {
            method: method as GatewayRouteMethod,
            gatewayPath,
          },
        },
      });

      return route as RouteConfigReadModel | null;
    },

    createRoute: async (data: RouteConfigCreateData) => {
      const route = await prisma.gatewayRoute.create({
        data: {
          serviceName: data.serviceName,
          gatewayPath: data.gatewayPath,
          downstreamUrl: data.downstreamUrl,
          method: data.method as GatewayRouteMethod,
          enabled: data.enabled,
          priority: data.priority,
          requireApiKey: data.requireApiKey,
          requireJwt: data.requireJwt,
          timeoutEnabled: data.timeoutEnabled,
          timeoutMs: data.timeoutMs,
          cacheEnabled: data.cacheEnabled,
          cacheTtlSeconds: data.cacheTtlSeconds,
          rateLimitEnabled: data.rateLimitEnabled,
          rateLimitLimit: data.rateLimitLimit,
          rateLimitWindowMs: data.rateLimitWindowMs,
          requestTransformEnabled: data.requestTransformEnabled,
          requestAddHeaders:
            data.requestAddHeaders === null
              ? undefined
              : (data.requestAddHeaders as Prisma.InputJsonValue),
          requestRemoveHeaders:
            data.requestRemoveHeaders === null
              ? undefined
              : (data.requestRemoveHeaders as Prisma.InputJsonValue),
          responseTransformEnabled: data.responseTransformEnabled,
          responseAddHeaders:
            data.responseAddHeaders === null
              ? undefined
              : (data.responseAddHeaders as Prisma.InputJsonValue),
          responseRemoveHeaders:
            data.responseRemoveHeaders === null
              ? undefined
              : (data.responseRemoveHeaders as Prisma.InputJsonValue),
          retryEnabled: data.retryEnabled,
          retryAttempts: data.retryAttempts,
          retryOnStatuses: data.retryOnStatuses as Prisma.InputJsonValue,
        },
      });

      return route as unknown as RouteConfigReadModel;
    },
  };
}
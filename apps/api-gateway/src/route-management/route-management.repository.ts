import type {
  GatewayRouteMethod,
  Prisma,
  PrismaClient,
} from "../generated/prisma/index.js";
import type {
  RouteConfigCreateData,
  RouteConfigReadModel,
  RouteConfigUpdateData,
  RouteManagementRepository,
} from "./route-management.types.js";

function mapRouteConfigDataToPrismaInput(
  data: RouteConfigCreateData | RouteConfigUpdateData,
) {
  return {
    serviceName: data.serviceName,
    gatewayPath: data.gatewayPath,

    requestHost: data.requestHost ?? null,
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
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
  };
}

export function createPrismaRouteManagementRepository(
  prisma: PrismaClient,
): RouteManagementRepository {
  return {
    listRoutes: async () => {
      const routes = await prisma.gatewayRoute.findMany({
        where: {
          deletedAt: null,
        },
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
      const route = await prisma.gatewayRoute.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      return route as RouteConfigReadModel | null;
    },

    findRouteByMethodAndGatewayPath: async (
      method,
      gatewayPath,
      requestHost,
    ) => {
      const route = await prisma.gatewayRoute.findFirst({
        where: {
          method: method as GatewayRouteMethod,
          gatewayPath,
          requestHost: requestHost ?? null,
          deletedAt: null,
        },
      });

      return route as RouteConfigReadModel | null;
    },

    createRoute: async (data: RouteConfigCreateData) => {
      const route = await prisma.gatewayRoute.create({
        data: mapRouteConfigDataToPrismaInput(data),
      });

      return route as unknown as RouteConfigReadModel;
    },

    updateRoute: async (id: string, data: RouteConfigUpdateData) => {
      const route = await prisma.gatewayRoute.update({
        where: {
          id,
        },
        data: mapRouteConfigDataToPrismaInput(data),
      });

      return route as unknown as RouteConfigReadModel;
    },

    softDeleteRoute: async (id: string, actor: string) => {
      const route = await prisma.gatewayRoute.update({
        where: {
          id,
        },
        data: {
          enabled: false,
          deletedAt: new Date(),
          deletedBy: actor,
          updatedBy: actor,
        },
      });

      return route as unknown as RouteConfigReadModel;
    },
  };
}
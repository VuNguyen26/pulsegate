import type { PrismaClient } from "../generated/prisma/index.js";
import type {
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
  };
}
import type { PrismaClient } from "../generated/prisma/index.js";
import type { DownstreamRouteConfig } from "./downstream-routes.js";
import {
  mapGatewayRouteRecordsToDownstreamRouteConfigs,
  type DatabaseGatewayRouteRecord,
} from "./database-route-config.mapper.js";

export async function loadDatabaseDownstreamRouteConfigs(
  prisma: PrismaClient,
): Promise<DownstreamRouteConfig[]> {
  const routeRecords = await prisma.gatewayRoute.findMany({
    where: {
      enabled: true,
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

  return mapGatewayRouteRecordsToDownstreamRouteConfigs(
    routeRecords as DatabaseGatewayRouteRecord[],
  );
}
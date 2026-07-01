import type { FastifyInstance } from "fastify";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";
import { mapRouteConfigReadModelToResponse } from "../route-management/route-management.mapper.js";
import { createPrismaRouteManagementRepository } from "../route-management/route-management.repository.js";
import type { RouteManagementRepository } from "../route-management/route-management.types.js";

export type AdminRouteConfigRouteOptions = {
  repository?: RouteManagementRepository;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
};

type RouteIdParams = {
  id: string;
};

export async function adminRouteConfigRoute(
  app: FastifyInstance,
  options: AdminRouteConfigRouteOptions = {},
): Promise<void> {
  const repository =
    options.repository ?? createPrismaRouteManagementRepository(gatewayPrisma);

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

  app.get(
    "/internal/admin/routes",
    {
      preHandler: requireAdminApiKey,
    },
    async () => {
      const routes = await repository.listRoutes();

      return {
        data: routes.map(mapRouteConfigReadModelToResponse),
      };
    },
  );

  app.get<{ Params: RouteIdParams }>(
    "/internal/admin/routes/:id",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const route = await repository.findRouteById(request.params.id);

      if (!route) {
        return reply.status(404).send({
          error: {
            code: "ROUTE_CONFIG_NOT_FOUND",
            message: "Route config was not found",
            requestId: request.id,
          },
        });
      }

      return {
        data: mapRouteConfigReadModelToResponse(route),
      };
    },
  );
}
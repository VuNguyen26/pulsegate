import type { FastifyInstance, FastifyRequest } from "fastify";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";
import {
  mapRouteConfigCreateRequestToCreateData,
  mapRouteConfigReadModelToResponse,
  mapRouteConfigUpdateRequestToUpdateData,
} from "../route-management/route-management.mapper.js";
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Invalid route config";
}

function getAdminActor(request: FastifyRequest): string {
  const actorHeader = request.headers["x-admin-actor"];

  if (Array.isArray(actorHeader)) {
    const firstActor = actorHeader[0]?.trim();

    return firstActor && firstActor.length > 0 ? firstActor : "admin-api-key";
  }

  if (typeof actorHeader === "string") {
    const actor = actorHeader.trim();

    return actor.length > 0 ? actor : "admin-api-key";
  }

  return "admin-api-key";
}

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

  app.post(
    "/internal/admin/routes",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      let createData;

      try {
        createData = mapRouteConfigCreateRequestToCreateData(request.body);
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: "ROUTE_CONFIG_INVALID",
            message: "Route config is invalid",
            details: getErrorMessage(error),
            requestId: request.id,
          },
        });
      }

      const existingRoute = await repository.findRouteByMethodAndGatewayPath(
        createData.method,
        createData.gatewayPath,
      );

      if (existingRoute) {
        return reply.status(409).send({
          error: {
            code: "ROUTE_CONFIG_ALREADY_EXISTS",
            message: "Route config already exists for this method and gateway path",
            requestId: request.id,
          },
        });
      }

      const actor = getAdminActor(request);
      const createdRoute = await repository.createRoute({
        ...createData,
        createdBy: actor,
        updatedBy: actor,
      });

      return reply.status(201).send({
        data: mapRouteConfigReadModelToResponse(createdRoute),
      });
    },
  );

  app.patch<{ Params: RouteIdParams }>(
    "/internal/admin/routes/:id",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const existingRoute = await repository.findRouteById(request.params.id);

      if (!existingRoute) {
        return reply.status(404).send({
          error: {
            code: "ROUTE_CONFIG_NOT_FOUND",
            message: "Route config was not found",
            requestId: request.id,
          },
        });
      }

      let updateData;

      try {
        updateData = mapRouteConfigUpdateRequestToUpdateData(
          existingRoute,
          request.body,
        );
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: "ROUTE_CONFIG_INVALID",
            message: "Route config is invalid",
            details: getErrorMessage(error),
            requestId: request.id,
          },
        });
      }

      const conflictingRoute = await repository.findRouteByMethodAndGatewayPath(
        updateData.method,
        updateData.gatewayPath,
      );

      if (conflictingRoute && conflictingRoute.id !== existingRoute.id) {
        return reply.status(409).send({
          error: {
            code: "ROUTE_CONFIG_ALREADY_EXISTS",
            message: "Route config already exists for this method and gateway path",
            requestId: request.id,
          },
        });
      }

      const actor = getAdminActor(request);
      const updatedRoute = await repository.updateRoute(existingRoute.id, {
        ...updateData,
        updatedBy: actor,
      });

      return {
        data: mapRouteConfigReadModelToResponse(updatedRoute),
      };
    },
  );

  app.delete<{ Params: RouteIdParams }>(
    "/internal/admin/routes/:id",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const existingRoute = await repository.findRouteById(request.params.id);

      if (!existingRoute) {
        return reply.status(404).send({
          error: {
            code: "ROUTE_CONFIG_NOT_FOUND",
            message: "Route config was not found",
            requestId: request.id,
          },
        });
      }

      const actor = getAdminActor(request);
      const deletedRoute = await repository.softDeleteRoute(
        existingRoute.id,
        actor,
      );

      return {
        data: mapRouteConfigReadModelToResponse(deletedRoute),
      };
    },
  );
}
import type { FastifyInstance, FastifyRequest } from "fastify";
import { mapGatewayRouteRecordsToDownstreamRouteConfigs } from "../config/database-route-config.mapper.js";
import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";
import {
  mapRouteConfigCreateRequestToCreateData,
  mapRouteConfigReadModelToResponse,
  mapRouteConfigUpdateRequestToUpdateData,
} from "../route-management/route-management.mapper.js";
import { createPrismaRouteManagementRepository } from "../route-management/route-management.repository.js";
import type { RouteManagementRepository } from "../route-management/route-management.types.js";
import type { RouteRuntimeRegistry } from "../runtime/route-runtime-registry.js";

export type AdminRouteConfigRouteOptions = {
  repository?: RouteManagementRepository;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
  routeRuntimeRegistry?: RouteRuntimeRegistry;
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

  app.get(
    "/internal/admin/routes/runtime",
    {
      preHandler: requireAdminApiKey,
    },
    async () => {
      const snapshot = options.routeRuntimeRegistry?.getSnapshot();

      if (!snapshot) {
        return {
          data: {
            mode: "runtime-registry",
            available: false,
            version: null,
            loadedAt: null,
            routeCount: 0,
            routes: [],
          },
        };
      }

      return {
        data: {
          mode: "runtime-registry",
          available: true,
          version: snapshot.version,
          loadedAt: snapshot.loadedAt.toISOString(),
          routeCount: snapshot.routeCount,
          routes: snapshot.routes.map((route) => ({
            method: route.method,
            gatewayPath: route.gatewayPath,
            serviceName: route.serviceName,
          })),
        },
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
            message:
              "Route config already exists for this method and gateway path",
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

  app.post(
    "/internal/admin/routes/reload",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const routes = await repository.listRoutes();

      try {
        const activeRoutes = routes.filter(
          (route) => route.enabled && !route.deletedAt,
        );

        const validatedRouteConfigs =
          mapGatewayRouteRecordsToDownstreamRouteConfigs(activeRoutes);

        const registryApplyResult =
          options.routeRuntimeRegistry?.replaceRoutes(validatedRouteConfigs) ??
          null;

        return {
          data: {
            mode: "runtime-registry-refresh",
            registryAvailable: Boolean(options.routeRuntimeRegistry),
            registryApplied: Boolean(registryApplyResult),
            runtimeApplied: Boolean(registryApplyResult),
            runtimeScope: registryApplyResult ? "dynamic-router" : "none",
            newRoutesRequireRestart: !registryApplyResult,
            requiresRestart: !registryApplyResult,
            previousVersion: registryApplyResult?.previousVersion ?? null,
            currentVersion: registryApplyResult?.currentVersion ?? null,
            loadedAt: registryApplyResult?.loadedAt.toISOString() ?? null,
            routeCount: validatedRouteConfigs.length,
            routes: validatedRouteConfigs.map((route) => ({
              method: route.method,
              gatewayPath: route.gatewayPath,
              serviceName: route.serviceName,
            })),
          },
        };
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: "ROUTE_CONFIG_RELOAD_VALIDATION_FAILED",
            message: "Route config reload validation failed",
            details: getErrorMessage(error),
            requestId: request.id,
          },
        });
      }
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
            message:
              "Route config already exists for this method and gateway path",
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
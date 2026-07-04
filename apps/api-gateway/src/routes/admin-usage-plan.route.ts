import type { FastifyInstance, FastifyRequest } from "fastify";

import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";
import {
  mapUsagePlanCreateRequestToCreateData,
  mapUsagePlanReadModelToResponse,
  mapUsagePlanUpdateRequestToUpdateData,
} from "../usage-plans/usage-plan-management.mapper.js";
import { createPrismaUsagePlanManagementRepository } from "../usage-plans/usage-plan-management.repository.js";
import type { UsagePlanManagementRepository } from "../usage-plans/usage-plan-management.types.js";
import {
  createPrismaUsagePlanUsageSummaryReader,
  mapUsagePlanUsageSummaryReadModelToResponse,
  type UsagePlanUsageSummaryReader,
} from "../usage-plans/usage-plan-usage-summary.js";

export type AdminUsagePlanRouteOptions = {
  repository?: UsagePlanManagementRepository;
  usageSummaryReader?: UsagePlanUsageSummaryReader;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
};

type UsagePlanIdParams = {
  id: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Invalid usage plan";
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

export async function adminUsagePlanRoute(
  app: FastifyInstance,
  options: AdminUsagePlanRouteOptions = {},
): Promise<void> {
  const repository =
    options.repository ??
    createPrismaUsagePlanManagementRepository(gatewayPrisma);

  const usageSummaryReader =
    options.usageSummaryReader ??
    createPrismaUsagePlanUsageSummaryReader(gatewayPrisma);

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

  app.get(
    "/internal/admin/usage-plans",
    {
      preHandler: requireAdminApiKey,
    },
    async () => {
      const usagePlans = await repository.listUsagePlans();

      return {
        data: usagePlans.map(mapUsagePlanReadModelToResponse),
      };
    },
  );

  app.get<{ Params: UsagePlanIdParams }>(
    "/internal/admin/usage-plans/:id/usage-summary",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const usageSummary = await usageSummaryReader.getUsagePlanUsageSummary(
        request.params.id,
      );

      if (!usageSummary) {
        return reply.status(404).send({
          error: {
            code: "USAGE_PLAN_NOT_FOUND",
            message: "Usage plan was not found",
            requestId: request.id,
          },
        });
      }

      return {
        data: mapUsagePlanUsageSummaryReadModelToResponse(usageSummary),
      };
    },
  );

  app.get<{ Params: UsagePlanIdParams }>(
    "/internal/admin/usage-plans/:id",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const usagePlan = await repository.findUsagePlanById(request.params.id);

      if (!usagePlan) {
        return reply.status(404).send({
          error: {
            code: "USAGE_PLAN_NOT_FOUND",
            message: "Usage plan was not found",
            requestId: request.id,
          },
        });
      }

      return {
        data: mapUsagePlanReadModelToResponse(usagePlan),
      };
    },
  );

  app.post(
    "/internal/admin/usage-plans",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      let createData;

      try {
        createData = mapUsagePlanCreateRequestToCreateData(request.body);
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: "USAGE_PLAN_INVALID",
            message: "Usage plan is invalid",
            details: getErrorMessage(error),
            requestId: request.id,
          },
        });
      }

      const actor = getAdminActor(request);
      const createdUsagePlan = await repository.createUsagePlan({
        ...createData,
        createdBy: actor,
        updatedBy: actor,
      });

      return reply.status(201).send({
        data: mapUsagePlanReadModelToResponse(createdUsagePlan),
      });
    },
  );

  app.patch<{ Params: UsagePlanIdParams }>(
    "/internal/admin/usage-plans/:id",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const existingUsagePlan = await repository.findUsagePlanById(
        request.params.id,
      );

      if (!existingUsagePlan) {
        return reply.status(404).send({
          error: {
            code: "USAGE_PLAN_NOT_FOUND",
            message: "Usage plan was not found",
            requestId: request.id,
          },
        });
      }

      let updateData;

      try {
        updateData = mapUsagePlanUpdateRequestToUpdateData(
          existingUsagePlan,
          request.body,
        );
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: "USAGE_PLAN_INVALID",
            message: "Usage plan is invalid",
            details: getErrorMessage(error),
            requestId: request.id,
          },
        });
      }

      const actor = getAdminActor(request);
      const updatedUsagePlan = await repository.updateUsagePlan(
        existingUsagePlan.id,
        {
          ...updateData,
          updatedBy: actor,
        },
      );

      return {
        data: mapUsagePlanReadModelToResponse(updatedUsagePlan),
      };
    },
  );
}

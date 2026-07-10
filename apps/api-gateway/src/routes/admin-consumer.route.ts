import type { FastifyInstance } from "fastify";
import { getAdminActor } from "../middlewares/admin-actor.js";

import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";
import {
  mapApiConsumerCreateRequestToCreateData,
  mapApiConsumerReadModelToResponse,
  mapApiConsumerUpdateRequestToUpdateData,
} from "../api-consumers/api-consumer-management.mapper.js";
import { createPrismaApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.repository.js";
import type { ApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.types.js";

export type AdminConsumerRouteOptions = {
  repository?: ApiConsumerManagementRepository;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
};

type ConsumerIdParams = {
  id: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Invalid API consumer";
}

export async function adminConsumerRoute(
  app: FastifyInstance,
  options: AdminConsumerRouteOptions = {},
): Promise<void> {
  const repository =
    options.repository ??
    createPrismaApiConsumerManagementRepository(gatewayPrisma);

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

  app.get(
    "/internal/admin/consumers",
    {
      preHandler: requireAdminApiKey,
    },
    async () => {
      const consumers = await repository.listConsumers();

      return {
        data: consumers.map(mapApiConsumerReadModelToResponse),
      };
    },
  );

  app.get<{ Params: ConsumerIdParams }>(
    "/internal/admin/consumers/:id",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const consumer = await repository.findConsumerById(request.params.id);

      if (!consumer) {
        return reply.status(404).send({
          error: {
            code: "API_CONSUMER_NOT_FOUND",
            message: "API consumer was not found",
            requestId: request.id,
          },
        });
      }

      return {
        data: mapApiConsumerReadModelToResponse(consumer),
      };
    },
  );

  app.post(
    "/internal/admin/consumers",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      let createData;

      try {
        createData = mapApiConsumerCreateRequestToCreateData(request.body);
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: "API_CONSUMER_INVALID",
            message: "API consumer is invalid",
            details: getErrorMessage(error),
            requestId: request.id,
          },
        });
      }

      const actor = getAdminActor(request);
      const createdConsumer = await repository.createConsumer({
        ...createData,
        createdBy: actor,
        updatedBy: actor,
      });

      return reply.status(201).send({
        data: mapApiConsumerReadModelToResponse(createdConsumer),
      });
    },
  );

  app.patch<{ Params: ConsumerIdParams }>(
    "/internal/admin/consumers/:id",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const existingConsumer = await repository.findConsumerById(
        request.params.id,
      );

      if (!existingConsumer) {
        return reply.status(404).send({
          error: {
            code: "API_CONSUMER_NOT_FOUND",
            message: "API consumer was not found",
            requestId: request.id,
          },
        });
      }

      let updateData;

      try {
        updateData = mapApiConsumerUpdateRequestToUpdateData(
          existingConsumer,
          request.body,
        );
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: "API_CONSUMER_INVALID",
            message: "API consumer is invalid",
            details: getErrorMessage(error),
            requestId: request.id,
          },
        });
      }

      const actor = getAdminActor(request);
      const updatedConsumer = await repository.updateConsumer(
        existingConsumer.id,
        {
          ...updateData,
          updatedBy: actor,
        },
      );

      return {
        data: mapApiConsumerReadModelToResponse(updatedConsumer),
      };
    },
  );
}

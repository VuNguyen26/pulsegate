import type { FastifyInstance, FastifyRequest } from "fastify";

import { gatewayPrisma } from "../database/gateway-prisma.js";
import { createAdminApiKeyAuthMiddleware } from "../middlewares/admin-api-key-auth.middleware.js";
import { createPrismaApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.repository.js";
import type { ApiConsumerManagementRepository } from "../api-consumers/api-consumer-management.types.js";
import { generateApiKey, type GeneratedApiKey } from "../api-keys/api-key-hashing.js";
import {
  mapApiKeyCreateRequestToCreateRequestData,
  mapApiKeyReadModelToResponse,
  mapIssuedApiKeyToResponse,
} from "../api-keys/api-key-management.mapper.js";
import { createPrismaApiKeyManagementRepository } from "../api-keys/api-key-management.repository.js";
import type { ApiKeyManagementRepository } from "../api-keys/api-key-management.types.js";

export type AdminApiKeyRouteOptions = {
  apiKeyRepository?: ApiKeyManagementRepository;
  consumerRepository?: ApiConsumerManagementRepository;
  adminApiKey?: string;
  adminApiKeyHeader?: string;
  generateApiKey?: () => GeneratedApiKey;
};

type ConsumerApiKeysParams = {
  consumerId: string;
};

type ApiKeyIdParams = {
  id: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Invalid API key";
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

export async function adminApiKeyRoute(
  app: FastifyInstance,
  options: AdminApiKeyRouteOptions = {},
): Promise<void> {
  const apiKeyRepository =
    options.apiKeyRepository ??
    createPrismaApiKeyManagementRepository(gatewayPrisma);

  const consumerRepository =
    options.consumerRepository ??
    createPrismaApiConsumerManagementRepository(gatewayPrisma);

  const generateKey = options.generateApiKey ?? generateApiKey;

  const requireAdminApiKey = createAdminApiKeyAuthMiddleware({
    apiKey: options.adminApiKey,
    headerName: options.adminApiKeyHeader,
  });

  app.get<{ Params: ConsumerApiKeysParams }>(
    "/internal/admin/consumers/:consumerId/api-keys",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const consumer = await consumerRepository.findConsumerById(
        request.params.consumerId,
      );

      if (!consumer) {
        return reply.status(404).send({
          error: {
            code: "API_CONSUMER_NOT_FOUND",
            message: "API consumer was not found",
            requestId: request.id,
          },
        });
      }

      const apiKeys = await apiKeyRepository.listApiKeysByConsumerId(
        request.params.consumerId,
      );

      return {
        data: apiKeys.map(mapApiKeyReadModelToResponse),
      };
    },
  );

  app.post<{ Params: ConsumerApiKeysParams }>(
    "/internal/admin/consumers/:consumerId/api-keys",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const consumer = await consumerRepository.findConsumerById(
        request.params.consumerId,
      );

      if (!consumer) {
        return reply.status(404).send({
          error: {
            code: "API_CONSUMER_NOT_FOUND",
            message: "API consumer was not found",
            requestId: request.id,
          },
        });
      }

      let createRequestData;

      try {
        createRequestData = mapApiKeyCreateRequestToCreateRequestData(
          request.body,
        );
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: "API_KEY_INVALID",
            message: "API key is invalid",
            details: getErrorMessage(error),
            requestId: request.id,
          },
        });
      }

      const actor = getAdminActor(request);
      const generatedApiKey = generateKey();

      const createdApiKey = await apiKeyRepository.createApiKey({
        consumerId: consumer.id,
        name: createRequestData.name,
        keyPrefix: generatedApiKey.keyPrefix,
        keyHash: generatedApiKey.keyHash,
        status: "ACTIVE",
        expiresAt: createRequestData.expiresAt,
        createdBy: actor,
      });

      return reply.status(201).send({
        data: mapIssuedApiKeyToResponse(
          createdApiKey,
          generatedApiKey.rawKey,
        ),
      });
    },
  );

  app.patch<{ Params: ApiKeyIdParams }>(
    "/internal/admin/api-keys/:id/revoke",
    {
      preHandler: requireAdminApiKey,
    },
    async (request, reply) => {
      const existingApiKey = await apiKeyRepository.findApiKeyById(
        request.params.id,
      );

      if (!existingApiKey) {
        return reply.status(404).send({
          error: {
            code: "API_KEY_NOT_FOUND",
            message: "API key was not found",
            requestId: request.id,
          },
        });
      }

      const actor = getAdminActor(request);
      const revokedApiKey = await apiKeyRepository.revokeApiKey(
        existingApiKey.id,
        actor,
      );

      return {
        data: mapApiKeyReadModelToResponse(revokedApiKey),
      };
    },
  );
}

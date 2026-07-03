import type { ApiKeyStatus, PrismaClient } from "../generated/prisma/index.js";
import type {
  ApiKeyCreateData,
  ApiKeyManagementRepository,
  ApiKeyReadModel,
} from "./api-key-management.types.js";

export function createPrismaApiKeyManagementRepository(
  prisma: PrismaClient,
): ApiKeyManagementRepository {
  return {
    listApiKeysByConsumerId: async (consumerId: string) => {
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          consumerId,
        },
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            name: "asc",
          },
        ],
      });

      return apiKeys as ApiKeyReadModel[];
    },

    findApiKeyById: async (id: string) => {
      const apiKey = await prisma.apiKey.findUnique({
        where: {
          id,
        },
      });

      return apiKey as ApiKeyReadModel | null;
    },

    createApiKey: async (data: ApiKeyCreateData) => {
      const apiKey = await prisma.apiKey.create({
        data: {
          consumerId: data.consumerId,
          name: data.name,
          keyPrefix: data.keyPrefix,
          keyHash: data.keyHash,
          status: data.status as ApiKeyStatus,
          expiresAt: data.expiresAt,
          createdBy: data.createdBy,
        },
      });

      return apiKey as ApiKeyReadModel;
    },

    revokeApiKey: async (id: string, actor: string) => {
      const apiKey = await prisma.apiKey.update({
        where: {
          id,
        },
        data: {
          status: "REVOKED",
          revokedAt: new Date(),
          revokedBy: actor,
        },
      });

      return apiKey as ApiKeyReadModel;
    },
  };
}

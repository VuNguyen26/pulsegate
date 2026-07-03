import type {
  ApiConsumerStatus,
  PrismaClient,
} from "../generated/prisma/index.js";
import type {
  ApiConsumerCreateData,
  ApiConsumerManagementRepository,
  ApiConsumerReadModel,
  ApiConsumerUpdateData,
} from "./api-consumer-management.types.js";

function mapApiConsumerDataToPrismaInput(
  data: ApiConsumerCreateData | ApiConsumerUpdateData,
) {
  return {
    name: data.name,
    description: data.description,
    status: data.status as ApiConsumerStatus,
    updatedBy: data.updatedBy,
  };
}

export function createPrismaApiConsumerManagementRepository(
  prisma: PrismaClient,
): ApiConsumerManagementRepository {
  return {
    listConsumers: async () => {
      const consumers = await prisma.apiConsumer.findMany({
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            name: "asc",
          },
        ],
      });

      return consumers as ApiConsumerReadModel[];
    },

    findConsumerById: async (id: string) => {
      const consumer = await prisma.apiConsumer.findUnique({
        where: {
          id,
        },
      });

      return consumer as ApiConsumerReadModel | null;
    },

    createConsumer: async (data: ApiConsumerCreateData) => {
      const consumer = await prisma.apiConsumer.create({
        data: {
          ...mapApiConsumerDataToPrismaInput(data),
          createdBy: data.createdBy,
        },
      });

      return consumer as ApiConsumerReadModel;
    },

    updateConsumer: async (id: string, data: ApiConsumerUpdateData) => {
      const consumer = await prisma.apiConsumer.update({
        where: {
          id,
        },
        data: mapApiConsumerDataToPrismaInput(data),
      });

      return consumer as ApiConsumerReadModel;
    },
  };
}

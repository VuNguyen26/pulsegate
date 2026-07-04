import type {
  PrismaClient,
  UsagePlanQuotaWindow,
} from "../generated/prisma/index.js";
import type {
  UsagePlanCreateData,
  UsagePlanManagementRepository,
  UsagePlanReadModel,
  UsagePlanUpdateData,
} from "./usage-plan-management.types.js";

function mapUsagePlanDataToPrismaInput(
  data: UsagePlanCreateData | UsagePlanUpdateData,
) {
  return {
    name: data.name,
    description: data.description,
    quotaLimit: data.quotaLimit,
    quotaWindow: data.quotaWindow as UsagePlanQuotaWindow,
    enabled: data.enabled,
    updatedBy: data.updatedBy,
  };
}

export function createPrismaUsagePlanManagementRepository(
  prisma: PrismaClient,
): UsagePlanManagementRepository {
  return {
    listUsagePlans: async () => {
      const usagePlans = await prisma.usagePlan.findMany({
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            name: "asc",
          },
        ],
      });

      return usagePlans as UsagePlanReadModel[];
    },

    findUsagePlanById: async (id: string) => {
      const usagePlan = await prisma.usagePlan.findUnique({
        where: {
          id,
        },
      });

      return usagePlan as UsagePlanReadModel | null;
    },

    createUsagePlan: async (data: UsagePlanCreateData) => {
      const usagePlan = await prisma.usagePlan.create({
        data: {
          ...mapUsagePlanDataToPrismaInput(data),
          createdBy: data.createdBy,
        },
      });

      return usagePlan as UsagePlanReadModel;
    },

    updateUsagePlan: async (id: string, data: UsagePlanUpdateData) => {
      const usagePlan = await prisma.usagePlan.update({
        where: {
          id,
        },
        data: mapUsagePlanDataToPrismaInput(data),
      });

      return usagePlan as UsagePlanReadModel;
    },
  };
}
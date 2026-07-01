import { PrismaClient } from "../generated/prisma/index.js";

export const gatewayPrisma = new PrismaClient();

export async function disconnectGatewayPrisma(): Promise<void> {
  await gatewayPrisma.$disconnect();
}
import { prisma } from "../database/prisma.js";

export type ProductResponse = {
  id: string;
  name: string;
  price: number;
};

export async function findProducts(): Promise<ProductResponse[]> {
  return prisma.product.findMany({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      name: true,
      price: true,
    },
  });
}
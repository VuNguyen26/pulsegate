import { Prisma, PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

type SeedGatewayRouteInput = {
  serviceName: string;
  gatewayPath: string;
  downstreamUrl: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  enabled: boolean;
  priority: number;

  requireApiKey: boolean;
  requireJwt: boolean;

  timeoutEnabled: boolean;
  timeoutMs: number;

  cacheEnabled: boolean;
  cacheTtlSeconds: number;

  rateLimitEnabled: boolean;
  rateLimitLimit: number;
  rateLimitWindowMs: number;

  requestTransformEnabled: boolean;
  requestAddHeaders: typeof Prisma.DbNull;
  requestRemoveHeaders: typeof Prisma.DbNull;

  responseTransformEnabled: boolean;
  responseAddHeaders: typeof Prisma.DbNull;
  responseRemoveHeaders: typeof Prisma.DbNull;

  retryEnabled: boolean;
  retryAttempts: number;
  retryOnStatuses: number[];
};

async function upsertActiveGatewayRoute(route: SeedGatewayRouteInput) {
  const existingRoute = await prisma.gatewayRoute.findFirst({
    where: {
      method: route.method,
      gatewayPath: route.gatewayPath,
      deletedAt: null,
    },
  });

  if (existingRoute) {
    return prisma.gatewayRoute.update({
      where: {
        id: existingRoute.id,
      },
      data: {
        ...route,
        updatedBy: "seed",
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  return prisma.gatewayRoute.create({
    data: {
      ...route,
      createdBy: "seed",
      updatedBy: "seed",
      deletedAt: null,
      deletedBy: null,
    },
  });
}

async function main() {
  await upsertActiveGatewayRoute({
    serviceName: "product-service",
    gatewayPath: "/api/products",
    downstreamUrl: "http://product-service:3001/products",
    method: "GET",
    enabled: true,
    priority: 100,

    requireApiKey: true,
    requireJwt: true,

    timeoutEnabled: true,
    timeoutMs: 3000,

    cacheEnabled: true,
    cacheTtlSeconds: 30,

    rateLimitEnabled: true,
    rateLimitLimit: 5,
    rateLimitWindowMs: 60000,

    requestTransformEnabled: false,
    requestAddHeaders: Prisma.DbNull,
    requestRemoveHeaders: Prisma.DbNull,

    responseTransformEnabled: false,
    responseAddHeaders: Prisma.DbNull,
    responseRemoveHeaders: Prisma.DbNull,

    retryEnabled: false,
    retryAttempts: 0,
    retryOnStatuses: [502, 503, 504],
  });

  await upsertActiveGatewayRoute({
    serviceName: "product-service",
    gatewayPath: "/api/product-service/health",
    downstreamUrl: "http://product-service:3001/health",
    method: "GET",
    enabled: true,
    priority: 200,

    requireApiKey: false,
    requireJwt: false,

    timeoutEnabled: true,
    timeoutMs: 3000,

    cacheEnabled: false,
    cacheTtlSeconds: 30,

    rateLimitEnabled: false,
    rateLimitLimit: 0,
    rateLimitWindowMs: 0,

    requestTransformEnabled: false,
    requestAddHeaders: Prisma.DbNull,
    requestRemoveHeaders: Prisma.DbNull,

    responseTransformEnabled: false,
    responseAddHeaders: Prisma.DbNull,
    responseRemoveHeaders: Prisma.DbNull,

    retryEnabled: false,
    retryAttempts: 0,
    retryOnStatuses: [502, 503, 504],
  });

  const routes = await prisma.gatewayRoute.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: [
      {
        priority: "asc",
      },
      {
        gatewayPath: "asc",
      },
    ],
  });

  console.log(`Seeded ${routes.length} active gateway route config(s).`);

  for (const route of routes) {
    console.log(
      `${route.method} ${route.gatewayPath} -> ${route.downstreamUrl} | enabled=${route.enabled}`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed gateway route configs.");
    console.error(error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
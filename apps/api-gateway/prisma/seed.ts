import { Prisma, PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.gatewayRoute.upsert({
    where: {
      gateway_routes_method_gateway_path_key: {
        method: "GET",
        gatewayPath: "/api/products",
      },
    },
    update: {
      serviceName: "product-service",
      downstreamUrl: "http://product-service:3001/products",
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
    },
    create: {
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
    },
  });

  await prisma.gatewayRoute.upsert({
    where: {
      gateway_routes_method_gateway_path_key: {
        method: "GET",
        gatewayPath: "/api/product-service/health",
      },
    },
    update: {
      serviceName: "product-service",
      downstreamUrl: "http://product-service:3001/health",
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
    },
    create: {
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
    },
  });

  const routes = await prisma.gatewayRoute.findMany({
    orderBy: [
      {
        priority: "asc",
      },
      {
        gatewayPath: "asc",
      },
    ],
  });

  console.log(`Seeded ${routes.length} gateway route config(s).`);

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
import type { FastifyInstance } from "fastify";

export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    return {
      service: "product-service",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });
}
import type { FastifyInstance } from "fastify";

export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    return {
      service: "api-gateway",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });
}
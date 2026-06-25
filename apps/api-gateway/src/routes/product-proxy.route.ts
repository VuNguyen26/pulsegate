import type { FastifyInstance } from "fastify";

import { env } from "../config/env.js";

export async function productProxyRoute(app: FastifyInstance): Promise<void> {
  app.get("/api/products", async (request, reply) => {
    const response = await fetch(`${env.PRODUCT_SERVICE_URL}/products`, {
      method: "GET",
      headers: {
        "x-request-id": request.id,
      },
    });

    if (!response.ok) {
      return reply.status(response.status).send({
        error: {
          message: "Product Service returned an error",
          requestId: request.id,
        },
      });
    }

    const data = await response.json();

    return reply.status(200).send(data);
  });
}
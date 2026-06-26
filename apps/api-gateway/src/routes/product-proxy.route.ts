import type { FastifyInstance } from "fastify";

import { env } from "../config/env.js";
import { DownstreamServiceError } from "../errors/downstream-service-error.js";

export async function productProxyRoute(app: FastifyInstance): Promise<void> {
  app.get("/api/products", async (request, reply) => {
    let response: Response;

    try {
      response = await fetch(`${env.PRODUCT_SERVICE_URL}/products`, {
        method: "GET",
        headers: {
          "x-request-id": request.id,
        },
      });
    } catch (error) {
      throw new DownstreamServiceError({
        code: "DOWNSTREAM_SERVICE_UNAVAILABLE",
        message: "Product Service is currently unavailable",
        service: "product-service",
        statusCode: 503,
        originalError: error,
      });
    }

    if (!response.ok) {
      throw new DownstreamServiceError({
        code: "DOWNSTREAM_HTTP_ERROR",
        message: "Product Service returned an error",
        service: "product-service",
        statusCode: response.status >= 500 ? 502 : response.status,
      });
    }

    try {
      const data = await response.json();

      return reply.status(200).send(data);
    } catch (error) {
      throw new DownstreamServiceError({
        code: "DOWNSTREAM_INVALID_RESPONSE",
        message: "Product Service returned an invalid response",
        service: "product-service",
        statusCode: 502,
        originalError: error,
      });
    }
  });
}
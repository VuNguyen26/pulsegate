import type { FastifyInstance } from "fastify";

import { env } from "../config/env.js";
import { DownstreamServiceError } from "../errors/downstream-service-error.js";

export async function productProxyRoute(app: FastifyInstance): Promise<void> {
  app.get("/api/products", async (request, reply) => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, env.DOWNSTREAM_REQUEST_TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(`${env.PRODUCT_SERVICE_URL}/products`, {
        method: "GET",
        headers: {
          "x-request-id": request.id,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new DownstreamServiceError({
          code: "DOWNSTREAM_TIMEOUT",
          message: "Product Service did not respond in time",
          service: "product-service",
          statusCode: 504,
          originalError: error,
        });
      }

      throw new DownstreamServiceError({
        code: "DOWNSTREAM_SERVICE_UNAVAILABLE",
        message: "Product Service is currently unavailable",
        service: "product-service",
        statusCode: 503,
        originalError: error,
      });
    } finally {
      clearTimeout(timeout);
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
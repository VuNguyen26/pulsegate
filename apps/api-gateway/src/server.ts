import Fastify from "fastify";
import { randomUUID } from "node:crypto";

const PRODUCT_SERVICE_URL = "http://127.0.0.1:3001";

const app = Fastify({
  logger: true,
  genReqId: (request) => {
    const requestId = request.headers["x-request-id"];

    if (typeof requestId === "string") {
      return requestId;
    }

    return randomUUID();
  },
});

app.addHook("onRequest", async (request, reply) => {
  reply.header("x-request-id", request.id);
});

app.get("/health", async () => {
  return {
    service: "api-gateway",
    status: "ok",
    timestamp: new Date().toISOString(),
  };
});

app.get("/api/products", async (request, reply) => {
  const response = await fetch(`${PRODUCT_SERVICE_URL}/products`, {
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

app.setNotFoundHandler((request, reply) => {
  return reply.status(404).send({
    error: {
      message: "Route not found",
      path: request.url,
      requestId: request.id,
    },
  });
});

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  return reply.status(500).send({
    error: {
      message: "Internal Server Error",
      requestId: request.id,
    },
  });
});

const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });

    app.log.info("API Gateway is running on port 3000");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();

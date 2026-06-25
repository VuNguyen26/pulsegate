import Fastify from "fastify";
import { randomUUID } from "node:crypto";

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

app.get("/health", async () => {
  return {
    service: "product-service",
    status: "ok",
    timestamp: new Date().toISOString(),
  };
});

app.get("/products", async () => {
  return {
    data: [
      {
        id: "prod_001",
        name: "Mechanical Keyboard",
        price: 120,
      },
      {
        id: "prod_002",
        name: "Gaming Mouse",
        price: 45,
      },
    ],
  };
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
      port: 3001,
      host: "0.0.0.0",
    });

    app.log.info("Product Service is running on port 3001");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();

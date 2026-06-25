import type { FastifyInstance } from "fastify";

export async function productRoute(app: FastifyInstance): Promise<void> {
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
}
import type { FastifyInstance } from "fastify";

import { findProducts } from "../products/product.repository.js";

export async function productRoute(app: FastifyInstance): Promise<void> {
  app.get("/products", async () => {
    const products = await findProducts();

    return {
      data: products,
    };
  });
}
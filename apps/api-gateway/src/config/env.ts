export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  HOST: process.env.HOST ?? "0.0.0.0",
  PRODUCT_SERVICE_URL:
    process.env.PRODUCT_SERVICE_URL ?? "http://127.0.0.1:3001",
};
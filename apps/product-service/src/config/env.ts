export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  HOST: process.env.HOST ?? "0.0.0.0",
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate",
};
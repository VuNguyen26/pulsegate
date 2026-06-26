function readNumberEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

export const env = {
  PORT: readNumberEnv("PORT", 3000),
  HOST: process.env.HOST ?? "0.0.0.0",
  PRODUCT_SERVICE_URL:
    process.env.PRODUCT_SERVICE_URL ?? "http://127.0.0.1:3001",
  DOWNSTREAM_REQUEST_TIMEOUT_MS: readNumberEnv(
    "DOWNSTREAM_REQUEST_TIMEOUT_MS",
    3000
  ),
};
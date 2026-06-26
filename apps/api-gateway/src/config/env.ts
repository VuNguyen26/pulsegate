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

function readCsvEnv(name: string, fallback: string[]): string[] {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const values = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) {
    return fallback;
  }

  return values;
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
  API_KEY_HEADER: process.env.API_KEY_HEADER ?? "x-api-key",
  API_KEYS: readCsvEnv("API_KEYS", ["dev-api-key"]),
};
export function readNumberEnv(name: string, fallback: number): number {
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

export function readCsvEnv(name: string, fallback: string[]): string[] {
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

export function readStringEnv(name: string, fallback: string): string {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const value = rawValue.trim();

  if (value.length === 0) {
    return fallback;
  }

  return value;
}

export const env = {
  PORT: readNumberEnv("PORT", 3000),
  HOST: readStringEnv("HOST", "0.0.0.0"),
  PRODUCT_SERVICE_URL: readStringEnv(
    "PRODUCT_SERVICE_URL",
    "http://127.0.0.1:3001"
  ),
  REDIS_URL: readStringEnv("REDIS_URL", "redis://localhost:6379"),
  DOWNSTREAM_REQUEST_TIMEOUT_MS: readNumberEnv(
    "DOWNSTREAM_REQUEST_TIMEOUT_MS",
    3000
  ),
  API_KEY_HEADER: readStringEnv("API_KEY_HEADER", "x-api-key"),
  API_KEYS: readCsvEnv("API_KEYS", ["dev-api-key"]),
  ADMIN_API_KEY_HEADER: readStringEnv(
    "ADMIN_API_KEY_HEADER",
    "x-admin-api-key"
  ),
  ADMIN_API_KEY: readStringEnv("ADMIN_API_KEY", "local-admin-key"),
  JWT_SECRET: readStringEnv(
    "JWT_SECRET",
    "local-dev-jwt-secret-change-me"
  ),
  JWT_ISSUER: readStringEnv("JWT_ISSUER", "pulsegate-api-gateway"),
  JWT_AUDIENCE: readStringEnv("JWT_AUDIENCE", "pulsegate-clients"),
  JWT_EXPIRES_IN_SECONDS: readNumberEnv("JWT_EXPIRES_IN_SECONDS", 900),
  PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS: readNumberEnv(
    "PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS",
    5
  ),
  PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS: readNumberEnv(
    "PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS",
    60_000
  ),
  MAX_REQUEST_BODY_BYTES: readNumberEnv("MAX_REQUEST_BODY_BYTES", 1_048_576),
};
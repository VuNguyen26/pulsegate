export const DEFAULT_ADMIN_API_KEY_HEADER =
  "x-admin-api-key";

export const DEFAULT_ADMIN_REQUEST_TIMEOUT_MS = 3_000;

export type DashboardAdminApiConfig = {
  gatewayBaseUrl: string;
  apiKeyHeader: string;
  readOnlyApiKey: string;
  requestTimeoutMs: number;
  accessMode: "read-only";
};

export type DashboardAdminApiConfigError = {
  code:
    | "ADMIN_DASHBOARD_CONFIG_MISSING"
    | "ADMIN_DASHBOARD_CONFIG_INVALID";
  message: string;
  field:
    | "PULSEGATE_GATEWAY_BASE_URL"
    | "ADMIN_READ_ONLY_API_KEY"
    | "ADMIN_API_KEY_HEADER"
    | "ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS";
};

export type DashboardAdminApiConfigResult =
  | {
      ok: true;
      config: DashboardAdminApiConfig;
    }
  | {
      ok: false;
      error: DashboardAdminApiConfigError;
    };

const HEADER_NAME_PATTERN =
  /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

function configError(
  code: DashboardAdminApiConfigError["code"],
  field: DashboardAdminApiConfigError["field"],
  message: string,
): DashboardAdminApiConfigResult {
  return {
    ok: false,
    error: {
      code,
      field,
      message,
    },
  };
}

export type DashboardEnvironment =
  Readonly<Record<string, string | undefined>>;

export function readDashboardAdminApiConfig(
  environment: DashboardEnvironment,
): DashboardAdminApiConfigResult {
  const rawBaseUrl =
    environment.PULSEGATE_GATEWAY_BASE_URL?.trim();

  if (!rawBaseUrl) {
    return configError(
      "ADMIN_DASHBOARD_CONFIG_MISSING",
      "PULSEGATE_GATEWAY_BASE_URL",
      "PulseGate Gateway base URL is required.",
    );
  }

  let parsedBaseUrl: URL;

  try {
    parsedBaseUrl = new URL(rawBaseUrl);
  } catch {
    return configError(
      "ADMIN_DASHBOARD_CONFIG_INVALID",
      "PULSEGATE_GATEWAY_BASE_URL",
      "PulseGate Gateway base URL must be a valid URL.",
    );
  }

  if (
    !["http:", "https:"].includes(parsedBaseUrl.protocol) ||
    parsedBaseUrl.username ||
    parsedBaseUrl.password ||
    (parsedBaseUrl.pathname !== "/" &&
      parsedBaseUrl.pathname !== "") ||
    parsedBaseUrl.search ||
    parsedBaseUrl.hash
  ) {
    return configError(
      "ADMIN_DASHBOARD_CONFIG_INVALID",
      "PULSEGATE_GATEWAY_BASE_URL",
      "PulseGate Gateway base URL must be an HTTP origin without credentials, path, query, or fragment.",
    );
  }

  const readOnlyApiKey =
    environment.ADMIN_READ_ONLY_API_KEY?.trim();

  if (!readOnlyApiKey) {
    return configError(
      "ADMIN_DASHBOARD_CONFIG_MISSING",
      "ADMIN_READ_ONLY_API_KEY",
      "Read-only Admin API credential is required.",
    );
  }

  const apiKeyHeader = (
    environment.ADMIN_API_KEY_HEADER ??
    DEFAULT_ADMIN_API_KEY_HEADER
  )
    .trim()
    .toLowerCase();

  if (!HEADER_NAME_PATTERN.test(apiKeyHeader)) {
    return configError(
      "ADMIN_DASHBOARD_CONFIG_INVALID",
      "ADMIN_API_KEY_HEADER",
      "Admin API key header name is invalid.",
    );
  }

  const rawTimeout =
    environment.ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS;
  const requestTimeoutMs = rawTimeout
    ? Number(rawTimeout)
    : DEFAULT_ADMIN_REQUEST_TIMEOUT_MS;

  if (
    !Number.isInteger(requestTimeoutMs) ||
    requestTimeoutMs < 100 ||
    requestTimeoutMs > 30_000
  ) {
    return configError(
      "ADMIN_DASHBOARD_CONFIG_INVALID",
      "ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS",
      "Admin API request timeout must be an integer from 100 to 30000 milliseconds.",
    );
  }

  return {
    ok: true,
    config: {
      gatewayBaseUrl: parsedBaseUrl.origin,
      apiKeyHeader,
      readOnlyApiKey,
      requestTimeoutMs,
      accessMode: "read-only",
    },
  };
}
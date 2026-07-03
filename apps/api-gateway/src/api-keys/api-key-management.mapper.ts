import type {
  ApiKeyCreateRequestData,
  ApiKeyReadModel,
  ApiKeyResponse,
  IssuedApiKeyResponse,
} from "./api-key-management.types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRequestBodyObject(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) {
    throw new Error("request body must be an object");
  }

  return body;
}

function readRequiredString(
  body: Record<string, unknown>,
  fieldName: string,
): string {
  const value = body[fieldName];

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  return trimmedValue;
}

function readOptionalDate(
  body: Record<string, unknown>,
  fieldName: string,
): Date | null {
  if (!(fieldName in body)) {
    return null;
  }

  const value = body[fieldName];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be an ISO datetime string or null`);
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedDate = new Date(trimmedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO datetime string`);
  }

  return parsedDate;
}

function mapNullableDateToIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export function mapApiKeyCreateRequestToCreateRequestData(
  body: unknown,
): ApiKeyCreateRequestData {
  const requestBody = assertRequestBodyObject(body);

  return {
    name: readRequiredString(requestBody, "name"),
    expiresAt: readOptionalDate(requestBody, "expiresAt"),
  };
}

export function mapApiKeyReadModelToResponse(
  apiKey: ApiKeyReadModel,
): ApiKeyResponse {
  return {
    id: apiKey.id,
    consumerId: apiKey.consumerId,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    status: apiKey.status,
    expiresAt: mapNullableDateToIso(apiKey.expiresAt),
    lastUsedAt: mapNullableDateToIso(apiKey.lastUsedAt),
    createdAt: apiKey.createdAt.toISOString(),
    updatedAt: apiKey.updatedAt.toISOString(),
    createdBy: apiKey.createdBy ?? null,
    revokedAt: mapNullableDateToIso(apiKey.revokedAt),
    revokedBy: apiKey.revokedBy ?? null,
  };
}

export function mapIssuedApiKeyToResponse(
  apiKey: ApiKeyReadModel,
  rawKey: string,
): IssuedApiKeyResponse {
  return {
    ...mapApiKeyReadModelToResponse(apiKey),
    rawKey,
  };
}

import type {
  ApiConsumerCreateData,
  ApiConsumerReadModel,
  ApiConsumerResponse,
  ApiConsumerStatusValue,
  ApiConsumerUpdateData,
} from "./api-consumer-management.types.js";

const VALID_CONSUMER_STATUSES: ApiConsumerStatusValue[] = [
  "ACTIVE",
  "DISABLED",
];

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

function readOptionalString(
  body: Record<string, unknown>,
  fieldName: string,
  fallback: string,
): string {
  if (!(fieldName in body)) {
    return fallback;
  }

  return readRequiredString(body, fieldName);
}

function readOptionalNullableString(
  body: Record<string, unknown>,
  fieldName: string,
  fallback: string | null,
): string | null {
  if (!(fieldName in body)) {
    return fallback;
  }

  const value = body[fieldName];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string or null`);
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function readOptionalStatus(
  body: Record<string, unknown>,
  fieldName: string,
  fallback: ApiConsumerStatusValue,
): ApiConsumerStatusValue {
  if (!(fieldName in body)) {
    return fallback;
  }

  const value = body[fieldName];

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be one of: ACTIVE, DISABLED`);
  }

  const normalizedValue = value.trim().toUpperCase();

  if (
    !VALID_CONSUMER_STATUSES.includes(
      normalizedValue as ApiConsumerStatusValue,
    )
  ) {
    throw new Error(`${fieldName} must be one of: ACTIVE, DISABLED`);
  }

  return normalizedValue as ApiConsumerStatusValue;
}

export function mapApiConsumerCreateRequestToCreateData(
  body: unknown,
): ApiConsumerCreateData {
  const requestBody = assertRequestBodyObject(body);

  return {
    name: readRequiredString(requestBody, "name"),
    description: readOptionalNullableString(requestBody, "description", null),
    status: readOptionalStatus(requestBody, "status", "ACTIVE"),
  };
}

export function mapApiConsumerUpdateRequestToUpdateData(
  existingConsumer: ApiConsumerReadModel,
  body: unknown,
): ApiConsumerUpdateData {
  const requestBody = assertRequestBodyObject(body);

  return {
    name: readOptionalString(requestBody, "name", existingConsumer.name),
    description: readOptionalNullableString(
      requestBody,
      "description",
      existingConsumer.description,
    ),
    status: readOptionalStatus(
      requestBody,
      "status",
      existingConsumer.status,
    ),
  };
}

export function mapApiConsumerReadModelToResponse(
  consumer: ApiConsumerReadModel,
): ApiConsumerResponse {
  return {
    id: consumer.id,
    name: consumer.name,
    description: consumer.description,
    status: consumer.status,
    createdAt: consumer.createdAt.toISOString(),
    updatedAt: consumer.updatedAt.toISOString(),
    createdBy: consumer.createdBy ?? null,
    updatedBy: consumer.updatedBy ?? null,
  };
}

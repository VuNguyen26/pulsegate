import type {
  UsagePlanCreateData,
  UsagePlanQuotaWindowValue,
  UsagePlanReadModel,
  UsagePlanResponse,
  UsagePlanUpdateData,
} from "./usage-plan-management.types.js";

const VALID_QUOTA_WINDOWS: UsagePlanQuotaWindowValue[] = ["DAILY", "MONTHLY"];

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

function readRequiredPositiveInteger(
  body: Record<string, unknown>,
  fieldName: string,
): number {
  const value = body[fieldName];

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return value;
}

function readOptionalPositiveInteger(
  body: Record<string, unknown>,
  fieldName: string,
  fallback: number,
): number {
  if (!(fieldName in body)) {
    return fallback;
  }

  return readRequiredPositiveInteger(body, fieldName);
}

function readRequiredQuotaWindow(
  body: Record<string, unknown>,
  fieldName: string,
): UsagePlanQuotaWindowValue {
  const value = body[fieldName];

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be one of: DAILY, MONTHLY`);
  }

  const normalizedValue = value.trim().toUpperCase();

  if (
    !VALID_QUOTA_WINDOWS.includes(
      normalizedValue as UsagePlanQuotaWindowValue,
    )
  ) {
    throw new Error(`${fieldName} must be one of: DAILY, MONTHLY`);
  }

  return normalizedValue as UsagePlanQuotaWindowValue;
}

function readOptionalQuotaWindow(
  body: Record<string, unknown>,
  fieldName: string,
  fallback: UsagePlanQuotaWindowValue,
): UsagePlanQuotaWindowValue {
  if (!(fieldName in body)) {
    return fallback;
  }

  return readRequiredQuotaWindow(body, fieldName);
}

function readOptionalBoolean(
  body: Record<string, unknown>,
  fieldName: string,
  fallback: boolean,
): boolean {
  if (!(fieldName in body)) {
    return fallback;
  }

  const value = body[fieldName];

  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be a boolean`);
  }

  return value;
}

export function mapUsagePlanCreateRequestToCreateData(
  body: unknown,
): UsagePlanCreateData {
  const requestBody = assertRequestBodyObject(body);

  return {
    name: readRequiredString(requestBody, "name"),
    description: readOptionalNullableString(requestBody, "description", null),
    quotaLimit: readRequiredPositiveInteger(requestBody, "quotaLimit"),
    quotaWindow: readRequiredQuotaWindow(requestBody, "quotaWindow"),
    enabled: readOptionalBoolean(requestBody, "enabled", true),
  };
}

export function mapUsagePlanUpdateRequestToUpdateData(
  existingPlan: UsagePlanReadModel,
  body: unknown,
): UsagePlanUpdateData {
  const requestBody = assertRequestBodyObject(body);

  return {
    name: readOptionalString(requestBody, "name", existingPlan.name),
    description: readOptionalNullableString(
      requestBody,
      "description",
      existingPlan.description,
    ),
    quotaLimit: readOptionalPositiveInteger(
      requestBody,
      "quotaLimit",
      existingPlan.quotaLimit,
    ),
    quotaWindow: readOptionalQuotaWindow(
      requestBody,
      "quotaWindow",
      existingPlan.quotaWindow,
    ),
    enabled: readOptionalBoolean(requestBody, "enabled", existingPlan.enabled),
  };
}

export function mapUsagePlanReadModelToResponse(
  usagePlan: UsagePlanReadModel,
): UsagePlanResponse {
  return {
    id: usagePlan.id,
    name: usagePlan.name,
    description: usagePlan.description,
    quotaLimit: usagePlan.quotaLimit,
    quotaWindow: usagePlan.quotaWindow,
    enabled: usagePlan.enabled,
    createdAt: usagePlan.createdAt.toISOString(),
    updatedAt: usagePlan.updatedAt.toISOString(),
    createdBy: usagePlan.createdBy ?? null,
    updatedBy: usagePlan.updatedBy ?? null,
  };
}
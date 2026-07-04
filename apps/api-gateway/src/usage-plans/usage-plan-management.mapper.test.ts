import { describe, expect, it } from "vitest";

import {
  mapUsagePlanCreateRequestToCreateData,
  mapUsagePlanReadModelToResponse,
  mapUsagePlanUpdateRequestToUpdateData,
} from "./usage-plan-management.mapper.js";
import type { UsagePlanReadModel } from "./usage-plan-management.types.js";

const createdAt = new Date("2026-07-04T00:00:00.000Z");
const updatedAt = new Date("2026-07-04T01:00:00.000Z");

const existingUsagePlan: UsagePlanReadModel = {
  id: "plan_starter",
  name: "Starter",
  description: "Starter plan",
  quotaLimit: 1000,
  quotaWindow: "DAILY",
  enabled: true,
  createdAt,
  updatedAt,
  createdBy: "admin",
  updatedBy: "admin",
};

describe("usage plan management mapper", () => {
  it("should map create request with default enabled flag", () => {
    expect(
      mapUsagePlanCreateRequestToCreateData({
        name: "  Starter  ",
        description: "  Starter daily quota  ",
        quotaLimit: 1000,
        quotaWindow: "daily",
      }),
    ).toEqual({
      name: "Starter",
      description: "Starter daily quota",
      quotaLimit: 1000,
      quotaWindow: "DAILY",
      enabled: true,
    });
  });

  it("should map create request with monthly window and disabled flag", () => {
    expect(
      mapUsagePlanCreateRequestToCreateData({
        name: "Enterprise",
        description: null,
        quotaLimit: 100000,
        quotaWindow: "MONTHLY",
        enabled: false,
      }),
    ).toEqual({
      name: "Enterprise",
      description: null,
      quotaLimit: 100000,
      quotaWindow: "MONTHLY",
      enabled: false,
    });
  });

  it("should reject create request when body is not an object", () => {
    expect(() => mapUsagePlanCreateRequestToCreateData(null)).toThrow(
      "request body must be an object",
    );
  });

  it("should reject create request when name is missing", () => {
    expect(() =>
      mapUsagePlanCreateRequestToCreateData({
        quotaLimit: 1000,
        quotaWindow: "DAILY",
      }),
    ).toThrow("name must be a non-empty string");
  });

  it("should reject create request when quotaLimit is invalid", () => {
    expect(() =>
      mapUsagePlanCreateRequestToCreateData({
        name: "Starter",
        quotaLimit: 0,
        quotaWindow: "DAILY",
      }),
    ).toThrow("quotaLimit must be a positive integer");
  });

  it("should reject create request when quotaWindow is invalid", () => {
    expect(() =>
      mapUsagePlanCreateRequestToCreateData({
        name: "Starter",
        quotaLimit: 1000,
        quotaWindow: "YEARLY",
      }),
    ).toThrow("quotaWindow must be one of: DAILY, MONTHLY");
  });

  it("should merge update request with existing usage plan", () => {
    expect(
      mapUsagePlanUpdateRequestToUpdateData(existingUsagePlan, {}),
    ).toEqual({
      name: "Starter",
      description: "Starter plan",
      quotaLimit: 1000,
      quotaWindow: "DAILY",
      enabled: true,
    });
  });

  it("should map update request with nullable description and disabled flag", () => {
    expect(
      mapUsagePlanUpdateRequestToUpdateData(existingUsagePlan, {
        name: "  Starter v2  ",
        description: null,
        quotaLimit: 2000,
        quotaWindow: "monthly",
        enabled: false,
      }),
    ).toEqual({
      name: "Starter v2",
      description: null,
      quotaLimit: 2000,
      quotaWindow: "MONTHLY",
      enabled: false,
    });
  });

  it("should reject update request when enabled is invalid", () => {
    expect(() =>
      mapUsagePlanUpdateRequestToUpdateData(existingUsagePlan, {
        enabled: "false",
      }),
    ).toThrow("enabled must be a boolean");
  });

  it("should map read model to response", () => {
    expect(mapUsagePlanReadModelToResponse(existingUsagePlan)).toEqual({
      id: "plan_starter",
      name: "Starter",
      description: "Starter plan",
      quotaLimit: 1000,
      quotaWindow: "DAILY",
      enabled: true,
      createdAt: "2026-07-04T00:00:00.000Z",
      updatedAt: "2026-07-04T01:00:00.000Z",
      createdBy: "admin",
      updatedBy: "admin",
    });
  });

  it("should use null audit fields when read model audit fields are missing", () => {
    expect(
      mapUsagePlanReadModelToResponse({
        ...existingUsagePlan,
        createdBy: undefined,
        updatedBy: undefined,
      }),
    ).toMatchObject({
      createdBy: null,
      updatedBy: null,
    });
  });
});
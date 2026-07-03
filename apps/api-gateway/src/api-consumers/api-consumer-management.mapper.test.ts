import { describe, expect, it } from "vitest";

import {
  mapApiConsumerCreateRequestToCreateData,
  mapApiConsumerReadModelToResponse,
  mapApiConsumerUpdateRequestToUpdateData,
} from "./api-consumer-management.mapper.js";
import type { ApiConsumerReadModel } from "./api-consumer-management.types.js";

const createdAt = new Date("2026-07-03T00:00:00.000Z");
const updatedAt = new Date("2026-07-03T01:00:00.000Z");

const existingConsumer: ApiConsumerReadModel = {
  id: "consumer_1",
  name: "Mobile App",
  description: "Existing mobile consumer",
  status: "ACTIVE",
  createdAt,
  updatedAt,
  createdBy: "admin",
  updatedBy: "admin",
};

describe("api consumer management mapper", () => {
  it("should map create request with default active status", () => {
    expect(
      mapApiConsumerCreateRequestToCreateData({
        name: "  Partner App  ",
        description: "  External partner integration  ",
      }),
    ).toEqual({
      name: "Partner App",
      description: "External partner integration",
      status: "ACTIVE",
    });
  });

  it("should map create request with disabled status", () => {
    expect(
      mapApiConsumerCreateRequestToCreateData({
        name: "Internal Tool",
        status: "disabled",
      }),
    ).toEqual({
      name: "Internal Tool",
      description: null,
      status: "DISABLED",
    });
  });

  it("should reject create request when body is not an object", () => {
    expect(() => mapApiConsumerCreateRequestToCreateData(null)).toThrow(
      "request body must be an object",
    );
  });

  it("should reject create request when name is missing", () => {
    expect(() => mapApiConsumerCreateRequestToCreateData({})).toThrow(
      "name must be a non-empty string",
    );
  });

  it("should reject create request when status is invalid", () => {
    expect(() =>
      mapApiConsumerCreateRequestToCreateData({
        name: "Partner App",
        status: "DELETED",
      }),
    ).toThrow("status must be one of: ACTIVE, DISABLED");
  });

  it("should merge update request with existing consumer", () => {
    expect(mapApiConsumerUpdateRequestToUpdateData(existingConsumer, {})).toEqual({
      name: "Mobile App",
      description: "Existing mobile consumer",
      status: "ACTIVE",
    });
  });

  it("should map update request with nullable description and disabled status", () => {
    expect(
      mapApiConsumerUpdateRequestToUpdateData(existingConsumer, {
        name: "  Mobile App v2  ",
        description: null,
        status: "DISABLED",
      }),
    ).toEqual({
      name: "Mobile App v2",
      description: null,
      status: "DISABLED",
    });
  });

  it("should reject update request when name is empty", () => {
    expect(() =>
      mapApiConsumerUpdateRequestToUpdateData(existingConsumer, {
        name: "   ",
      }),
    ).toThrow("name must be a non-empty string");
  });

  it("should map read model to response", () => {
    expect(mapApiConsumerReadModelToResponse(existingConsumer)).toEqual({
      id: "consumer_1",
      name: "Mobile App",
      description: "Existing mobile consumer",
      status: "ACTIVE",
      createdAt: "2026-07-03T00:00:00.000Z",
      updatedAt: "2026-07-03T01:00:00.000Z",
      createdBy: "admin",
      updatedBy: "admin",
    });
  });

  it("should use null audit fields when read model audit fields are missing", () => {
    expect(
      mapApiConsumerReadModelToResponse({
        ...existingConsumer,
        createdBy: undefined,
        updatedBy: undefined,
      }),
    ).toMatchObject({
      createdBy: null,
      updatedBy: null,
    });
  });
});

import type { FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_ACTOR,
  MAX_ADMIN_ACTOR_LENGTH,
  getAdminActor,
} from "./admin-actor.js";

function createRequest(
  actorHeader?: string | string[],
): Pick<FastifyRequest, "headers"> {
  return {
    headers: {
      ...(actorHeader === undefined
        ? {}
        : {
            "x-admin-actor": actorHeader,
          }),
    },
  };
}

describe("getAdminActor", () => {
  it("should use the authenticated admin key label when the actor header is missing", () => {
    expect(getAdminActor(createRequest())).toBe(
      DEFAULT_ADMIN_ACTOR,
    );
  });

  it("should trim and return a valid actor header", () => {
    expect(
      getAdminActor(createRequest("  operator@example.com  ")),
    ).toBe("operator@example.com");
  });

  it("should accept a single-value actor header array", () => {
    expect(
      getAdminActor(createRequest(["release-bot"])),
    ).toBe("release-bot");
  });

  it("should reject an ambiguous multi-value actor header", () => {
    expect(
      getAdminActor(
        createRequest(["first-operator", "second-operator"]),
      ),
    ).toBe(DEFAULT_ADMIN_ACTOR);
  });

  it("should reject a blank actor header", () => {
    expect(getAdminActor(createRequest("   "))).toBe(
      DEFAULT_ADMIN_ACTOR,
    );
  });

  it("should reject actor values containing unsafe characters", () => {
    expect(
      getAdminActor(createRequest("operator\nforged-entry")),
    ).toBe(DEFAULT_ADMIN_ACTOR);

    expect(
      getAdminActor(createRequest("operator name")),
    ).toBe(DEFAULT_ADMIN_ACTOR);
  });

  it("should reject actor values above the maximum length", () => {
    expect(
      getAdminActor(
        createRequest(
          "a".repeat(MAX_ADMIN_ACTOR_LENGTH + 1),
        ),
      ),
    ).toBe(DEFAULT_ADMIN_ACTOR);
  });

  it("should accept an actor at the maximum length", () => {
    const actor = "a".repeat(MAX_ADMIN_ACTOR_LENGTH);

    expect(getAdminActor(createRequest(actor))).toBe(actor);
  });
});
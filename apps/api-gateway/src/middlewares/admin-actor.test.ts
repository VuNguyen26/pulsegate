import type { FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_ACTOR,
  READ_ONLY_ADMIN_ACTOR,
  getAdminActor,
  getAdminAuthContext,
  setAdminAuthContext,
} from "./admin-actor.js";

function createRequest(
  actorHeader?: string | string[],
): FastifyRequest {
  return {
    headers:
      actorHeader === undefined
        ? {}
        : {
            "x-admin-actor": actorHeader,
          },
  } as unknown as FastifyRequest;
}

describe("admin authentication context", () => {
  it("uses the bounded default actor without trusted authentication context", () => {
    expect(getAdminActor(createRequest())).toBe(
      DEFAULT_ADMIN_ACTOR,
    );
  });

  it("ignores a caller-controlled admin actor header", () => {
    expect(
      getAdminActor(
        createRequest("forged-operator@example.com"),
      ),
    ).toBe(DEFAULT_ADMIN_ACTOR);
  });

  it("derives the full-access actor from trusted authentication context", () => {
    const request = createRequest("forged-admin");

    setAdminAuthContext(request, "full-access");

    expect(getAdminAuthContext(request)).toEqual({
      accessMode: "full-access",
      actor: DEFAULT_ADMIN_ACTOR,
    });

    expect(getAdminActor(request)).toBe(
      DEFAULT_ADMIN_ACTOR,
    );
  });

  it("derives the read-only actor from trusted authentication context", () => {
    const request = createRequest("forged-admin");

    setAdminAuthContext(request, "read-only");

    expect(getAdminAuthContext(request)).toEqual({
      accessMode: "read-only",
      actor: READ_ONLY_ADMIN_ACTOR,
    });

    expect(getAdminActor(request)).toBe(
      READ_ONLY_ADMIN_ACTOR,
    );
  });
});

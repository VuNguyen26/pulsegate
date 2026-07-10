import type { FastifyRequest } from "fastify";

export const DEFAULT_ADMIN_ACTOR = "admin-api-key";
export const MAX_ADMIN_ACTOR_LENGTH = 64;

const ADMIN_ACTOR_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:@-]*$/;

type AdminActorRequest = Pick<FastifyRequest, "headers">;

function getSingleActorHeader(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length === 1) {
    return value[0];
  }

  return undefined;
}

export function getAdminActor(
  request: AdminActorRequest,
): string {
  const actorHeader = getSingleActorHeader(
    request.headers["x-admin-actor"],
  );
  const actor = actorHeader?.trim();

  if (
    !actor ||
    actor.length > MAX_ADMIN_ACTOR_LENGTH ||
    !ADMIN_ACTOR_PATTERN.test(actor)
  ) {
    return DEFAULT_ADMIN_ACTOR;
  }

  return actor;
}
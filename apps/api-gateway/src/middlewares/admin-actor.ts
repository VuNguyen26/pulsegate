import type { FastifyRequest } from "fastify";

export const DEFAULT_ADMIN_ACTOR = "admin-api-key";
export const READ_ONLY_ADMIN_ACTOR =
  "admin-read-only-api-key";

export type AdminAccessMode =
  | "full-access"
  | "read-only";

export type AdminAuthContext = {
  readonly accessMode: AdminAccessMode;
  readonly actor: string;
};

const adminAuthContexts =
  new WeakMap<FastifyRequest, AdminAuthContext>();

export function setAdminAuthContext(
  request: FastifyRequest,
  accessMode: AdminAccessMode,
): void {
  const actor =
    accessMode === "full-access"
      ? DEFAULT_ADMIN_ACTOR
      : READ_ONLY_ADMIN_ACTOR;

  adminAuthContexts.set(
    request,
    Object.freeze({
      accessMode,
      actor,
    }),
  );
}

export function getAdminAuthContext(
  request: FastifyRequest,
): AdminAuthContext | undefined {
  return adminAuthContexts.get(request);
}

export function getAdminActor(
  request: FastifyRequest,
): string {
  return (
    getAdminAuthContext(request)?.actor ??
    DEFAULT_ADMIN_ACTOR
  );
}

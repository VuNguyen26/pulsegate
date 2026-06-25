import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";

export function generateRequestId(request: IncomingMessage): string {
  const requestId = request.headers["x-request-id"];

  if (typeof requestId === "string" && requestId.trim().length > 0) {
    return requestId;
  }

  if (Array.isArray(requestId) && requestId.length > 0) {
    return requestId[0];
  }

  return randomUUID();
}
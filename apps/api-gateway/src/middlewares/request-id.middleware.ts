import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";

const REQUEST_ID_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function readBoundedRequestId(
  value: string | string[] | undefined,
): string | undefined {
  const requestId = Array.isArray(value) ? value[0] : value;

  return typeof requestId === "string" &&
    REQUEST_ID_PATTERN.test(requestId)
    ? requestId
    : undefined;
}

export function generateRequestId(request: IncomingMessage): string {
  return readBoundedRequestId(
    request.headers["x-request-id"],
  ) ?? randomUUID();
}
import type { FastifyReply } from "fastify";

export const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy":
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
} as const;

export function setSecurityHeaders(reply: FastifyReply): void {
  for (const [headerName, headerValue] of Object.entries(securityHeaders)) {
    reply.header(headerName, headerValue);
  }
}

export async function securityHeadersMiddleware(
  _request: unknown,
  reply: FastifyReply
): Promise<void> {
  setSecurityHeaders(reply);
}
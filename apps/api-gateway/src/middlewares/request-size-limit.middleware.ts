import type { FastifyReply, FastifyRequest } from "fastify";

export type RequestSizeLimitOptions = {
  maxBodyBytes: number;
};

export function parseContentLength(
  contentLength: string | undefined
): number | undefined {
  if (!contentLength) {
    return undefined;
  }

  const parsedValue = Number(contentLength);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return undefined;
  }

  return parsedValue;
}

export function createRequestSizeLimitMiddleware(
  options: RequestSizeLimitOptions
) {
  if (!Number.isFinite(options.maxBodyBytes) || options.maxBodyBytes <= 0) {
    throw new Error("maxBodyBytes must be greater than 0");
  }

  return async function requestSizeLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const contentLength = parseContentLength(request.headers["content-length"]);

    if (contentLength === undefined) {
      return;
    }

    if (contentLength <= options.maxBodyBytes) {
      return;
    }

    reply.status(413).send({
      error: {
        code: "REQUEST_BODY_TOO_LARGE",
        message: "Request body is too large",
        requestId: request.id,
      },
    });
  };
}
export type DownstreamServiceErrorCode =
  | "DOWNSTREAM_SERVICE_UNAVAILABLE"
  | "DOWNSTREAM_TIMEOUT"
  | "DOWNSTREAM_HTTP_ERROR"
  | "DOWNSTREAM_INVALID_RESPONSE";

type DownstreamServiceErrorParams = {
  code: DownstreamServiceErrorCode;
  message: string;
  service: string;
  statusCode: number;
  originalError?: unknown;
};

export class DownstreamServiceError extends Error {
  public readonly code: DownstreamServiceErrorCode;
  public readonly service: string;
  public readonly statusCode: number;
  public readonly originalError?: unknown;

  constructor(params: DownstreamServiceErrorParams) {
    super(params.message);

    this.name = "DownstreamServiceError";
    this.code = params.code;
    this.service = params.service;
    this.statusCode = params.statusCode;
    this.originalError = params.originalError;
  }
}

export function isDownstreamServiceError(
  error: unknown
): error is DownstreamServiceError {
  return error instanceof DownstreamServiceError;
}
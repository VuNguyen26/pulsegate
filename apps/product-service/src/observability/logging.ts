export function buildProductErrorLogPayload(
  requestId: string,
) {
  return {
    event: "product_request_failed" as const,
    requestId,
    errorCode: "INTERNAL_SERVER_ERROR" as const,
  };
}
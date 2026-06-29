import type { RouteHeaderTransformPolicy } from "./route-policy.types.js";

export type ResponseHeaders = Record<string, string>;

function findHeaderKey(headers: ResponseHeaders, targetHeaderName: string): string | undefined {
  const normalizedTargetHeaderName = targetHeaderName.toLowerCase();

  return Object.keys(headers).find(
    (headerName) => headerName.toLowerCase() === normalizedTargetHeaderName,
  );
}

export function applyResponseHeaderTransform(
  headers: ResponseHeaders,
  policy: RouteHeaderTransformPolicy,
): ResponseHeaders {
  const transformedHeaders: ResponseHeaders = {
    ...headers,
  };

  if (!policy.enabled) {
    return transformedHeaders;
  }

  for (const headerName of policy.removeHeaders ?? []) {
    const existingHeaderKey = findHeaderKey(transformedHeaders, headerName);

    if (existingHeaderKey) {
      delete transformedHeaders[existingHeaderKey];
    }
  }

  for (const [headerName, headerValue] of Object.entries(policy.addHeaders ?? {})) {
    transformedHeaders[headerName] = headerValue;
  }

  return transformedHeaders;
}
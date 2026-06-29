import type { RouteHeaderTransformPolicy } from "./route-policy.types.js";

export type RequestHeaders = Record<string, string>;

function findHeaderKey(headers: RequestHeaders, targetHeaderName: string): string | undefined {
  const normalizedTargetHeaderName = targetHeaderName.toLowerCase();

  return Object.keys(headers).find(
    (headerName) => headerName.toLowerCase() === normalizedTargetHeaderName,
  );
}

export function applyRequestHeaderTransform(
  headers: RequestHeaders,
  policy: RouteHeaderTransformPolicy,
): RequestHeaders {
  const transformedHeaders: RequestHeaders = {
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
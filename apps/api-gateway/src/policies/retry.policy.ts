import type { RouteRetryPolicy } from "./route-policy.types.js";

export type ExecuteWithRetryOptions<T> = {
  method: string;
  policy: RouteRetryPolicy;
  operation: () => Promise<T>;
  shouldRetryResult?: (result: T) => boolean;
  shouldRetryError?: (error: unknown) => boolean;
};

export function isRetryableHttpMethod(method: string): boolean {
  return method.toUpperCase() === "GET";
}

export function shouldRetryStatus(
  policy: RouteRetryPolicy,
  statusCode: number,
): boolean {
  return policy.retryOnStatuses.includes(statusCode);
}

export async function executeWithRetry<T>(
  options: ExecuteWithRetryOptions<T>,
): Promise<T> {
  const isRetryEnabled =
    options.policy.enabled &&
    options.policy.attempts > 0 &&
    isRetryableHttpMethod(options.method);

  const maxRetries = isRetryEnabled ? options.policy.attempts : 0;

  let retryCount = 0;

  while (true) {
    try {
      const result = await options.operation();

      const shouldRetryResult =
        retryCount < maxRetries && options.shouldRetryResult?.(result) === true;

      if (shouldRetryResult) {
        retryCount += 1;
        continue;
      }

      return result;
    } catch (error) {
      const shouldRetryError =
        retryCount < maxRetries && options.shouldRetryError?.(error) === true;

      if (shouldRetryError) {
        retryCount += 1;
        continue;
      }

      throw error;
    }
  }
}
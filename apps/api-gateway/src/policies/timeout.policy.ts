import type { RouteTimeoutPolicy } from "./route-policy.types.js";

export type DownstreamTimeout = {
  signal?: AbortSignal;
  cleanup: () => void;
};

export function createDownstreamTimeout(
  policy: RouteTimeoutPolicy,
): DownstreamTimeout {
  if (!policy.enabled) {
    return {
      signal: undefined,
      cleanup: () => undefined,
    };
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, policy.timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
    },
  };
}
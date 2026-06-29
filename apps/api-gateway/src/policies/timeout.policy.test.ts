import { afterEach, describe, expect, it, vi } from "vitest";

import { createDownstreamTimeout } from "./timeout.policy.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("createDownstreamTimeout", () => {
  it("should not create an abort signal when timeout policy is disabled", () => {
    const downstreamTimeout = createDownstreamTimeout({
      enabled: false,
      timeoutMs: 1000,
    });

    expect(downstreamTimeout.signal).toBeUndefined();
    expect(() => downstreamTimeout.cleanup()).not.toThrow();
  });

  it("should abort the signal after the configured timeout", () => {
    vi.useFakeTimers();

    const downstreamTimeout = createDownstreamTimeout({
      enabled: true,
      timeoutMs: 1000,
    });

    expect(downstreamTimeout.signal?.aborted).toBe(false);

    vi.advanceTimersByTime(999);

    expect(downstreamTimeout.signal?.aborted).toBe(false);

    vi.advanceTimersByTime(1);

    expect(downstreamTimeout.signal?.aborted).toBe(true);

    downstreamTimeout.cleanup();
  });

  it("should clear the timeout during cleanup", () => {
    vi.useFakeTimers();

    const downstreamTimeout = createDownstreamTimeout({
      enabled: true,
      timeoutMs: 1000,
    });

    downstreamTimeout.cleanup();

    vi.advanceTimersByTime(1000);

    expect(downstreamTimeout.signal?.aborted).toBe(false);
  });
});
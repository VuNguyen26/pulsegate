import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createClient,
  type RedisClientType,
} from "redis";

import {
  disconnectRedis,
  getRedisClient,
} from "./redis-client.js";

vi.mock("redis", () => ({
  createClient: vi.fn(),
}));

describe("Redis client logging", () => {
  afterEach(async () => {
    await disconnectRedis();
    vi.restoreAllMocks();
  });

  it("does not log the raw Redis exception", () => {
    let errorHandler:
      | ((error: unknown) => void)
      | undefined;

    const client = {
      isOpen: false,
      connect: vi.fn(),
      quit: vi.fn(),
      on: vi.fn(
        (
          event: string,
          handler: (error: unknown) => void,
        ) => {
          if (event === "error") {
            errorHandler = handler;
          }

          return client;
        },
      ),
    } as unknown as RedisClientType;

    vi.mocked(createClient).mockReturnValue(
      client as never,
    );

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getRedisClient();

    expect(errorHandler).toBeTypeOf("function");

    errorHandler?.(
      new Error("secret Redis connection detail"),
    );

    expect(consoleError).toHaveBeenCalledWith(
      JSON.stringify({
        event: "redis_client_error",
        errorCode: "REDIS_CLIENT_ERROR",
      }),
    );

    expect(consoleError.mock.calls.flat().join(" "))
      .not.toContain("secret Redis connection detail");
  });
});
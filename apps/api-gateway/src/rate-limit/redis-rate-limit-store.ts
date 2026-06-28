import type {
  RateLimitConfig,
  RateLimitResult,
} from "./in-memory-rate-limit-store.js";

type NowProvider = () => number;

export type RedisRateLimitClient = {
  eval: (
    script: string,
    options: {
      keys: string[];
      arguments: string[];
    }
  ) => Promise<unknown>;
};

export type RedisRateLimitStoreOptions = {
  commandTimeoutMs?: number;
};

const DEFAULT_COMMAND_TIMEOUT_MS = 500;

const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])

if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end

local ttl = redis.call("PTTL", KEYS[1])

return { current, ttl }
`;

export class RedisRateLimitStore {
  private readonly commandTimeoutMs: number;

  constructor(
    private readonly client: RedisRateLimitClient,
    private readonly now: NowProvider = () => Date.now(),
    options: RedisRateLimitStoreOptions = {}
  ) {
    this.commandTimeoutMs =
      options.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
  }

  async consume(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    this.validateKey(key);
    this.validateConfig(config);

    const now = this.now();
    const redisKey = this.buildRedisKey(key);

    const rawResult = await this.evalWithTimeout(RATE_LIMIT_SCRIPT, {
      keys: [redisKey],
      arguments: [String(config.windowMs)],
    });

    const { count, ttlMs } = this.parseScriptResult(rawResult);
    const effectiveTtlMs = ttlMs > 0 ? ttlMs : config.windowMs;
    const resetAt = now + effectiveTtlMs;
    const allowed = count <= config.limit;
    const remaining = Math.max(config.limit - count, 0);

    return {
      allowed,
      limit: config.limit,
      remaining,
      resetAt,
      retryAfterSeconds: allowed
        ? 0
        : Math.max(1, Math.ceil(effectiveTtlMs / 1000)),
    };
  }

  private async evalWithTimeout(
    script: string,
    options: {
      keys: string[];
      arguments: string[];
    }
  ): Promise<unknown> {
    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Redis rate limit command timed out"));
      }, this.commandTimeoutMs);
    });

    try {
      return await Promise.race([
        this.client.eval(script, options),
        timeoutPromise,
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private buildRedisKey(key: string): string {
    return `rate-limit:${key}`;
  }

  private parseScriptResult(rawResult: unknown): {
    count: number;
    ttlMs: number;
  } {
    if (!Array.isArray(rawResult) || rawResult.length < 2) {
      throw new Error("Invalid Redis rate limit response");
    }

    const count = Number(rawResult[0]);
    const ttlMs = Number(rawResult[1]);

    if (!Number.isFinite(count) || count <= 0) {
      throw new Error("Invalid Redis rate limit count");
    }

    if (!Number.isFinite(ttlMs)) {
      throw new Error("Invalid Redis rate limit ttl");
    }

    return {
      count,
      ttlMs,
    };
  }

  private validateKey(key: string): void {
    if (key.trim().length === 0) {
      throw new Error("Rate limit key is required");
    }
  }

  private validateConfig(config: RateLimitConfig): void {
    if (!Number.isFinite(config.limit) || config.limit <= 0) {
      throw new Error("Rate limit must be greater than 0");
    }

    if (!Number.isFinite(config.windowMs) || config.windowMs <= 0) {
      throw new Error("Rate limit windowMs must be greater than 0");
    }
  }
}
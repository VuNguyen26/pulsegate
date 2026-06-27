export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type NowProvider = () => number;

export class InMemoryRateLimitStore {
  private readonly records = new Map<string, RateLimitRecord>();

  constructor(private readonly now: NowProvider = () => Date.now()) {}

  consume(key: string, config: RateLimitConfig): RateLimitResult {
    this.validateKey(key);
    this.validateConfig(config);

    const now = this.now();
    const currentRecord = this.records.get(key);

    if (!currentRecord || currentRecord.resetAt <= now) {
      const resetAt = now + config.windowMs;

      this.records.set(key, {
        count: 1,
        resetAt,
      });

      return {
        allowed: true,
        limit: config.limit,
        remaining: config.limit - 1,
        resetAt,
        retryAfterSeconds: 0,
      };
    }

    const nextCount = currentRecord.count + 1;

    this.records.set(key, {
      count: nextCount,
      resetAt: currentRecord.resetAt,
    });

    const allowed = nextCount <= config.limit;
    const remaining = Math.max(config.limit - nextCount, 0);

    return {
      allowed,
      limit: config.limit,
      remaining,
      resetAt: currentRecord.resetAt,
      retryAfterSeconds: allowed
        ? 0
        : Math.max(1, Math.ceil((currentRecord.resetAt - now) / 1000)),
    };
  }

  clear(): void {
    this.records.clear();
  }

  cleanupExpired(): number {
    const now = this.now();
    let deletedCount = 0;

    for (const [key, record] of this.records.entries()) {
      if (record.resetAt <= now) {
        this.records.delete(key);
        deletedCount += 1;
      }
    }

    return deletedCount;
  }

  get size(): number {
    return this.records.size;
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
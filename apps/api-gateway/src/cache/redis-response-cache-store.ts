export type CachedHttpResponse = {
  statusCode: number;
  body: unknown;
  headers?: Record<string, string>;
};

export type ResponseCacheGetResult =
  | {
      hit: true;
      value: CachedHttpResponse;
    }
  | {
      hit: false;
    };

export type ResponseCacheSetOptions = {
  ttlSeconds: number;
};

export type RedisResponseCacheClient = {
  sendCommand: (args: string[]) => Promise<unknown>;
};

export type RedisResponseCacheStoreOptions = {
  commandTimeoutMs?: number;
  keyPrefix?: string;
};

const DEFAULT_COMMAND_TIMEOUT_MS = 500;
const DEFAULT_KEY_PREFIX = "response-cache";

export class RedisResponseCacheStore {
  private readonly commandTimeoutMs: number;
  private readonly keyPrefix: string;

  constructor(
    private readonly client: RedisResponseCacheClient,
    options: RedisResponseCacheStoreOptions = {}
  ) {
    this.commandTimeoutMs =
      options.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
    this.keyPrefix = options.keyPrefix ?? DEFAULT_KEY_PREFIX;
  }

  async get(key: string): Promise<ResponseCacheGetResult> {
    this.validateKey(key);

    const rawValue = await this.commandWithTimeout([
      "GET",
      this.buildRedisKey(key),
    ]);

    if (rawValue === null) {
      return {
        hit: false,
      };
    }

    const serializedValue = this.parseRedisString(rawValue);
    const cachedResponse = this.deserializeCachedResponse(serializedValue);

    return {
      hit: true,
      value: cachedResponse,
    };
  }

  async set(
    key: string,
    value: CachedHttpResponse,
    options: ResponseCacheSetOptions
  ): Promise<void> {
    this.validateKey(key);
    this.validateCachedResponse(value);
    this.validateTtlSeconds(options.ttlSeconds);

    await this.commandWithTimeout([
      "SET",
      this.buildRedisKey(key),
      JSON.stringify(value),
      "EX",
      String(options.ttlSeconds),
    ]);
  }

  private async commandWithTimeout(args: string[]): Promise<unknown> {
    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Redis cache command timed out"));
      }, this.commandTimeoutMs);
    });

    try {
      return await Promise.race([
        this.client.sendCommand(args),
        timeoutPromise,
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private buildRedisKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  private parseRedisString(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }

    if (Buffer.isBuffer(value)) {
      return value.toString("utf8");
    }

    throw new Error("Invalid Redis cache response");
  }

  private deserializeCachedResponse(value: string): CachedHttpResponse {
    try {
      const parsed = JSON.parse(value);

      this.validateCachedResponse(parsed);

      return parsed;
    } catch {
      throw new Error("Invalid cached response payload");
    }
  }

  private validateKey(key: string): void {
    if (key.trim().length === 0) {
      throw new Error("Cache key is required");
    }
  }

  private validateTtlSeconds(ttlSeconds: number): void {
    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error("Cache ttlSeconds must be a positive integer");
    }
  }

  private validateCachedResponse(
  value: unknown
): asserts value is CachedHttpResponse {
  if (!this.isRecord(value)) {
    throw new Error("Invalid cached response payload");
  }

  const statusCode = value.statusCode;

  if (
    typeof statusCode !== "number" ||
    !Number.isInteger(statusCode) ||
    statusCode < 100
  ) {
    throw new Error("Invalid cached response payload");
  }

  if (!("body" in value)) {
    throw new Error("Invalid cached response payload");
  }

  const headers = value.headers;

  if (headers !== undefined && !this.isStringRecord(headers)) {
    throw new Error("Invalid cached response payload");
  }
}

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isStringRecord(value: unknown): value is Record<string, string> {
    if (!this.isRecord(value)) {
      return false;
    }

    return Object.values(value).every((item) => typeof item === "string");
  }
}
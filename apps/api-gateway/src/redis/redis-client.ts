import { createClient, type RedisClientType } from "redis";

import { env } from "../config/env.js";

let redisClient: RedisClientType | undefined;

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    redisClient = createClient({
      url: env.REDIS_URL,
    });

    redisClient.on("error", (error) => {
      console.error("Redis client error", error);
    });
  }

  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();

  if (!client.isOpen) {
    await client.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }

  redisClient = undefined;
}
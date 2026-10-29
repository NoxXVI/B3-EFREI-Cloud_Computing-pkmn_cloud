import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export const CHAT_QUOTA_PER_HOUR = 10;

export const chatLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(CHAT_QUOTA_PER_HOUR, "1 h"),
  prefix: "pkmn:chat",
});

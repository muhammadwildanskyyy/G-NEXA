import Redis from "ioredis";
import { log } from "../lib/logger";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const redisPassword = process.env.REDIS_PASSWORD || "";
const redisDb = parseInt(process.env.REDIS_DB || "0");

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  db: redisDb,
});

redis.on("connect", () => {
  log.info("infra:redis", "Successfully connected to Redis");
});

redis.on("error", (err) => {
  log.error("infra:redis", "Failed to connect to Redis", err);
});

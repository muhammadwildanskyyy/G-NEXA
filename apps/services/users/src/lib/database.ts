import { PrismaClient } from "../generated/prisma/client";
import { log } from "./logger.ts";

/**
 * Singleton pattern for Prisma Client with Custom Logging
 */
const prismaClientSingleton = () => {
  // 1. Beritahu Prisma untuk memancarkan event (emit) daripada console.log
  const client = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
      { emit: "event", level: "error" },
    ],
  });

  // 2. Hubungkan Event Prisma ke Logger Kita
  // Kita gunakan .debug untuk query agar tidak "berisik" di Production
  client.$on("query" as any, (e: any) => {
    log.debug("repository:prisma", `Query Executed`, {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });

  client.$on("error" as any, (e: any) => {
    log.error("repository:prisma", "Prisma Operation Failed", e);
  });

  client.$on("warn" as any, (e: any) => {
    log.warn("repository:prisma", e.message);
  });

  return client;
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

export const database = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = database;
}

/**
 * Database connection helper
 */
export const connectDB = async () => {
  try {
    await database.$connect();
    // Gunakan standar layer 'infra:database' atau 'APP'
    log.info("APP", "Database connected successfully to PostgreSQL");
  } catch (error) {
    log.error("APP", "Database connection failed", error);
    process.exit(1);
  }
};
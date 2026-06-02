// lib/prisma.ts
import { PrismaClient } from "@/lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables for non-Next.js contexts (e.g., test scripts)
// Next.js automatically loads .env files, but standalone scripts don't
if (typeof process !== "undefined" && !process.env.NEXT_RUNTIME) {
  try {
    await import("dotenv/config");
  } catch {
    // dotenv not available or already loaded, continue
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// 解析 DATABASE_URL 並明確設置每個參數，避免 SASL 錯誤
function createPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  try {
    // 使用 URL 類解析連接字串
    const url = new URL(databaseUrl);

    // 明確提取每個參數並確保是字串
    const config = {
      host: url.hostname,
      port: parseInt(url.port || "5432", 10),
      database: url.pathname.slice(1), // 移除開頭的 "/"
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl: false, // 本地開發不使用 SSL
    };

    return new Pool(config);
  } catch {
    // Fallback to connection string if parsing fails
    return new Pool({
      connectionString: databaseUrl,
      ssl: false,
    });
  }
}

// Lazily create the Prisma client on first use, not at import time.
// This avoids requiring DATABASE_URL during `next build` page-data collection,
// where route modules are imported but no DB query is actually executed.
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const pool = globalForPrisma.pool ?? createPool();
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  globalForPrisma.prisma = client;
  globalForPrisma.pool = pool;
  return client;
}

// Proxy defers client creation until a property is accessed at runtime.
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { prisma };

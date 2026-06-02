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

// 創建 PostgreSQL 連接池
const pool = globalForPrisma.pool ?? createPool();

// 創建 Prisma Pg Adapter
const adapter = new PrismaPg(pool);

// 創建 Prisma Client with adapter
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

export { prisma };

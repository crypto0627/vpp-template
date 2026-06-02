import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Database Connection", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should connect to PostgreSQL database", async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should query User table schema", async () => {
    const users = await prisma.user.findMany({ take: 1 });
    expect(Array.isArray(users)).toBe(true);
  });

  it("should handle connection errors gracefully", async () => {
    // Test with invalid query
    try {
      await prisma.$queryRaw`SELECT * FROM nonexistent_table`;
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

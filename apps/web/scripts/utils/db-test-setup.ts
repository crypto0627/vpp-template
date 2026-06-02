/**
 * Database test setup/teardown
 */

import { beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

/**
 * Setup test database connection
 */
export async function setupTestDatabase() {
  // Test database connection
  try {
    await prisma.$connect();
    console.log("✓ Test database connected");
  } catch (error) {
    console.error("✗ Failed to connect to test database:", error);
    throw error;
  }
}

/**
 * Teardown test database
 */
export async function teardownTestDatabase() {
  await prisma.$disconnect();
  console.log("✓ Test database disconnected");
}

/**
 * Create a test user in the database
 */
export async function createTestUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return user;
  } catch (error) {
    // User might already exist
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return existingUser;
    }

    throw error;
  }
}

/**
 * Clean up test users
 */
export async function cleanupTestUsers() {
  // Delete test users (emails containing 'test')
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: "test",
      },
    },
  });
}

// Global setup and teardown
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

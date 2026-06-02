/**
 * Shared test utilities
 */

export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

/**
 * Helper for authenticated requests
 */
export async function fetchWithAuth(
  url: string,
  token?: string,
  options?: RequestInit,
) {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Cookie"] = `auth-token=${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Generate test user data
 */
export function createTestUser(overrides?: {
  email?: string;
  password?: string;
}) {
  return {
    email: overrides?.email || "test@example.com",
    password: overrides?.password || "Test1234!",
  };
}

/**
 * Validate date range coverage
 */
export function assertDateRange(
  start: string,
  end: string,
  records: Array<{ date: string }>,
) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const recordDates = new Set(records.map((r) => r.date));

  const current = new Date(startDate);
  const missing: string[] = [];

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    if (!dateStr) {
      throw new Error("Failed to format date");
    }
    if (!recordDates.has(dateStr)) {
      missing.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }

  return missing;
}

/**
 * Calculate precision differences for report tests
 */
export function calculatePrecisionDiff(
  summary: Record<string, number>,
  dailySum: Record<string, number>,
) {
  const diffs: Record<string, number> = {};

  for (const key in summary) {
    if (typeof summary[key] === "number" && typeof dailySum[key] === "number") {
      diffs[key] = Math.abs(summary[key] - dailySum[key]);
    }
  }

  return diffs;
}

/**
 * Wait for a specific condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

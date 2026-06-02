# Example Test File Structure

## Unit Test Example

`scripts/tests/unit/bess-unified.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  simulateBESSForDay,
  type BESSState,
  type PersistedBESSState,
} from "@/utils/bess-unified";

describe("BESS Simulation", () => {
  it("should charge battery at midnight", () => {
    const state: PersistedBESSState = {
      socKWh: 100,
      lastTimestamp: Date.now(),
      lastChargeSessionDateTW: "2025-01-01",
      chargeSessionActive: false,
    };

    const result = simulateBESSForDay(state, telemetryData, "2025-01-02");

    expect(result.chargedKWh).toBeGreaterThan(0);
  });

  it("should respect SOC boundaries (0-370 kWh)", () => {
    // Test implementation
  });
});
```

## Integration Test Example

`scripts/tests/integration/auth-api.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { ALLOWED_EMAILS } from "@/constants/auth-constants";
import { BASE_URL } from "../../utils/test-helpers";

describe("Auth API", () => {
  const testEmail = ALLOWED_EMAILS[0];
  const testPassword = "Test1234!";

  describe("Signup Flow", () => {
    it("should reject non-whitelisted email", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "unauthorized@example.com",
          password: testPassword,
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should accept whitelisted email", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      expect([200, 201, 409]).toContain(response.status);
    });
  });
});
```

## Database Test Example

`scripts/tests/integration/database.test.ts`

```typescript
import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Database Connection", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should connect to PostgreSQL database", async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  it("should query User table schema", async () => {
    const users = await prisma.user.findMany({ take: 1 });
    expect(Array.isArray(users)).toBe(true);
  });

  it("should handle connection errors gracefully", async () => {
    // Test error handling
  });
});
```

## Mock Data Example

`scripts/utils/mock-data.ts`

```typescript
import type { TelemetryData } from "@/types/data-type";

export function createMockTelemetryData(
  overrides?: Partial<TelemetryData>,
): TelemetryData {
  return {
    createAt: new Date().toISOString(),
    BESS: {
      SOC: 75.5,
      SOH: 98.2,
      Voltage: 720.5,
      Current: 50.2,
      CellHV: 4.2,
      CellLV: 3.8,
      BMUHT: 35.5,
      BMULT: 20.2,
    },
    ChargingInfo: {
      TotalCharging: 25.5,
      SuperCharging: { 開關: "OFF", 數值: 0 },
      DC: { 上限: 150, 開關: "OFF", 數值: 0 },
    },
    Environment: {
      InSide: { Temperature: 24.5, Humidity: 55.2 },
      OutSide: { Temperature: 28.3, Humidity: 65.8 },
    },
    TotalUsage: 25.5,
    ...overrides,
  };
}
```

## Test Helper Example

`scripts/utils/test-helpers.ts`

```typescript
export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

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

  return fetch(url, { ...options, headers });
}

export function createTestUser(overrides?: {
  email?: string;
  password?: string;
}) {
  return {
    email: overrides?.email || "test@example.com",
    password: overrides?.password || "Test1234!",
  };
}
```

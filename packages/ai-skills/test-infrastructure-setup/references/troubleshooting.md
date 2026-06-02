# Troubleshooting Guide

## Common Issues and Solutions

### 1. Environment Variables Not Loading

**Problem**: Tests fail with "client password must be a string" or undefined env vars

**Solution**:

```typescript
// vitest.config.ts
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "../.env") });
```

Install dotenv:

```bash
pnpm add -D dotenv
```

### 2. Module Resolution Errors

**Problem**: `Cannot find module '@/...'`

**Solution**: Configure path aliases in vitest.config.ts:

```typescript
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".."),
    },
  },
});
```

### 3. ES Module Issues

**Problem**: `__dirname is not defined`

**Solution**: Use `fileURLToPath`:

```typescript
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 4. Prisma Import Errors

**Problem**: `Module has no default export`

**Solution**: Use named import:

```typescript
// ❌ Wrong
import prisma from "@/lib/prisma";

// ✅ Correct
import { prisma } from "@/lib/prisma";
```

### 5. TypeScript Strict Null Checks

**Problem**: `Type 'X | undefined' is not assignable to type 'X'`

**Solution**: Add proper type guards:

```typescript
// ❌ Wrong
const record: DailyRecord = reportData.dailyReport[0];

// ✅ Correct
const record = reportData.dailyReport[0];
if (!record) {
  throw new Error("No daily records found");
}
```

### 6. Unused Error Variables

**Problem**: ESLint warning `'_error' is defined but never used`

**Solution**: Remove error parameter entirely:

```typescript
// ❌ Wrong
} catch (_error) {
  return false;
}

// ✅ Correct
} catch {
  return false;
}
```

### 7. Generated Files Linting

**Problem**: 1000+ warnings from `lib/generated/**/*`

**Solution**: Add to eslint.config.js:

```javascript
export default [
  ...nextJsConfig,
  {
    ignores: ["lib/generated/**/*"],
  },
];
```

### 8. Turbo Environment Variable Warnings

**Problem**: `TEST_BASE_URL is not listed as a dependency in turbo.json`

**Solution**: Add to turbo.json:

```json
{
  "tasks": {
    "test": {
      "env": ["DATABASE_URL", "JWT_SECRET", "TEST_BASE_URL"]
    }
  }
}
```

### 9. Database Connection Timeout

**Problem**: Tests timeout waiting for database

**Solution**: Increase timeouts in vitest.config.ts:

```typescript
export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
```

### 10. API Response Type Mismatches

**Problem**: Tests expect wrong data structure

**Solution**: Match actual API response exactly:

```typescript
// Check actual API response first
const response = await fetch(API_URL);
const data = await response.json();
console.log(data); // Inspect actual structure

// Then update mock/test to match
expect(data.ChargingInfo.SuperCharging.開關).toBeDefined(); // Chinese property
expect(data.createAt).toBeDefined(); // Not 'timestamp'
```

## Performance Tips

1. **Parallelize Independent Tests**: Use `describe.concurrent` for unrelated tests
2. **Skip Database Tests Locally**: Use `it.skip()` for slow tests during development
3. **Use Test Fixtures**: Cache frequently used test data
4. **Minimize API Calls**: Mock external APIs when possible
5. **Cleanup After Tests**: Always disconnect database, close servers

## Debugging Techniques

### Enable Prisma Query Logging

```typescript
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
```

### View Full Test Output

```bash
pnpm test -- --reporter=verbose
```

### Run Single Test File

```bash
pnpm test scripts/tests/integration/auth-api.test.ts
```

### Debug with Console Logs

```typescript
it("should do something", () => {
  console.log("Debug:", JSON.stringify(data, null, 2));
  expect(data).toBeDefined();
});
```

### Check Environment Variables

```bash
# In test file
console.log("DB URL:", process.env.DATABASE_URL);
console.log("All env:", Object.keys(process.env));
```

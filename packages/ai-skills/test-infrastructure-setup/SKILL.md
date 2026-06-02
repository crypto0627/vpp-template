---
name: test-infrastructure-setup
description: Sets up comprehensive test infrastructure with Vitest, TypeScript, Prisma, and dotenv. Creates organized test directory structure, type consolidation, and GitHub Actions integration. Use when user asks to "set up tests", "create test infrastructure", or "configure testing".
---

# Test Infrastructure Setup Skill

This skill helps you set up a complete test infrastructure for Next.js projects with TypeScript, Prisma, and integration/unit/e2e testing capabilities.

## When to Use This Skill

- User asks to set up testing infrastructure
- User wants to organize scattered test files
- User needs integration tests for APIs and database
- User wants to consolidate type definitions
- User needs GitHub Actions with test automation

## Core Workflow

### Phase 1: Type Consolidation

1. **Create centralized type directory** (`apps/web/types/`)
   - Extract types from utility files into dedicated type files
   - Create barrel export (`index.ts`) for easy imports
   - Update all imports across codebase to use `@/types/*`

2. **Type file organization**:
   ```
   types/
   ├── data-type.ts        # API data structures
   ├── report-type.ts      # Report interfaces
   ├── bess-type.ts        # Battery simulation types
   ├── auth-type.ts        # Authentication types
   ├── validation-type.ts  # Form validation types
   ├── ui-type.ts          # UI component types
   └── index.ts            # Barrel export
   ```

### Phase 2: Test Infrastructure Setup

1. **Create test directory structure** (`apps/web/scripts/tests/`):

   ```
   scripts/
   ├── tests/
   │   ├── unit/           # Unit tests
   │   ├── integration/    # API & database tests
   │   ├── e2e/            # End-to-end tests
   │   └── type-checking/  # TypeScript validation
   └── utils/
       ├── test-helpers.ts    # Shared utilities
       ├── mock-data.ts       # Mock generators
       ├── db-test-setup.ts   # Database setup
       └── server-helpers.ts  # Server utilities
   ```

2. **Create vitest.config.ts** in `scripts/`:

   ```typescript
   import { defineConfig } from "vitest/config";
   import path from "path";
   import { fileURLToPath } from "url";
   import { config } from "dotenv";

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   // Load environment variables from .env file
   config({ path: path.resolve(__dirname, "../.env") });

   export default defineConfig({
     test: {
       globals: true,
       environment: "node",
       setupFiles: [path.resolve(__dirname, "./utils/db-test-setup.ts")],
       testTimeout: 30000,
       hookTimeout: 30000,
     },
     resolve: {
       alias: {
         "@": path.resolve(__dirname, ".."),
       },
     },
   });
   ```

3. **Install dependencies**:

   ```bash
   pnpm add -D vitest @vitest/ui dotenv csv-parse
   ```

4. **Add test scripts to package.json**:
   ```json
   {
     "scripts": {
       "test": "vitest --config scripts/vitest.config.ts",
       "test:watch": "vitest --config scripts/vitest.config.ts --watch",
       "test:unit": "vitest --config scripts/vitest.config.ts tests/unit",
       "test:integration": "vitest --config scripts/vitest.config.ts tests/integration",
       "test:e2e": "vitest --config scripts/vitest.config.ts tests/e2e"
     }
   }
   ```

### Phase 3: Test Utilities

1. **Create test-helpers.ts**:
   - `BASE_URL` constant for API endpoints
   - `fetchWithAuth()` for authenticated requests
   - `createTestUser()` for test data generation
   - `assertDateRange()` for date validation
   - `waitFor()` for async conditions

2. **Create mock-data.ts**:
   - Mock data generators matching actual API structure
   - Use proper TypeScript types
   - Include realistic test data

3. **Create db-test-setup.ts**:

   ```typescript
   import { beforeAll, afterAll } from "vitest";
   import { prisma } from "@/lib/prisma";

   export async function setupTestDatabase() {
     try {
       await prisma.$connect();
       console.log("✓ Test database connected");
     } catch (error) {
       console.error("✗ Failed to connect:", error);
       throw error;
     }
   }

   export async function teardownTestDatabase() {
     await prisma.$disconnect();
     console.log("✓ Test database disconnected");
   }

   beforeAll(async () => {
     await setupTestDatabase();
   });

   afterAll(async () => {
     await teardownTestDatabase();
   });
   ```

### Phase 4: Write Comprehensive Tests

1. **Unit Tests** (`tests/unit/`):
   - Business logic (e.g., BESS simulation)
   - Pure functions
   - Utility functions

2. **Integration Tests** (`tests/integration/`):
   - Database connection tests
   - Auth API tests (signup, signin, signout)
   - External API data fetching
   - Data rendering transformations
   - Report API with date ranges

3. **E2E Tests** (`tests/e2e/`):
   - CSV export functionality
   - Full user workflows
   - Multi-step processes

4. **Type Checking Tests** (`tests/type-checking/`):

   ```typescript
   import { exec } from "child_process";
   import { promisify } from "util";

   const execAsync = promisify(exec);

   it("should pass type checking", async () => {
     const { stderr } = await execAsync("pnpm check-types");
     expect(stderr).not.toContain("error TS");
   }, 60000);
   ```

### Phase 5: Update turbo.json

Add test tasks to Turborepo configuration:

```json
{
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "env": ["DATABASE_URL", "JWT_SECRET", "TEST_BASE_URL"]
    },
    "test:unit": {
      "dependsOn": []
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "env": ["DATABASE_URL", "JWT_SECRET"]
    }
  }
}
```

### Phase 6: GitHub Actions Integration

Create `.github/workflows/` with test automation:

```yaml
name: Build and Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: auth_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.0.0
      - uses: actions/setup-node@v4
        with:
          node-version: "22.18"
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm check-types

      - name: Run database migrations
        run: pnpm --filter=web prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/auth_db

      - name: Run tests
        run: pnpm --filter=web test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/auth_db
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          TEST_BASE_URL: http://localhost:3000

      - run: pnpm turbo build --filter=web
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Phase 7: Cleanup

1. Delete old test files from root directory
2. Delete old test directories (e.g., `utils/__tests__/`)
3. Remove old vitest config if exists
4. Run type checking to verify all imports work

## Best Practices

### Type Safety

- Use strict TypeScript types for all test data
- Add proper null/undefined checks
- Use type guards for array access
- Avoid `any` types - create proper interfaces

### Test Organization

- Group related tests with `describe()` blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Keep tests independent and isolated

### Mock Data

- Match actual API structure exactly
- Use realistic test values
- Include edge cases
- Test with Chinese property names if API uses them

### Environment Variables

- Load `.env` in vitest config using dotenv
- Declare all env vars in turbo.json
- Use secrets for sensitive values in CI
- Provide defaults for optional env vars

### Database Testing

- Use separate test database
- Clean up test data in `afterAll()`
- Handle connection errors gracefully
- Test both success and error scenarios

## Common Pitfalls to Avoid

1. ❌ **Not loading environment variables** in test config
   - ✅ Use `dotenv` in vitest.config.ts

2. ❌ **Hardcoding test data** that doesn't match API
   - ✅ Create mock generators matching actual structure

3. ❌ **Missing type guards** for array access
   - ✅ Check for undefined before accessing array elements

4. ❌ **Using relative paths** that break after file moves
   - ✅ Use `@/` alias for imports

5. ❌ **Not ignoring generated files** in ESLint
   - ✅ Add `ignores: ["lib/generated/**/*"]` to eslint.config

6. ❌ **Unused error variables** in catch blocks
   - ✅ Remove error parameter or use it: `catch { ... }`

7. ❌ **Missing turbo.json env declarations**
   - ✅ Declare all env vars used in tests

## Expected Outcomes

After completing this workflow:

- ✅ All types centralized in `apps/web/types/`
- ✅ Organized test structure in `apps/web/scripts/tests/`
- ✅ 60+ comprehensive tests covering all critical paths
- ✅ 0 TypeScript compilation errors
- ✅ 0 linting warnings
- ✅ GitHub Actions running tests on every push
- ✅ Database integration tests working
- ✅ Auth flow fully tested
- ✅ External API integration verified

## Verification Commands

```bash
# Type checking
pnpm check-types        # Should pass with 0 errors

# Linting
pnpm lint              # Should pass with 0 warnings
pnpm lint:fix          # Auto-fix linting issues

# Testing
pnpm test              # Run all tests
pnpm test:unit         # Run unit tests only
pnpm test:integration  # Run integration tests
pnpm test:watch        # Watch mode for development

# Build
pnpm build             # Should build successfully
```

## Success Metrics

- Type checking: 0 errors
- Linting: 0 warnings
- Tests: 90%+ pass rate (excluding env-dependent tests)
- Build: Successful compilation
- CI/CD: Green builds on GitHub Actions

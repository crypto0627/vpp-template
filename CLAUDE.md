# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **VPP (Virtual Power Plant) Dashboard** - a comprehensive Next.js application for monitoring and managing energy storage systems and EV charging sites. The project is a Turborepo monorepo that provides:

- ⚡ **Real-time Energy Monitoring** - Battery status, charging pile usage, energy flow visualization
- 💰 **Intelligent Cost Optimization** - Peak/off-peak management, automatic savings calculation (15-20% cost reduction)
- 🔋 **Cross-Day SOC Simulation** - Accurate battery charge/discharge strategy simulation
- 🤖 **AI Smart Assistant** - Claude-powered multilingual energy consultation
- 📊 **Historical Data Analysis** - Monthly/annual reports, cost comparison, trend analysis

**Key Sites:**

- **Neihu (內湖)**: EV charging station with 370kWh BESS, real-time data from external API
- **ETai (億泰電纜)**: High-voltage industrial site with 10MWh BESS + Demand Response program

## Quick Reference

### 📚 Complete Documentation

**Primary Documentation Hub:** [`apps/web/docs/README.md`](apps/web/docs/README.md)

Before making significant changes, consult:

- [**PROJECT_STRUCTURE.md**](apps/web/docs/PROJECT_STRUCTURE.md) - Complete architecture guide
- [**REPORT_ALGORITHM_SUMMARY.md**](apps/web/docs/REPORT_ALGORITHM_SUMMARY.md) - BESS simulation algorithms
- [**AI_MODULE_STRUCTURE.md**](apps/web/docs/AI_MODULE_STRUCTURE.md) - AI module design
- [**TEST-RESULTS.md**](apps/web/docs/TEST-RESULTS.md) - Test verification records

### 🎯 Main README

See [`README.md`](README.md) for complete project information including:

- Features, tech stack, architecture
- Quick start guide, development workflow
- Core algorithms (BESS simulation, electricity pricing)
- Deployment instructions

---

## Development Commands

### Installation

```bash
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run only the web app (port 3000)
turbo dev --filter=web
```

### Building

```bash
# Build all apps and packages
pnpm build

# Build only the web app
turbo build --filter=web
```

### Linting & Type Checking

```bash
# Lint all code
pnpm lint

# Type check all code
pnpm check-types

# Format all code
pnpm format
```

### Database Operations (Prisma)

```bash
cd apps/web

# Generate Prisma client
npx prisma generate

# Run migrations (development)
npx prisma migrate dev

# Deploy migrations (production)
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

### Testing

```bash
cd apps/web

# Most comprehensive BESS cost comparison test
npx tsx scripts/tests/integration/electricity-cost-comparison.test.ts

# Cross-day SOC persistence test
npx tsx scripts/tests/integration/cross-day-soc.test.ts

# AI chat full flow test
npx tsx scripts/tests/integration/chat-api-full.test.ts

# Run all tests (Vitest)
pnpm test
```

---

## Architecture Overview

### Monorepo Structure

```
vpp/                                    # Turborepo root
├── README.md                           # Main project documentation
├── CLAUDE.md                           # This file (Claude guidance)
├── turbo.json                          # Turborepo configuration
├── apps/
│   └── web/                            # Main Next.js application
│       ├── app/                        # Next.js App Router
│       ├── components/                 # React components
│       ├── services/                   # Business logic layer (SOA)
│       ├── stores/                     # Zustand state management
│       ├── utils/                      # Core utilities
│       │   ├── bess-unified.ts         # 🔋 BESS re-export (backward compat)
│       │   └── bess-algorithm/         # 🔋 Modular BESS simulation
│       │       ├── index.ts            # Public API barrel export
│       │       ├── constants.ts        # Config constants & helpers
│       │       ├── time-utils.ts       # Taiwan time utilities
│       │       ├── electricity-rate.ts # Rate lookup functions
│       │       ├── state.ts            # State creation & voltage calc
│       │       ├── step-simulation.ts  # Core single-step simulation
│       │       ├── realtime-simulation.ts  # Batch real-time processing
│       │       ├── cost-calculation.ts # Cost computation
│       │       ├── report-simulation.ts    # Report-specific simulation
│       │       └── legacy.ts           # Legacy function wrappers
│       ├── config/                     # Configuration files
│       │   └── site-configs.ts         # Site-specific configs (rates, capacity)
│       ├── constants/                  # Constants
│       │   ├── taiwan-holidays.ts      # National holidays
│       │   ├── auth-constants.ts       # Email whitelist & RBAC roles
│       │   └── neihu-charging-station-data.json  # Historical data
│       ├── types/                      # TypeScript type definitions
│       ├── lib/                        # Libraries and utilities
│       │   ├── prisma.ts               # Prisma client singleton
│       │   └── ai/prompts.ts           # AI system prompts
│       ├── middleware/                 # Middleware (auth)
│       ├── prisma/                     # Prisma schema and migrations
│       ├── docs/                       # 📚 Complete technical documentation
│       │   ├── README.md               # Documentation hub
│       │   ├── PROJECT_STRUCTURE.md    # Architecture guide
│       │   ├── AI_MODULE_STRUCTURE.md  # AI module design
│       │   ├── REPORT_ALGORITHM_SUMMARY.md  # Algorithms
│       │   ├── PERIOD_SAVINGS_SETUP.md # Savings calculation
│       │   └── TEST-RESULTS.md         # Test records
│       └── scripts/                    # Scripts and tests
│           └── tests/                  # Organized test structure
│               ├── integration/        # Integration tests
│               ├── unit/               # Unit tests
│               ├── e2e/                # E2E tests
│               └── type-checking/      # Type checking tests
└── packages/                           # Shared packages
    ├── eslint-config/                  # Shared ESLint config
    └── typescript-config/              # Shared TypeScript config
```

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9.2 (strict mode)
- **UI**: React 19, Tailwind CSS 4, Radix UI components
- **State Management**: Zustand (with persist middleware)
- **Database**: PostgreSQL via Prisma ORM 7 (with PrismaPg adapter)
- **Authentication**: JWT-based auth with bcrypt (HTTP-only cookies)
- **AI**: Anthropic Claude Haiku 3 (@ai-sdk/anthropic)
- **Charts**: Recharts
- **Maps**: Mapbox GL JS
- **Package Manager**: pnpm 9.0.0
- **Monorepo Tool**: Turborepo
- **Testing**: Vitest

---

## Key Modules & Architecture

### 1. 🔋 BESS Simulation Core

**Location:** [`apps/web/utils/bess-algorithm/`](apps/web/utils/bess-algorithm/)
**Legacy re-export:** [`apps/web/utils/bess-unified.ts`](apps/web/utils/bess-unified.ts) (backward compatibility)

The BESS simulation has been refactored from a monolithic file into a modular architecture:

| Module | Purpose |
|--------|---------|
| `step-simulation.ts` | Core single-step simulation logic |
| `realtime-simulation.ts` | Batch processing of real-time data |
| `cost-calculation.ts` | Electricity cost computation (with/without BESS) |
| `report-simulation.ts` | Report-specific simulation |
| `time-utils.ts` | Taiwan time utilities (`isPeakTimeTW`, `shouldDisableBESS`) |
| `electricity-rate.ts` | Rate lookup functions (`getElectricityRate`) |
| `state.ts` | State creation & voltage calculation |
| `constants.ts` | Configuration constants |
| `legacy.ts` | Legacy function wrappers |

**Critical Rules - MUST FOLLOW:**

- ✅ SOC never guessed: Calculated from previous state, no time heuristics
- ✅ Charging only on weekdays at 00:00: One session per day (weekends/holidays disabled)
- ✅ Full power charging: PCS max power (not limited by contract capacity)
- ✅ Stop when full: `chargeSessionActive = false`
- ✅ Peak discharge: Follows load, limited by PCS (weekdays only)
- ✅ Weekend/Holiday: Completely disabled (no charging, no discharging)
- ✅ Cross-day persistence: SOC state persists, no reset

**⚠️ WARNING:** Before modifying BESS algorithm modules:

1. Read file header strict rules
2. Consult [`docs/REPORT_ALGORITHM_SUMMARY.md`](apps/web/docs/REPORT_ALGORITHM_SUMMARY.md)
3. Run full test suite (`electricity-cost-comparison.test.ts`)
4. Verify cross-day SOC persistence

### 2. 🤖 AI Module (Service-Oriented Architecture)

**Location:** [`apps/web/services/ai/`](apps/web/services/ai/)

**Architecture:**

- **chat-service.ts** - Conversation management (CRUD operations)
- **ai-provider.ts** - AI model interaction (generateText)
- **usage-tracker.ts** - Token usage tracking
- **context-provider.ts** - Real-time data context provider
- **historical-data-service.ts** - Historical data queries
- **response-parser.ts** - Parses AI responses for `<CHART>` tags, extracts chart configs

**Features:**

- ✅ Multilingual support (auto-detect Chinese/English)
- ✅ Real-time data queries (auto-fetch from API)
- ✅ Historical data queries (natural language date parsing)
- ✅ Conversation history management (session-based)
- ✅ Chart rendering in chat (power-demand, bess-charge-discharge, cost-trend, cost-comparison, battery-soc, yearly-comparison)

**API Route:** [`apps/web/app/api/ai/chat/route.ts`](apps/web/app/api/ai/chat/route.ts)
**Prompts:** [`apps/web/lib/ai/prompts.ts`](apps/web/lib/ai/prompts.ts)

**Documentation:** [`apps/web/docs/AI_MODULE_STRUCTURE.md`](apps/web/docs/AI_MODULE_STRUCTURE.md)

### 3. 💰 Electricity Pricing Algorithm

**Location:** [`apps/web/config/site-configs.ts`](apps/web/config/site-configs.ts)

**Two Pricing Models:**

| Model | Sites | Summer Definition | Semi-Peak |
|-------|-------|-------------------|-----------|
| `ev-charging` | Neihu | Month-based (Jun-Sep) | None |
| `batch-tou` | ETai | Date-based (5/16-10/15) | Saturdays |

**Neihu Rates (ev-charging, NT$/kWh):**

| Period | Summer (Jun-Sep) | Non-Summer |
|--------|-----------------|------------|
| **Peak** | 12.47 | 12.14 |
| **Off-Peak** | 3.05 | 2.90 |

- Summer Peak: 16:00-22:00 (weekdays), Non-Summer Peak: 15:00-21:00 (weekdays)

**ETai Rates (batch-tou, NT$/kWh):**

| Period | Summer (5/16-10/15) | Non-Summer |
|--------|-------------------|------------|
| **Peak** | 12.47 | 11.79 |
| **Semi-Peak** | 3.26 | 3.00 |
| **Off-Peak** | 3.18 | 3.18 |

- Unified Peak: 15:30-21:30 (weekdays), Semi-Peak: 15:30-21:30 (Saturdays only)

**Calculation:**

```typescript
Total Cost = (Peak × PeakRate) + (SemiPeak × SemiPeakRate) + (OffPeak × OffPeakRate)
Savings = Cost Without BESS - Cost With BESS
Savings Rate = (Savings / Cost Without BESS) × 100%
```

### 3.1 ⚡ Demand Response (DR) Program

**Applies to:** ETai only | **Season:** May 1 - October 31 (weekdays, excl. holidays)

```typescript
Daily DR Discount = Suppressed_KW × Execution_Rate × Hours × Rate × Discount_Ratio
                  = 1000 × 1.0 × 4 × 1.84 × 1.2 = NT$8,832/day
```

**DR Parameters:**
- Suppressed Load: 1,000 kW | Execution Rate: 100% | Hours: 4
- Rate: NT$1.84/kWh | Discount Ratio: 120%
- Night Charging: 1,000 kW extra at 22:00-24:00 during DR season

**Key functions:** `isDRSeasonDate()`, `getDailyDRCost()` in `site-configs.ts`

### 4. 📊 State Management

**Location:** [`apps/web/stores/`](apps/web/stores/)

**data-store.ts** - Multi-site data management

- Manages telemetry data for multiple sites: `Record<SiteId, TelemetryData[]>`
- Auto-calculates summary metrics (electricityUsage, costs, solarPower, energyStorage, chargingPiles)
- Auto-refreshes every 10 seconds (site detail pages)
- Supports time ranges: "today" | "month" | "year"

**auth-store.ts** - Authentication state management

- JWT-based authentication (HTTP-only cookies)
- Persisted to localStorage (user + isAuthenticated)
- Methods: `signIn()`, `signUp()`, `signOut()`, `checkAuth()`

### 5. 🗄️ Data Sources

**Real-time Data:**

- Source: `http://127.0.0.1:3003/neihu/data?range=today`
- Format: `{ data: TelemetryData[] }`
- Update frequency: Every 15 minutes
- Usage: Homepage, site detail pages, AI context

**Historical Data:**

- Source: `apps/web/constants/neihu-charging-station-data.json`
- Format: Hourly power snapshots `HourlyPowerRecord[]`
- Usage: Report API (`/api/neihu/report`), AI historical queries

---

## Database Schema

### Core Models

**User** (with relations):

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  chatSessions ChatSession[]
  usageMetrics UsageMetric[]
}
```

**ChatSession** (AI conversations):

```prisma
model ChatSession {
  id            String    @id @default(cuid())
  userId        String
  title         String    @default("新對話")
  lastMessageAt DateTime?
  createdAt     DateTime  @default(now())

  user     User      @relation(...)
  messages Message[]
}
```

**Message** (chat messages with chart support):

```prisma
model Message {
  id          String             @id @default(cuid())
  sessionId   String
  role        MessageRole        // user | assistant
  content     String             @db.Text
  contentType MessageContentType @default(text) // text | chart | mixed
  chartConfig Json?              // Stores chart configuration for AI responses
  createdAt   DateTime           @default(now())

  session ChatSession @relation(...)
}
```

**UsageMetric** (token tracking):

```prisma
model UsageMetric {
  id               String   @id @default(cuid())
  userId           String
  promptTokens     Int
  completionTokens Int
  totalTokens      Int
  createdAt        DateTime @default(now())

  user User @relation(...)
}
```

**Prisma Configuration:**

- Client output: `lib/generated/prisma/`
- Adapter: PrismaPg with PostgreSQL connection pool
- Connection: `DATABASE_URL` environment variable
- Platforms: native, darwin-arm64, debian-openssl-3.0.x

---

## Authentication & Role-Based Access Control

### Auth Flow

1. **Sign In/Up**: POST to `/api/auth/signin` or `/api/auth/signup`
   - Validates against `ALLOWED_EMAILS` whitelist in `constants/auth-constants.ts`
   - Hashes passwords with bcrypt
   - Returns JWT token set as HTTP-only cookie (`auth-token`)

2. **Auth Check**: GET `/api/auth/me`
   - Validates JWT and returns user info (including role)

3. **Sign Out**: POST `/api/auth/signout`
   - Clears JWT cookie

4. **Change Password**: PUT `/api/auth/update-password`
   - Requires authentication

5. **Protected Routes**: Use `useAuthGuard()` hook
   - Redirects unauthenticated users to `/auth/signin`
   - Supports `allowedRoles` parameter for role-based page access

### Role-Based Access Control (RBAC)

**Roles** (defined in [`constants/auth-constants.ts`](apps/web/constants/auth-constants.ts)):

| Role | Home Page | Site Pages | Engineering Page |
|------|-----------|------------|-----------------|
| `admin` | ✅ | All sites | ✅ |
| `worker` | ❌ | Permitted sites only | ❌ |
| `viewer` | ❌ | Permitted sites only | ❌ |

- Roles are mapped by email in `USER_ROLES` record
- Each user can have `sitePermissions: SiteId[]` to restrict site access
- Users not in `USER_ROLES` default to `viewer` with no site permissions
- `getUserRoleConfig(email)` returns the role config for a given email

**Middleware:** [`apps/web/middleware/auth.ts`](apps/web/middleware/auth.ts)

- `getCurrentUser()` - Get current user from JWT
- `requireAuth()` - Throw error if not authenticated

---

## Important Development Patterns

### File Naming Conventions

- **Files**: kebab-case (`battery-soc-chart.tsx`)
- **Components**: PascalCase (`BatterySOCChart`)
- **Functions**: camelCase (`calculateElectricityCost`)
- **Constants**: UPPER_SNAKE_CASE (`SUMMER_PEAK_RATE`)
- **Types**: PascalCase with suffix (`TelemetryData`, `SiteConfig`)
- **Test files**: `*.test.ts` or `*.test.tsx`

### Component Organization

```
components/
├── ai-chat/       # AI chat interface & chart rendering
├── auth/          # Auth forms (signin, signup)
├── history/       # Historical data charts (power-demand, peak-demand)
├── home/          # Home page components (map, sidebar, summary)
├── layouts/       # Layout components (navbar, sidebar)
├── providers/     # Context providers
├── report/        # Report page components
├── site/          # Site detail components (energy flow, power-demand-chart)
└── ui/            # shadcn/ui primitives (Radix UI)
```

- Chart components use Recharts with custom styling
- Server/Client components properly separated (use `"use client"` when needed)
- Import aliases: `@/` maps to `apps/web/` root

### Page Structure

- **Home Page** ([`app/page.tsx`](apps/web/app/page.tsx)): Multi-site overview with Mapbox GL map, site sidebar, and summary cards (admin only)
- **Site Detail** ([`app/sites/[siteId]/page.tsx`](apps/web/app/sites/[siteId]/page.tsx)): Single-site monitoring with real-time charts and energy flow diagrams
- **History** ([`app/sites/[siteId]/history/page.tsx`](apps/web/app/sites/[siteId]/history/page.tsx)): Historical data analysis with power demand charts
- **Report** ([`app/sites/[siteId]/report/page.tsx`](apps/web/app/sites/[siteId]/report/page.tsx)): Monthly/annual reports with BESS cost comparison
- **Engineering** ([`app/sites/[siteId]/engineering/page.tsx`](apps/web/app/sites/[siteId]/engineering/page.tsx)): Engineering view (admin/worker only)
- **Profile** ([`app/profile/page.tsx`](apps/web/app/profile/page.tsx)): User profile and password management
- **Auth** ([`app/auth/signin/`](apps/web/app/auth/signin/), [`app/auth/signup/`](apps/web/app/auth/signup/)): Authentication pages

### Adding New Features

**New Site Configuration:**

1. Add `SiteId` type in `types/data-type.ts`
2. Add site config in `config/site-configs.ts`
3. Register in `SITE_CONFIGS` map
4. Update `stores/data-store.ts` initial state

**New AI Feature:**

1. Create service in `services/ai/`
2. Add prompt in `lib/ai/prompts.ts`
3. Integrate in `/api/ai/chat/route.ts`
4. Create test in `scripts/tests/integration/`

---

## Environment Variables

Required in `apps/web/.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vpp_db"

# JWT Secret (use strong random value)
JWT_SECRET="your-super-secret-jwt-key-here"

# Mapbox (for maps)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-mapbox-token"

# Anthropic API (for AI chat)
ANTHROPIC_API_KEY="sk-ant-your-api-key"

# External API
NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:3003/neihu/data"

# Node Environment
NODE_ENV="development" # or "production"
```

---

## Testing Strategy

### Test Structure

```
scripts/tests/
├── integration/       # API, BESS, data flow tests
├── unit/             # Pure function tests (bess-unified)
├── e2e/              # End-to-end user flow tests
└── type-checking/    # TypeScript type checking
```

### Key Test Cases

1. **BESS simulation accuracy** - Verify charge/discharge logic, SOC calculation
2. **Electricity cost accuracy** - Confirm peak/off-peak rates, savings rate
3. **Cross-day SOC persistence** - Ensure Friday→Monday SOC correctly maintained
4. **Weekend/holiday disable** - Verify no charge/discharge on non-working days
5. **API integration** - Test external API data fetching and processing

### Running Tests

```bash
cd apps/web

# Most comprehensive BESS test
npx tsx scripts/tests/integration/electricity-cost-comparison.test.ts

# Cross-day SOC test
npx tsx scripts/tests/integration/cross-day-soc.test.ts

# All tests
pnpm test
```

---

## Turborepo Configuration

**Task Pipeline** ([`turbo.json`](turbo.json)):

- `build`: Depends on `^build`, outputs `.next/**` (excluding cache)
- `dev`: No cache, persistent task
- `lint` / `lint:fix`: Depends on `^lint` / `^lint:fix`
- `check-types`: Depends on `^check-types`
- `test`: Depends on `^build`, env: `DATABASE_URL`, `JWT_SECRET`, `TEST_BASE_URL`
- `test:unit`: No dependencies
- `test:integration`: Depends on `^build`, env: `DATABASE_URL`, `JWT_SECRET`

**Environment Variables:**

- `DATABASE_URL`, `NODE_ENV`, `NEXT_RUNTIME` passed to build tasks via `env` field

---

## Code Quality Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Zero warnings tolerance (`--max-warnings 0`)
- **Prettier**: Consistent code formatting
- **Type Checking**: `tsc --noEmit` + Next.js `typegen`

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signin` | POST | Sign in |
| `/api/auth/signup` | POST | Sign up |
| `/api/auth/signout` | POST | Sign out |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/update-password` | PUT | Change password |
| `/api/ai/chat` | POST | AI chat |
| `/api/ai/sessions` | GET/POST | List/create chat sessions |
| `/api/ai/sessions/[id]` | GET/DELETE | Get/delete chat session |
| `/api/neihu/data` | GET | Neihu real-time data |
| `/api/neihu/data-json` | GET | Neihu JSON data |
| `/api/neihu/daily/[dateStr]` | GET | Neihu daily data by date |
| `/api/neihu/report` | GET | Neihu report |
| `/api/etai/report` | GET | ETai report (with DR) |
| `/api/history/[siteId]` | GET | Historical data by site |

---

## Additional Resources

- **Main README**: [`README.md`](README.md) - Complete project overview
- **Documentation Hub**: [`apps/web/docs/README.md`](apps/web/docs/README.md) - All technical docs
- **Project Structure**: [`apps/web/docs/PROJECT_STRUCTURE.md`](apps/web/docs/PROJECT_STRUCTURE.md) - Architecture details
- **BESS Algorithms**: [`apps/web/docs/REPORT_ALGORITHM_SUMMARY.md`](apps/web/docs/REPORT_ALGORITHM_SUMMARY.md) - Core algorithms
- **AI Module**: [`apps/web/docs/AI_MODULE_STRUCTURE.md`](apps/web/docs/AI_MODULE_STRUCTURE.md) - AI design
- **Test Results**: [`apps/web/docs/TEST-RESULTS.md`](apps/web/docs/TEST-RESULTS.md) - Test records

---

**Last Updated:** 2026-05-22
**Maintained by:** Fortune ESS Development Team

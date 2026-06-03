# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **VPP (Virtual Power Plant) Dashboard** - a Next.js application for monitoring and managing energy storage systems and EV charging sites. The project is a Turborepo monorepo that provides:

- ⚡ **Real-time Energy Monitoring** - Battery status, charging pile usage, energy flow visualization
- 💰 **Intelligent Cost Optimization** - Peak/off-peak management, automatic savings calculation (15-20% cost reduction)
- 🔋 **Cross-Day SOC Simulation** - Accurate battery charge/discharge strategy simulation
- 📊 **Historical Data Analysis** - Monthly/annual reports, cost comparison, trend analysis

**Key Sites:**

- **Neihu (內湖)**: EV charging station with 370kWh BESS, real-time data from external API
- **ETai (億泰電纜)**: High-voltage industrial site with 10MWh BESS + Demand Response program

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

# Run only the frontend app
turbo dev --filter=frontend
```

### Building

```bash
# Build all apps and packages
pnpm build

# Build only the frontend app
turbo build --filter=frontend
```

### Linting & Type Checking

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format
```

### Database Operations (Prisma)

```bash
cd apps/frontend

# Generate Prisma client (only safe operation from this app)
npx prisma generate

# Migrations are NOT run from apps/frontend — schema is owned here but
# run migrate dev / migrate deploy from a dedicated migration environment
```

### Docker

```bash
# Build and start all services (postgres + frontend)
docker compose up --build

# Start in background
docker compose up -d --build

# View logs
docker compose logs -f frontend
```

---

## Architecture Overview

### Monorepo Structure

```
vpp-template/                           # Turborepo root
├── CLAUDE.md                           # This file (Claude guidance)
├── docker-compose.yml                  # Docker Compose (postgres + frontend)
├── turbo.json                          # Turborepo configuration
├── apps/
│   └── frontend/                       # Main Next.js application (port 3000)
│       ├── Dockerfile                  # Multi-stage Docker build
│       ├── .dockerignore
│       ├── next.config.ts              # Next.js config (output: standalone)
│       ├── app/                        # Next.js App Router
│       │   ├── api/                    # API routes
│       │   ├── auth/                   # Sign in / Sign up pages
│       │   ├── sites/[siteId]/         # Site detail, history, report pages
│       │   └── page.tsx                # Home dashboard
│       ├── components/                 # React components
│       │   ├── home/                   # Dashboard (map, finance card, stats)
│       │   ├── site/                   # Site detail components
│       │   ├── history/                # Historical analysis components
│       │   ├── report/                 # Report page components
│       │   ├── controller/             # 維運操作面板 components (mock, no real API)
│       │   ├── notify/                 # Notification list + item components
│       │   ├── auth/                   # Auth forms
│       │   ├── layout/                 # Sidebar (with unread badge)
│       │   ├── providers/              # AuthProvider + NotificationProvider
│       │   └── ui/                     # shadcn/ui primitives
│       ├── config/
│       │   └── site-configs.ts         # BESS configs (rates, SOH, DR, sReg)
│       ├── constants/
│       │   ├── auth-constants.ts       # ALLOWED_EMAILS + USER_ROLES RBAC
│       │   ├── chart-colors.ts         # CHART_COLORS — single source of truth
│       │   ├── notification-rules.ts   # Alert thresholds + cooldown durations per rule
│       │   ├── taiwan-holidays.ts      # Taiwan holidays 2022–2026
│       │   └── ETai_2021_2025.json     # ETai hourly load data (2.1 MB)
│       ├── hooks/
│       │   ├── use-auth-guard.ts       # Auth redirect + role check
│       │   ├── use-battery-data.ts     # Derives BatteryData from data-store
│       │   ├── use-live-stats.ts       # Polls /api/neihu/data every 10s
│       │   └── use-notification-engine.ts # Watches data-store; debounced rule evaluation
│       ├── lib/
│       │   ├── prisma.ts               # PrismaClient singleton (PrismaPg)
│       │   └── utils.ts                # shadcn cn() helper
│       ├── prisma/
│       │   └── schema.prisma           # User model only
│       ├── stores/
│       │   ├── auth-store.ts           # Zustand auth (JWT + localStorage)
│       │   ├── controller-store.ts     # Zustand controller mock state + operations (NOT persisted)
│       │   ├── data-store.ts           # Zustand site data + BESS state
│       │   └── notification-store.ts   # Zustand notifications (localStorage: vpp-notification-store)
│       ├── types/
│       │   ├── auth.ts                 # User, AuthState, UserRole
│       │   ├── bess-type.ts            # PersistedBESSState
│       │   ├── controller-types.ts     # SystemStatus, PCSStatus, BMSStatus, ControlOperation, BESSMetrics, etc.
│       │   ├── data-type.ts            # SiteId, SummaryData, PeriodSavings
│       │   ├── notification-type.ts    # Notification, PendingNotification, NotificationSeverity
│       │   ├── report-type.ts          # Report types
│       │   └── telemetry.ts            # TelemetryData
│       └── utils/
│           ├── bess-algorithm/         # Modular BESS simulation
│           │   ├── index.ts            # Barrel export
│           │   ├── constants.ts        # Config constants
│           │   ├── time-utils.ts       # Taiwan TZ peak detection
│           │   ├── electricity-rate.ts # Season-aware rate lookup
│           │   ├── state.ts            # State creation & voltage calc
│           │   ├── step-simulation.ts  # Core single-step logic
│           │   ├── realtime-simulation.ts # Batch real-time processing
│           │   ├── cost-calculation.ts # Cost computation (with/without BESS)
│           │   ├── report-simulation.ts # Report-specific simulation
│           │   └── legacy.ts           # Legacy wrappers
│           ├── bess-unified.ts         # Re-export barrel (backward compat)
│           ├── echarts-helpers.ts      # ECharts helpers (axisStyle, tooltipStyle, areaGradient)
│           ├── feature-flags.ts        # FEATURE_FLAGS.USE_NEIHU_SIMULATION
│           ├── live-stats.ts           # calcLiveStats() — kWh + cost from telemetry
│           ├── mock-controller-data.ts # Initial mock state for controller (Neihu/ETai) + applyRandomVariation()
│           ├── notification-engine.ts  # Pure fn: evaluateNotificationRules() → PendingNotification[]
│           ├── period-savings.ts       # calculatePeriodSavings(period)
│           ├── report-csv-export.ts    # CSV export for reports
│           └── report-generator.ts     # generateReport() — BESS simulation over date range
└── packages/                           # Shared packages
    ├── eslint-config/                  # Shared ESLint config
    └── typescript-config/              # Shared TypeScript config
```

### Tech Stack

- **Framework**: Next.js 16.2.7 (App Router, output: standalone)
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19.2, Tailwind CSS v4, `@base-ui/react` (shadcn)
- **State Management**: Zustand 5 (`auth-store` + `data-store` + `notification-store` + `controller-store`)
- **Database**: PostgreSQL via Prisma 7 + PrismaPg adapter
- **Authentication**: JWT (7d) + bcrypt + HTTP-only cookies
- **Charts**: ECharts 5 (`echarts-for-react`)
- **Maps**: MapLibre GL 5
- **Forms**: react-hook-form + zod
- **Package Manager**: pnpm 9.0.0
- **Monorepo Tool**: Turborepo
- **Container**: Docker (multi-stage, node:22-alpine)

---

## Key Modules & Architecture

### 1. 🔋 BESS Simulation Core

**Location:** [`apps/frontend/utils/bess-algorithm/`](apps/frontend/utils/bess-algorithm/)
**Re-export:** [`apps/frontend/utils/bess-unified.ts`](apps/frontend/utils/bess-unified.ts)

| Module | Purpose |
|--------|---------|
| `step-simulation.ts` | Core single-step simulation logic |
| `realtime-simulation.ts` | Batch processing of real-time data |
| `cost-calculation.ts` | Electricity cost (with/without BESS) |
| `report-simulation.ts` | Report-specific simulation |
| `time-utils.ts` | `isPeakTimeTW()`, `isSemiPeakTimeTW()` |
| `electricity-rate.ts` | `getElectricityRate()` — season-aware |
| `state.ts` | State creation & voltage calculation |
| `constants.ts` | Configuration constants |
| `legacy.ts` | Legacy function wrappers |

**Critical Rules - MUST FOLLOW:**

- ✅ SOC never guessed: calculated from previous state, no time heuristics
- ✅ Charging only on weekdays at 00:00: one session per day (weekends/holidays disabled)
- ✅ Full power charging: PCS max power (not limited by contract capacity)
- ✅ Stop when full: `chargeSessionActive = false`
- ✅ Peak discharge: follows load, limited by PCS (weekdays only)
- ✅ Weekend/Holiday: completely disabled (no charging, no discharging)
- ✅ Cross-day persistence: SOC state persists via localStorage (`vpp-bess-state-{siteId}`)

**Feature flag:** `FEATURE_FLAGS.USE_NEIHU_SIMULATION` in `utils/feature-flags.ts` — when `true`, `data-store.ts` runs `simulateBESSForRealData()` on every fetch.

### 2. 💰 Electricity Pricing Algorithm

**Location:** [`apps/frontend/config/site-configs.ts`](apps/frontend/config/site-configs.ts)

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

**ETai Rates (batch-tou, NT$/kWh):**

| Period | Summer (5/16-10/15) | Non-Summer |
|--------|-------------------|------------|
| **Peak** | 12.47 | 11.79 |
| **Semi-Peak** | 3.26 | 3.00 |
| **Off-Peak** | 3.18 | 3.18 |

**Calculation:**

```typescript
Total Cost = (Peak × PeakRate) + (SemiPeak × SemiPeakRate) + (OffPeak × OffPeakRate)
Savings = Cost Without BESS - Cost With BESS
```

### 2.1 ⚡ Demand Response (DR) Program

**Applies to:** ETai only | **Season:** May 1 - October 31 (weekdays, excl. holidays)

```typescript
Daily DR Discount = 1000 kW × 1.0 × 4h × NT$1.84 × 1.2 = NT$8,832/day
```

**Key functions:** `isDRSeasonDate()`, `getDailyDRCost()` in `site-configs.ts`

### 3. 📊 State Management

**data-store.ts** — `useSiteDataStore`

- Manages `TelemetryData[]`, `SummaryData`, `PersistedBESSState` per site
- Runs BESS simulation on fetch (controlled by `FEATURE_FLAGS.USE_NEIHU_SIMULATION`)
- Persists BESS state to localStorage per site
- ETai returns empty mock data (no real-time backend)

**auth-store.ts** — `useAuthStore`

- JWT-based auth (HTTP-only cookies)
- Persisted to localStorage (key: `fe-auth-storage`)
- Methods: `signIn()`, `signUp()`, `signOut()`, `checkAuth()`

**notification-store.ts** — `useNotificationStore`

- Stores `Notification[]` + `lastFiredAt` (cooldown tracking) per ruleId
- Persisted to localStorage (key: `vpp-notification-store`)
- Methods: `addNotifications()`, `markRead()`, `markAllRead()`, `clear()`
- Max 100 notifications retained; newest prepended

**controller-store.ts** — `useControllerStore`

- Mock state for the 維運操作面板 (Controller page) — **NOT persisted** (resets on page refresh)
- Holds `ControllerSiteState` per site: `systemStatus`, `pcsStatus`, `bmsStatus`, `operationMode`, `bessMetrics`, `sensors`, `errorCodes`, `lastOperation`
- `performOperation(siteId, op)` — simulates 2-second async operation, then updates state per operation type
- `tickVariation()` — apply ±0.5% SOC / ±1°C temperature random drift (called every 5s from controller page)
- Initial state generated by `utils/mock-controller-data.ts`

### 4. 🔔 Notification System

**Location:** `utils/notification-engine.ts`, `stores/notification-store.ts`, `hooks/use-notification-engine.ts`

Rules are evaluated client-side against the live data-store. No backend required.

| Rule ID | Trigger | Severity | Site | Cooldown |
|---------|---------|----------|------|----------|
| `neihu-soc-low` | SOC < 15% | warning | Neihu | 30 min |
| `neihu-soc-full` | SOC ≥ 95% | info | Neihu | 60 min |
| `neihu-power-warning` | Power > 90% of 432 kW | warning | Neihu | 15 min |
| `neihu-power-critical` | Power > 100% of 432 kW | critical | Neihu | 10 min |
| `neihu-data-stale` | Last update > 15 min | warning | Neihu | 30 min |
| `neihu-charger-idle` | Active chargers = 0 | info | Neihu | 60 min |
| `etai-dr-season-active` | Date in 5/1–10/31 | info | ETai | 24 hr |

**Data flow:**
```
data-store lastUpdated / user changes
  → use-notification-engine.ts (debounce 3s)
  → evaluateNotificationRules() [pure fn — no side effects]
  → filter by lastFiredAt cooldown (notification-store)
  → addNotifications() → localStorage persist
  → sidebar Bell badge (unread count)
  → /notify page (filter tabs: 全部 / 未讀 / 重要 / 內湖 / 億泰)
```

**RBAC filtering:** admin sees all sites; worker/viewer filtered by `sitePermissions`.
**Thresholds:** edit `constants/notification-rules.ts` — `NOTIFICATION_THRESHOLDS` + `NOTIFICATION_COOLDOWNS_MS`.

### 5. 🗄️ Data Sources

**Real-time Data (Neihu only):**

- Route: `GET /api/neihu/data?range=today`
- Proxies to: `fortune-ess.com.tw/neihu/data`
- Format: `{ data: TelemetryData[] }`
- ETai: no backend — returns empty

**Historical Data (ETai report):**

- Source: `constants/ETai_2021_2025.json` (2.1 MB, server-side only)
- Usage: `/api/etai/report` → `generateReport()`

---

## Database Schema

**User** (only model in `apps/frontend/prisma/schema.prisma`):

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- Client output: `lib/generated/prisma/`
- Adapter: PrismaPg with PostgreSQL connection pool
- Connection: `DATABASE_URL` environment variable
- **Do NOT run `prisma migrate` from `apps/frontend`** — schema is minimal (User only)

---

## Authentication & Role-Based Access Control

### Auth Flow

1. **Sign In**: `POST /api/auth/signin` — whitelist check → bcrypt → JWT (7d) cookie
2. **Sign Up**: `POST /api/auth/signup` — whitelist check → bcrypt hash → create user
3. **Auth Check**: `GET /api/auth/me` — verify JWT → return user + role
4. **Sign Out**: `POST /api/auth/signout` — clear cookie
5. **Change Password**: `PUT /api/auth/update-password`
6. **Delete Account**: `DELETE /api/auth/delete-account`
7. **Protected Routes**: `useAuthGuard()` hook — redirects to `/auth/signin`

### RBAC Roles (`constants/auth-constants.ts`)

| Role | Access |
|------|--------|
| `admin` | All pages, all sites |
| `worker` | Controller page + permitted sites only |
| `viewer` | Permitted sites only (read-only, no Controller) |

- Roles mapped by email in `USER_ROLES`
- `sitePermissions: SiteId[]` restricts site access per user
- Default for unknown emails: `viewer` with no site permissions

---

## Environment Variables

Required in `apps/frontend/.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vpp_db"

# JWT Secret (use strong random value)
JWT_SECRET="your-super-secret-jwt-key-here"

# External API (Neihu real-time data backend)
NEXT_PUBLIC_API_BASE_URL="https://fortune-ess.com.tw/neihu/data"

# Node Environment
NODE_ENV="development" # or "production"
```

---

## Important Development Patterns

### File Naming Conventions

- **Files**: kebab-case (`battery-soc-chart.tsx`)
- **Components**: PascalCase (`BatterySOCChart`)
- **Functions**: camelCase (`calculateElectricityCost`)
- **Constants**: UPPER_SNAKE_CASE (`CHART_COLORS`)
- **Types**: PascalCase with suffix (`TelemetryData`, `SiteConfig`)

### Charts

- All charts use **ECharts** via `echarts-for-react`
- Use helpers from `utils/echarts-helpers.ts` for consistent axis/tooltip/grid styling
- Use `CHART_COLORS` from `constants/chart-colors.ts` — do not hardcode hex values

### Component Organization

```
components/
├── home/        # Dashboard: map, finance card, stats
├── site/        # Site detail: SOC chart, energy flow, power demand
├── history/     # Historical: power demand chart, summary, table
├── report/      # Report: trend chart, cumulative savings, detail table
├── controller/  # 維運操作面板: status panels, control buttons, confirm modal
├── notify/      # Notification list + item card
├── auth/        # Sign in / sign up forms
├── layout/      # Sidebar (role-aware nav)
├── providers/   # AuthProvider + NotificationProvider
└── ui/          # shadcn/ui primitives (@base-ui/react)
```

- Import alias: `@/` maps to `apps/frontend/` root
- Use `"use client"` directive only where needed (hooks, event handlers)

### Adding a New Site

1. Add `SiteId` to `types/data-type.ts` and `components/home/types.ts`
2. Add site config to `config/site-configs.ts` and register in `getSiteConfig()`
3. Add coordinates + metadata to `components/home/site-map.tsx` `SITES` array
4. Add initial state for the new site in `stores/data-store.ts`
5. Add API route under `app/api/<sitename>/report/`
6. Update `components/home/finance-card.tsx` route selector
7. Update `hooks/use-live-stats.ts` if the site has a real-time backend
8. Add notification rules for the new site in `constants/notification-rules.ts` + `utils/notification-engine.ts`
9. Add mock controller state for the new site in `utils/mock-controller-data.ts` (`createInitialControllerState`)

---

## Turborepo Configuration

**Task Pipeline** ([`turbo.json`](turbo.json)):

- `build`: Depends on `^build`, outputs `.next/**` (excluding cache)
- `dev`: No cache, persistent task
- `lint` / `lint:fix`: Depends on `^lint` / `^lint:fix`
- `check-types`: Depends on `^check-types`

**Environment Variables passed to build:** `DATABASE_URL`, `NODE_ENV`, `NEXT_RUNTIME`

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signin` | POST | Sign in |
| `/api/auth/signup` | POST | Sign up |
| `/api/auth/signout` | POST | Sign out |
| `/api/auth/me` | GET | Get current user + role |
| `/api/auth/update-password` | PUT | Change password |
| `/api/auth/delete-account` | DELETE | Delete account |
| `/api/neihu/data` | GET | Neihu real-time data (CORS proxy) |
| `/api/neihu/report` | GET | Neihu BESS financial report |
| `/api/etai/report` | GET | ETai BESS financial report (with DR) |
| `/api/history/[siteId]` | GET | Historical aggregated data by site |

---

**Last Updated:** 2026-06-03 (added Controller 維運操作面板)
**Maintained by:** Fortune ESS Development Team

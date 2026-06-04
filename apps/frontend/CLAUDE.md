# Frontend App — CLAUDE.md

> VPP Dashboard frontend — Next.js 16 + Tailwind v4 + shadcn/ui (base-ui).
> Dark warm-brown theme. Targets executive users who need financial + operational snapshots.

---

## Quick Commands

```bash
pnpm dev          # start dev server (port varies per turbo config)
pnpm build        # production build
pnpm lint         # ESLint
pnpm check-types  # tsc --noEmit
```

---

## Directory Structure

```
apps/frontend/
│
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── auth/               # Auth endpoints
│   │   │   ├── signin/         # POST — bcrypt + JWT cookie
│   │   │   ├── signup/         # POST — whitelist check + create user
│   │   │   ├── signout/        # POST — clear cookie
│   │   │   ├── me/             # GET — verify JWT, return user + role
│   │   │   ├── update-password/ # PUT — bcrypt re-hash
│   │   │   └── delete-account/  # DELETE — remove user
│   │   ├── neihu/
│   │   │   ├── data/           # CORS proxy → fortune-ess.com.tw/neihu/data
│   │   │   └── report/         # Neihu BESS financial report (calls backend /hourly)
│   │   ├── etai/
│   │   │   └── report/         # ETai BESS financial report (reads local JSON)
│   │   └── history/
│   │       └── [siteId]/       # GET historical aggregated data by site
│   │
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── sites/
│   │   └── [siteId]/
│   │       ├── page.tsx        # Site detail — real-time charts, energy flow, battery
│   │       ├── history/page.tsx # Historical data analysis (power demand charts)
│   │       └── report/page.tsx  # Monthly/annual BESS cost comparison report
│   │
│   ├── controller/page.tsx     # /controller — 維運操作面板 (admin + worker only, mock)
│   ├── management/page.tsx     # placeholder
│   ├── notify/page.tsx         # /notify — NotificationList (filter tabs + stats row)
│   ├── profile/page.tsx        # placeholder
│   ├── layout.tsx              # root layout — mounts AuthProvider + NotificationProvider, loads Noto Sans
│   ├── globals.css             # CSS variables (dark warm-brown palette) + shadcn/tailwind imports
│   └── page.tsx                # Home page — composes Sidebar + Dashboard
│
├── components/
│   ├── layout/
│   │   └── sidebar.tsx         # App-level nav sidebar (icons, active state, logout)
│   │
│   ├── home/                   # Dashboard page components
│   │   ├── index.tsx           # Dashboard root — holds selectedSiteId state, wires map ↔ cards
│   │   ├── left-column.tsx     # Left layout column (finance card + stats row)
│   │   ├── right-column.tsx    # Right layout column (site map)
│   │   ├── finance-card.tsx    # Financial report card (date picker → API → KPI grid)
│   │   ├── finance-charts.tsx  # ECharts visualizations for finance card
│   │   ├── site-map.tsx        # MapLibre GL map with site markers + popups
│   │   ├── electricity-stats.tsx # Live electricity usage & cost (data-store, BESS simulation)
│   │   ├── bess-stats.tsx      # BESS status & charging pile usage
│   │   └── types.ts            # Legacy SiteStats, SITE_STATS (use types/data-type.ts for new code)
│   │
│   ├── site/                   # Site detail page components
│   │   ├── battery-soc-chart.tsx      # ECharts battery SOC over time
│   │   ├── charger-status-grid.tsx    # Grid of AC charger status
│   │   ├── energy-flow-diagram.tsx    # Energy flow visualization
│   │   ├── power-demand-chart.tsx     # ECharts power demand + BESS overlay
│   │   └── site-summary-cards.tsx    # KPI summary cards for site detail
│   │
│   ├── history/                # Historical analysis components
│   │   ├── history-detail-table.tsx   # Hourly data table
│   │   ├── history-power-demand-chart.tsx # ECharts power demand over history
│   │   └── history-summary-cards.tsx  # Summary KPIs for history view
│   │
│   ├── report/                 # Report page components
│   │   ├── report-cumulative-savings-chart.tsx # ECharts cumulative savings
│   │   ├── report-date-picker.tsx             # Month/year date picker
│   │   ├── report-detail-table.tsx            # Day-by-day breakdown table
│   │   ├── report-energy-breakdown.tsx        # Energy breakdown chart
│   │   ├── report-summary-card.tsx            # Single KPI card
│   │   ├── report-summary-cards.tsx           # Grid of report KPI cards
│   │   └── report-trend-chart.tsx             # ECharts cost trend
│   │
│   ├── auth/
│   │   ├── signin-form.tsx     # Sign-in form (react-hook-form + zod)
│   │   ├── signup-form.tsx     # Sign-up form
│   │   └── form-input.tsx      # Reusable labeled input with icon (forwardRef)
│   │
│   ├── controller/             # 維運操作面板 — all mock, no real API
│   │   ├── controller-header.tsx          # Title + site selector + LiveClock + mode badge + last-op log
│   │   ├── system-status-overview.tsx     # 3-column: System / PCS / BMS status cards
│   │   ├── bess-monitoring-panel.tsx      # KPI row: SOC, SOH, power, capacity, execution rate, voltage
│   │   ├── sensor-panel.tsx               # Battery rack temps + PCS/BMS/ambient/humidity sensors
│   │   ├── error-code-panel.tsx           # Active error codes list (FAULT/WARNING/INFO severity)
│   │   ├── control-panel.tsx              # Startup / Shutdown / Clear errors / Manual∕Auto toggle
│   │   ├── emergency-panel.tsx            # E-Stop (2-step + 3s countdown) + Fault Isolate
│   │   └── operation-confirm-modal.tsx    # Reusable confirm modal (danger/warning/info, optional countdown)
│   │
│   ├── notify/
│   │   ├── notification-list.tsx  # List with filter tabs (全部/未讀/重要/內湖/億泰) + stats row
│   │   └── notification-item.tsx  # Single notification card (severity dot, site chip, mark-read btn)
│   │
│   ├── providers/
│   │   ├── auth-provider.tsx      # Client component — calls checkAuth() on mount
│   │   └── notification-provider.tsx # Client component — mounts useNotificationEngine hook
│   │
│   └── ui/                     # shadcn/ui primitives (auto-generated, do not edit manually)
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── live-clock.tsx      # Client clock component (HH:MM:SS, updates every second)
│       ├── popover.tsx
│       └── date-range-picker.tsx  # Compound: Popover + Calendar (range mode) + zhTW locale
│
├── config/
│   └── site-configs.ts         # BESS simulation configs for Neihu & ETai (rates, SOH, DR, sReg)
│                               # Exports: isSummerDate, isDRSeasonDate, getDailyDRCost,
│                               # getSohForYear, getDCCapacity, calculateSRegRevenue, getSiteConfig
│
├── constants/
│   ├── auth-constants.ts       # ALLOWED_EMAILS whitelist + USER_ROLES RBAC mapping
│   ├── chart-colors.ts         # CHART_COLORS + CHART_COLORS_ARRAY — single source of truth for ECharts
│   ├── notification-rules.ts   # NOTIFICATION_THRESHOLDS (per-site alert thresholds) + NOTIFICATION_COOLDOWNS_MS
│   ├── taiwan-holidays.ts      # Taiwan national holidays 2022–2026 (Set<string>)
│   └── ETai_2021_2025.json     # ETai hourly load data (2.1 MB static JSON, used by ETai report API)
│
├── hooks/
│   ├── use-auth-guard.ts       # Redirects unauthenticated users; supports allowedRoles check
│   ├── use-battery-data.ts     # Derives BatteryData (soc, socKWh, current, voltage, soh) from data-store
│   ├── use-live-stats.ts       # Polls /api/neihu/data every 10s, returns null for ETai
│   └── use-notification-engine.ts  # Watches lastUpdated + user; debounce 3s; dispatches to notification-store
│
├── lib/
│   ├── prisma.ts               # PrismaClient singleton with PrismaPg adapter
│   └── utils.ts                # shadcn cn() helper
│
├── stores/
│   ├── auth-store.ts           # Zustand auth store (signIn / signUp / signOut / checkAuth)
│   │                           # Persists user + isAuthenticated to localStorage (key: fe-auth-storage)
│   ├── controller-store.ts     # Zustand controller mock store (useControllerStore)
│   │                           # NOT persisted — resets on refresh; tickVariation() drives 5s sensor drift
│   │                           # performOperation() simulates 2s async op + state machine transition
│   ├── data-store.ts           # Zustand site data store (useSiteDataStore)
│   │                           # Manages TelemetryData[], SummaryData, PersistedBESSState per site
│   │                           # Runs BESS simulation (if FEATURE_FLAGS.USE_NEIHU_SIMULATION)
│   │                           # Persists BESS state to localStorage (key: vpp-bess-state-{siteId})
│   └── notification-store.ts   # Zustand notification store (useNotificationStore)
│                               # Stores Notification[] + lastFiredAt cooldown map
│                               # Persists to localStorage (key: vpp-notification-store), max 100 items
│
├── types/
│   ├── auth.ts                 # User, AuthState, UserRole
│   ├── bess-type.ts            # PersistedBESSState and BESS-related types
│   ├── controller-types.ts     # SystemStatus, PCSStatus, BMSStatus, OperationMode, ControlOperation
│   │                           # BESSMetrics, SensorReadings, ErrorCode, OperationLog, ControllerSiteState
│   ├── data-type.ts            # SiteId, SiteType, SummaryData, PeriodSavings, SiteDataState
│   │                           # Also re-exports TelemetryData, ChargingPileEntry
│   ├── notification-type.ts    # Notification, PendingNotification, NotificationSeverity, NotificationStoreState
│   ├── report-type.ts          # Report data types
│   └── telemetry.ts            # TelemetryData (TotalUsage, BESS, ChargingInfo, createAt)
│
├── prisma/
│   └── schema.prisma           # User model only (shares DB with apps/web, DO NOT migrate from here)
│
└── utils/
    ├── bess-algorithm/         # Modular BESS simulation (mirrored from apps/web)
    │   ├── index.ts            # Public barrel export
    │   ├── constants.ts        # Config constants & helpers
    │   ├── time-utils.ts       # isPeakTimeTW(), isSemiPeakTimeTW() — Taiwan TZ peak detection
    │   ├── electricity-rate.ts # getElectricityRate(), getCurrentRate() — season-aware rate lookup
    │   ├── state.ts            # State creation & voltage calculation
    │   ├── step-simulation.ts  # Core single-step simulation logic
    │   ├── realtime-simulation.ts  # Batch real-time processing
    │   ├── cost-calculation.ts # Electricity cost computation (with/without BESS)
    │   ├── report-simulation.ts    # Report-specific simulation
    │   └── legacy.ts           # Legacy function wrappers
    ├── bess-unified.ts         # Re-export barrel for bess-algorithm (backward compat)
    ├── echarts-helpers.ts      # ECharts helpers: areaGradient, axisStyle, tooltipStyle, chartGrid, ntdFormatter
    ├── feature-flags.ts        # FEATURE_FLAGS.USE_NEIHU_SIMULATION (controls BESS sim on real data)
    ├── live-stats.ts           # calcLiveStats() — computes kWh + cost from TelemetryData[]
    ├── mock-controller-data.ts # createInitialControllerState() — Neihu (WARNING) + ETai (FAULT) mock
    │                           # applyRandomVariation(state) — ±0.5% SOC, ±1°C temp drift per tick
    ├── notification-engine.ts  # evaluateNotificationRules(input) — pure fn, returns PendingNotification[]
    │                           # Input: { summaryData, data, lastUpdated, now, allowedSites }
    ├── period-savings.ts       # calculatePeriodSavings(period) — monthly/annual savings from API
    ├── report-csv-export.ts    # CSV export for report data
    └── report-generator.ts     # generateReport() — full BESS simulation over date range
                                # Returns: costWithoutBESS, costWithBESS, savings, DR, sReg
```

---

## Tech Stack

| Layer | Library | Notes |
|---|---|---|
| Framework | Next.js 16.2.7 | App Router |
| Language | TypeScript 5 | strict mode |
| UI | React 19.2.4 | |
| Styling | Tailwind CSS v4 | dark warm-brown theme |
| UI Components | `@base-ui/react` v1.5 + shadcn | NOT `@radix-ui` |
| Charts | ECharts 5 + echarts-for-react | NOT Recharts |
| Maps | MapLibre GL 5 | NOT Mapbox |
| State | Zustand 5 | auth-store + data-store + notification-store + controller-store |
| Forms | react-hook-form + zod | |
| Database | PostgreSQL via Prisma 7 + PrismaPg | shared with apps/web |
| Auth | JWT (7d) + HTTP-only cookie | bcrypt passwords |
| Date | date-fns v4 + react-day-picker v10 | zhTW locale |

---

## Data Flow

### Real-time (Neihu only)
```
useSiteDataStore.fetchData("neihu")
  → GET /api/neihu/data?range=today
  → fortune-ess.com.tw/neihu/data (CORS proxy)
  → TelemetryData[]
  → simulateBESSForRealData() [if FEATURE_FLAGS.USE_NEIHU_SIMULATION]
  → SummaryData (electricityUsage, costs, savings, chargingPiles)
  → BESS state persisted to localStorage
  → electricity-stats.tsx / site-summary-cards.tsx
```

### Battery Data (site detail)
```
useBatteryData() hook
  → reads data-store (TelemetryData[])
  → replays 30-min time slots via processIntervalCrossingMidnight()
  → returns BatteryData { soc, socKWh, current, voltage, soh }
```

### Financial Report
```
User selects date range + clicks 查詢
  → GET /api/neihu/report?start=&end=   (Neihu)
       → fortune-ess.com.tw/neihu/hourly → generateReport()
  → GET /api/etai/report?start=&end=    (ETai)
       → constants/ETai_2021_2025.json  → generateReport()
  → finance-card.tsx / report/* components display KPI grid + charts
```

### Site Switch (Map → Cards)
```
User clicks map marker popup
  → site-map.tsx: popup.on("open") → onSiteSelect(siteId)
  → home/index.tsx: setSelectedSiteId(siteId)
  → finance-card.tsx re-queries with new siteId
  → electricity-stats.tsx switches data source (ETai → "暫無即時數據")
  → map flies to marker (zoom 14, 1s animation)
```

### Authentication
```
POST /api/auth/signin      → bcrypt.compare → JWT (7d) → HTTP-only cookie auth-token
POST /api/auth/signup      → whitelist check → bcrypt hash → create user
GET  /api/auth/me          → verify JWT → return user + role
POST /api/auth/signout     → clear cookie
PUT  /api/auth/update-password → bcrypt re-hash
DELETE /api/auth/delete-account → remove user record
Auth state: Zustand (auth-store.ts) + localStorage persistence
```

### Period Savings (monthly/annual)
```
useSiteDataStore.calculatePeriodSavings(period)
  → lazy-imports utils/period-savings.ts
  → queries report API for date range
  → returns PeriodSavings { savings, costWithoutBESS, costWithBESS, savingsRate, daysCount }
```

### Controller (維運操作面板)
```
app/controller/page.tsx mounts
  → useAuthGuard({ allowedRoles: ["admin", "worker"] })
  → useControllerStore — initial state from createInitialControllerState()
  → setInterval(tickVariation, 5000) — applies applyRandomVariation() to all siteStates
  → ControllerHeader: site selector (admin → dropdown; worker → sitePermissions)
  → SystemStatusOverview / BESSMonitoringPanel / SensorPanel / ErrorCodePanel re-render on store change

User clicks operation button (e.g., SHUTDOWN)
  → OperationConfirmModal (variant: warning)
  → onConfirm → performOperation(siteId, "SHUTDOWN")
      → isPending=true, sleep(2000)
      → siteStates[siteId].systemStatus = "OFFLINE", pcsStatus = "OFFLINE"
      → lastOperation log updated
      → isPending=false
  → UI reflects new status immediately

User clicks Emergency Stop
  → Step 1: OperationConfirmModal (danger) — user confirms
  → Step 2: countdown=3 rendered in modal (1s intervals)
  → countdown reaches 0 → performOperation(siteId, "EMERGENCY_STOP")
      → systemStatus: "FAULT", operationMode: "EMERGENCY_STOP"
```

### Notification Engine
```
data-store.lastUpdated / useAuthStore.user changes
  → use-notification-engine.ts (debounce 3s; also runs on mount after 2s)
  → evaluateNotificationRules({ summaryData, data, lastUpdated, now, allowedSites })
      — pure function, no side effects, returns PendingNotification[]
      — RBAC: admin → all sites; worker/viewer → sitePermissions only
  → filter by cooldown (lastFiredAt in notification-store)
  → notification-store.addNotifications()
      — generates id, sets isRead:false, updates lastFiredAt, prepends, trims to 100
      — persists to localStorage (vpp-notification-store)
  → sidebar Bell badge (unreadCount)
  → /notify page (NotificationList with filter tabs)
```

---

## Environment Variables

See `.env.example`. Required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (shared with apps/web) |
| `JWT_SECRET` | JWT signing secret (must match apps/web) |
| `NEXT_PUBLIC_API_BASE_URL` | Neihu backend base URL, e.g. `https://fortune-ess.com.tw/neihu/data` |
| `NODE_ENV` | `development` or `production` |

---

## Color Palette

All colors defined in `constants/chart-colors.ts` (CHART_COLORS) and CSS variables in `globals.css`.

| Token | Hex | Usage |
|---|---|---|
| Background | `#1E1208` | Page background |
| Card / Surface | `#2A1A0F` | Card backgrounds |
| Popover | `#241508` | Sidebar, popups |
| Border | `#3A2415` | All card/input borders |
| Accent (Orange) | `#E8883E` | Load, demand, primary actions, active states |
| Charge (Blue) | `#4A9EDB` | Battery charging, SOC |
| Discharge (Green) | `#7D9B7E` | Discharge, savings |
| Off-peak (Sand) | `#BEA98F` | Off-peak / secondary data |
| Contract Limit | `#E05454` | Overload indicator |
| Text | `#FFFFFF` | Primary text |
| Muted text | `rgba(255,255,255,0.4)` | Axis labels, secondary |

Use `CHART_COLORS.*` constants from `constants/chart-colors.ts` — do not hardcode hex values in components.

---

## Critical Rules

### Prisma
- `prisma/schema.prisma` contains only the `User` model. Do **not** run `prisma migrate` from this app — migrations are owned by `apps/web`. Only run `prisma generate` here.

### BESS Algorithm
- `config/site-configs.ts` and `utils/bess-algorithm/` are mirrored from `apps/web` and must stay in sync. Do not modify algorithm logic without mirroring the change in `apps/web`.
- `ETai_2021_2025.json` is a 2.1 MB static file. Do **not** import it client-side.

### Feature Flags
- `FEATURE_FLAGS.USE_NEIHU_SIMULATION` (currently `true`) controls whether `simulateBESSForRealData()` runs in `data-store.ts`. Disabling it skips BESS overlay on real data.

### ETai Real-time Data
- ETai has **no real-time backend**. `electricity-stats.tsx` shows "暫無即時數據" for ETai. Do not add fake real-time polling.

### Charts
- All charts use **ECharts** (via `echarts-for-react`). Do not introduce Recharts.
- Use helpers from `utils/echarts-helpers.ts` (axisStyle, tooltipStyle, areaGradient, chartGrid) for consistent styling.
- Use `CHART_COLORS` from `constants/chart-colors.ts` for all color values.

### shadcn/ui Version
- This app uses `@base-ui/react` (v1.5) — **not** `@radix-ui` and not `@base-ui-components/react`. `PopoverTrigger` does not support `asChild`. Style it directly via `className`.

### Auth
- JWT secret must match between this app and `apps/web` (shared database).
- `ALLOWED_EMAILS` in `constants/auth-constants.ts` is the whitelist — users not listed cannot sign in.

### State Management
- Use `useSiteDataStore` from `stores/data-store.ts` for all site telemetry and BESS state.
- Use `useAuthStore` from `stores/auth-store.ts` for auth state only.
- Use `useNotificationStore` from `stores/notification-store.ts` for notifications.
- Use `useControllerStore` from `stores/controller-store.ts` for controller mock state only.
- Do not manage telemetry state in component local state.

### Controller Mock Data
- `utils/mock-controller-data.ts` is the **only** source of initial controller state. Do not hardcode status values inside components.
- `controller-store.ts` is **not persisted** — state resets on every page refresh. This is intentional for a mock.
- Operation state machine transitions are defined in `performOperation()` inside `controller-store.ts`. Add new operations there, not in components.
- When adding a new site: add `createMock<SiteName>State()` in `mock-controller-data.ts` and register it in `createInitialControllerState()`.

### Notification System
- Edit thresholds in `constants/notification-rules.ts` — do **not** hardcode values in `notification-engine.ts`.
- `utils/notification-engine.ts` is a pure function — no store imports, no side effects. Keep it that way.
- The engine is called inside `hooks/use-notification-engine.ts` via `useSiteDataStore.getState()` to avoid stale closures.
- When adding a new site, add its rules to `constants/notification-rules.ts` and `utils/notification-engine.ts`, and extend the `NOTIFICATION_COOLDOWNS_MS` map.

---

## Adding a New Site

1. Add `SiteId` to `types/data-type.ts` and `components/home/types.ts`
2. Add site config to `config/site-configs.ts` and register in `getSiteConfig()`
3. Add coordinates + metadata to `site-map.tsx` `SITES` array
4. Add initial state for the new site in `stores/data-store.ts` (`data`, `summaryData`, `bessState`, `error`)
5. Add an API route under `app/api/<sitename>/report/`
6. Update `finance-card.tsx` route selector
7. Update `hooks/use-live-stats.ts` if the site has a real-time backend
8. Add thresholds to `constants/notification-rules.ts` + rule evaluation to `utils/notification-engine.ts`
9. Add `createMock<SiteName>State()` to `utils/mock-controller-data.ts` and register in `createInitialControllerState()`

---

## Known Limitations

| Item | Status |
|---|---|
| ETai real-time data | No backend — returns empty mock data |
| Auth route protection | `use-auth-guard.ts` exists but not enforced on all pages |
| Controller | Mock only — no real PCS/BMS API; state resets on page refresh |
| Management page | Empty placeholder |
| Solar power data | Always 0 — no solar data source wired up |
| Notifications | Client-side only; no push/email; ETai rules are date-based (no real-time data) |

# VPP Dashboard Template Plan

> Goal: Strip the production app down to a clean template — static mock data everywhere, auth API only. No real data fetching, no polling, no AI service.

---

## Summary of Changes

| Category | Action | Count |
|----------|--------|-------|
| API routes to **keep** | Auth only | 5 |
| API routes to **delete** | Data, AI | 9 |
| Stores | keep `auth-store`, rewrite `data-store` as static | 2 |
| New file | `constants/mock-data.ts` | 1 |
| Hooks to **delete** | `use-battery-data.ts` | 1 |
| Services to **delete** | `services/ai/` (entire folder) | 6 |
| Utils to **delete** | `utils/bess-algorithm/`, `utils/bess-unified.ts`, `utils/report-generator.ts` | 12 |
| Components — **no change needed** | All UI / layout / chart shells stay | — |

---

## 1. API Routes

### Keep (auth only)

```
app/api/auth/signin/route.ts        POST  — JWT sign in
app/api/auth/signup/route.ts        POST  — create account
app/api/auth/signout/route.ts       POST  — clear cookie
app/api/auth/me/route.ts            GET   — current user
app/api/auth/update-password/route.ts PUT  — change password
```

### Delete (entire folders)

```
app/api/ai/           ← chat, sessions
app/api/neihu/        ← data, data-json, daily/[dateStr], report
app/api/etai/         ← report
app/api/history/      ← [siteId]
```

---

## 2. Mock Data — new file

**Create:** `constants/mock-data.ts`

This single file provides all static values consumed by every page and component. No real types need to change — just feed the same shapes with hardcoded numbers.

```ts
// constants/mock-data.ts

export const MOCK_SITES = {
  neihu: {
    id: "neihu",
    name: "內湖充電站",
    location: { lng: 121.5654, lat: 25.0710 },
  },
  etai: {
    id: "etai",
    name: "億泰電纜",
    location: { lng: 121.5181, lat: 25.0173 },
  },
} as const;

// Summary card numbers (home page)
export const MOCK_SUMMARY = {
  electricityUsage: 1248.5,   // kWh
  totalCost: 38420,            // NT$
  solarPower: 312.8,           // kW
  energyStorage: 74,           // % SOC
  chargingPiles: { active: 8, total: 12 },
  savings: 7650,               // NT$
};

// Telemetry timeseries — 24 hourly points
export const MOCK_TELEMETRY = Array.from({ length: 24 }, (_, h) => ({
  timestamp: `2026-06-02T${String(h).padStart(2, "0")}:00:00`,
  gridPower: 300 + Math.round(Math.sin((h - 6) * 0.4) * 120),
  bessCharge: h >= 0 && h < 6 ? 80 : 0,
  bessDischarge: h >= 16 && h < 22 ? 100 : 0,
  soc: 20 + Math.round(Math.min(80, Math.max(0, h < 6 ? h * 13 : h > 22 ? (24 - h) * 10 : 78 - (h - 6) * 3))),
  solarPower: h >= 7 && h <= 18 ? Math.round(Math.sin(((h - 7) / 11) * Math.PI) * 200) : 0,
  loadPower: 250 + Math.round(Math.sin((h - 8) * 0.5) * 100),
}));

// Report monthly summary — 12 months
export const MOCK_MONTHLY_REPORT = Array.from({ length: 12 }, (_, i) => ({
  month: `2026-${String(i + 1).padStart(2, "0")}`,
  costWithBess: 28000 + i * 800,
  costWithoutBess: 36000 + i * 800,
  savings: 8000,
  savingsRate: 22.2,
  peakEnergy: 420 + i * 10,
  offPeakEnergy: 810 + i * 5,
}));

// History power demand — same 24-point shape
export const MOCK_HISTORY = MOCK_TELEMETRY;

// Charger status grid
export const MOCK_CHARGERS = Array.from({ length: 12 }, (_, i) => ({
  id: `CP${String(i + 1).padStart(2, "0")}`,
  status: i < 8 ? "charging" : i < 10 ? "available" : "offline",
  power: i < 8 ? 22 + (i % 3) * 7 : 0,
  soc: i < 8 ? 30 + i * 6 : null,
}));
```

---

## 3. Stores

### `auth-store.ts` — **no change**

Keeps JWT auth flow intact. Used by every page's auth guard.

### `data-store.ts` — **rewrite**

Remove all fetching logic, intervals, and external API calls. Replace with a simple store that returns mock data.

```ts
// stores/data-store.ts (template version)
import { create } from "zustand";
import { MOCK_SUMMARY, MOCK_TELEMETRY, SiteId } from "@/constants/mock-data";

interface DataStore {
  currentSite: SiteId;
  setCurrentSite: (id: SiteId) => void;
  // All data is static — no fetch, no interval
  summary: typeof MOCK_SUMMARY;
  telemetry: typeof MOCK_TELEMETRY;
}

export const useSiteDataStore = create<DataStore>(() => ({
  currentSite: "neihu",
  setCurrentSite: (id) => ({ currentSite: id }),
  summary: MOCK_SUMMARY,
  telemetry: MOCK_TELEMETRY,
}));
```

---

## 4. Pages — changes per page

### `app/page.tsx` (Home)

- Remove `fetchData` + `useEffect` interval
- Remove `setCurrentSite` / `fetchData` calls
- Keep: Navbar, SiteSidebar, MapSection, SummaryCards, mobile/desktop layout
- `SummaryCards` reads from mock store (no change to component)

**Before → After diff concept:**
```diff
- const { setCurrentSite, fetchData } = useSiteDataStore();
- useEffect(() => {
-   fetchData(selectedSite);
-   const interval = setInterval(() => fetchData(selectedSite), 10000);
-   return () => clearInterval(interval);
- }, [selectedSite]);
+ const { setCurrentSite } = useSiteDataStore();   // only site selection
```

---

### `app/sites/[siteId]/page.tsx` (Site Detail)

- Remove `fetchData` + polling interval
- Remove loading state tied to fetch
- Keep all chart components (PowerDemandChart, BatterySOCChart, EnergyFlowDiagram, ChargerStatusGrid)
- Components receive mock data from store directly
- Remove `AiChatButton` (no AI service)

---

### `app/sites/[siteId]/history/page.tsx` (History)

- Remove date-range fetch calls
- Feed `MOCK_HISTORY` directly into chart components
- Keep all chart UI: ChargeDischargChart, PeakDemandChart, SOCTrajectoryChart, HistoryDetailTable

---

### `app/sites/[siteId]/report/page.tsx` (Report)

- Remove report API call (`/api/neihu/report`, `/api/etai/report`)
- Feed `MOCK_MONTHLY_REPORT` into chart components
- Keep: DatePicker (local state only, no fetch on change), all chart components

---

### `app/sites/[siteId]/engineering/page.tsx` (Engineering)

- Keep layout as-is
- Replace any data fetching with mock constants

---

### `app/auth/signin/page.tsx` + `signup/page.tsx` — **no change**

Auth pages call real auth API routes — keep exactly as-is.

---

### `app/profile/page.tsx` — **no change**

Calls `update-password` auth route — keep as-is.

---

## 5. Hooks

### Keep
```
hooks/use-auth-guard.ts       ← RBAC / route protection
hooks/use-auth-error-handler.ts
hooks/use-toast.ts
```

### Delete
```
hooks/use-battery-data.ts     ← fetches live battery data, not needed
```

---

## 6. Services & Utils to Delete

```
services/ai/                  ← entire folder (6 files)
  ai-provider.ts
  chat-service.ts
  context-provider.ts
  historical-data-service.ts
  response-parser.ts
  usage-tracker.ts

utils/bess-algorithm/         ← entire folder (10 files, simulation only)
utils/bess-unified.ts         ← re-export shim for above
utils/report-generator.ts     ← report simulation logic

lib/ai/prompts.ts             ← AI system prompts
```

---

## 7. Components

### Delete
```
components/ai-chat/           ← ai-chat-button, ai-chat-modal, chart-renderer, message-item
```

### Keep everything else — no changes needed

All chart and UI components are pure display — they accept props and render. Once you pass mock data through the store, they work without modification.

```
components/ui/          ← shadcn primitives
components/site/        ← BatterySOCChart, EnergyFlowDiagram, PowerDemandChart…
components/report/      ← CostChart, BESSChart, ROI…
components/history/     ← all history charts
components/home/        ← Navbar, SiteSidebar, MapSection, SummaryCards
components/auth/        ← SigninForm, SignupForm, UserMenu
components/layouts/
components/providers/
```

---

## 8. Database & Prisma

Keep the Prisma schema **as-is** — the auth tables (User) are still needed. Remove the AI-specific models if preferred:

```
Keep:    User
Remove:  ChatSession, Message, UsageMetric   ← only used by AI chat
```

Only 1 migration needed to drop the AI tables.

---

## 9. File Change Summary

| File / Folder | Action | Notes |
|---------------|--------|-------|
| `constants/mock-data.ts` | **Create** | Central static data source |
| `stores/data-store.ts` | **Rewrite** | Remove all fetch/interval logic |
| `app/page.tsx` | **Edit** | Remove useEffect + fetchData |
| `app/sites/[siteId]/page.tsx` | **Edit** | Remove polling, remove AiChatButton |
| `app/sites/[siteId]/history/page.tsx` | **Edit** | Remove fetch, use MOCK_HISTORY |
| `app/sites/[siteId]/report/page.tsx` | **Edit** | Remove fetch, use MOCK_MONTHLY_REPORT |
| `app/sites/[siteId]/engineering/page.tsx` | **Edit** | Replace fetch with mock |
| `app/api/ai/` | **Delete** | Entire folder |
| `app/api/neihu/` | **Delete** | Entire folder |
| `app/api/etai/` | **Delete** | Entire folder |
| `app/api/history/` | **Delete** | Entire folder |
| `services/ai/` | **Delete** | Entire folder |
| `utils/bess-algorithm/` | **Delete** | Entire folder |
| `utils/bess-unified.ts` | **Delete** | |
| `utils/report-generator.ts` | **Delete** | |
| `lib/ai/prompts.ts` | **Delete** | |
| `hooks/use-battery-data.ts` | **Delete** | |
| `components/ai-chat/` | **Delete** | Entire folder |
| All auth pages & API routes | **No change** | |
| All remaining components | **No change** | Pure display, props-driven |

---

## 10. Implementation Order

1. Create `constants/mock-data.ts`
2. Rewrite `stores/data-store.ts`
3. Delete all non-auth API routes
4. Delete services, utils, hooks listed above
5. Edit pages (remove fetch/interval) — start with `page.tsx`, then site detail, history, report, engineering
6. Delete `components/ai-chat/`
7. (Optional) Clean up Prisma schema — drop AI tables

---

**Total files to create:** 1
**Total files to delete:** ~35
**Total files to edit:** 6 pages + 1 store
**Auth flow:** untouched

---

## 11. GitHub-Ready + One-Command Deploy

### Goal

Anyone clones the repo, runs **one command**, and gets a fully working dashboard with login.

```bash
git clone https://github.com/your-org/vpp-template
cd vpp-template
cp .env.example .env        # fill in 2 values
docker-compose up --build   # done
```

Open `http://localhost:3000` → log in with the seeded admin account.

---

### 11.1 Security — Fix Before Pushing to GitHub

The current `docker-compose.yml` has a **real Anthropic API key hardcoded**. This is a critical issue.

**Files to clean before first push:**

| File | Issue | Fix |
|------|-------|-----|
| `docker-compose.yml` | Hardcoded `ANTHROPIC_API_KEY` (real key!) | Remove — not needed in template |
| `docker-compose.yml` | Hardcoded `JWT_SECRET` | Move to `.env` |
| `docker-compose.yml` | `NEXT_PUBLIC_API_BASE_URL` points to local service | Remove — no external API in template |

**Add to `.gitignore`** (already covers `.env` — verify it's there):
```
.env
.env.local
.env.*.local
```

---

### 11.2 New Files to Create for Deployment

```
.env.example                   ← checked in, safe defaults
docker-compose.yml             ← rewrite (self-contained with postgres service)
apps/web/scripts/seed.ts       ← creates default admin user on first run
apps/web/docker-entrypoint.sh  ← migrate → seed → start
```

---

### 11.3 `.env.example`

Only **2 values** the user must change. Everything else has working defaults.

```bash
# ── Required ────────────────────────────────────────
# Change this to any random string (min 32 chars)
JWT_SECRET=change-me-to-a-random-32-char-secret-here

# Mapbox public token for the map (get a free one at mapbox.com)
# Leave blank to show a placeholder instead of a live map
NEXT_PUBLIC_MAPBOX_TOKEN=

# ── Database (auto-managed by Docker Compose) ───────
DATABASE_URL=postgresql://vpp:vpp_password@postgres:5432/vpp_db

# ── App ─────────────────────────────────────────────
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Mapbox token is optional — if blank, the home page map shows a static placeholder div instead of a live map. All other pages still work.

---

### 11.4 Rewritten `docker-compose.yml`

Self-contained: postgres bundled, migrations + seed run automatically, no external services required.

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: vpp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: vpp
      POSTGRES_PASSWORD: vpp_password
      POSTGRES_DB: vpp_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vpp -d vpp_db"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - vpp-network

  web:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
    container_name: vpp-web
    restart: unless-stopped
    env_file: .env                        # reads from .env
    environment:
      DATABASE_URL: postgresql://vpp:vpp_password@postgres:5432/vpp_db
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    command: ["/app/apps/web/docker-entrypoint.sh"]
    networks:
      - vpp-network

volumes:
  postgres_data:
    driver: local

networks:
  vpp-network:
    driver: bridge
```

---

### 11.5 `apps/web/docker-entrypoint.sh`

Runs inside the container on every start. Safe to run repeatedly (migrate is idempotent).

```bash
#!/bin/sh
set -e

echo "▶ Running database migrations..."
cd /app/apps/web
npx prisma migrate deploy

echo "▶ Seeding default admin user..."
node scripts/seed.js 2>/dev/null || echo "  (seed skipped — already exists)"

echo "▶ Starting VPP Dashboard..."
exec node /app/apps/web/server.js
```

---

### 11.6 `apps/web/scripts/seed.ts`

Creates a default admin account on first deploy. Skips silently if already exists.

```ts
// apps/web/scripts/seed.ts
import { PrismaClient } from "../lib/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const DEFAULT_EMAIL = "admin@vpp.local";
const DEFAULT_PASSWORD = "vpp-admin-2026";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEFAULT_EMAIL } });
  if (existing) {
    console.log(`Seed skipped — ${DEFAULT_EMAIL} already exists`);
    return;
  }
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  await prisma.user.create({ data: { email: DEFAULT_EMAIL, password: hashed } });
  console.log(`✅ Default admin created: ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`);
}

main().finally(() => prisma.$disconnect());
```

> **IMPORTANT:** The seed email must be in `constants/auth-constants.ts` `ALLOWED_EMAILS` list and assigned `admin` role in `USER_ROLES`. Update those constants to include `admin@vpp.local`.

---

### 11.7 Prisma — Add Migration for Simplified Schema

After removing the AI models from `schema.prisma`, create a clean migration:

```bash
# Run locally before pushing
cd apps/web
npx prisma migrate dev --name "template-clean-schema"
```

This generates a migration file that drops `chat_sessions`, `messages`, `usage_metrics` tables. Committed to the repo so `prisma migrate deploy` runs it automatically in the container.

---

### 11.8 Dockerfile Changes

The Dockerfile builder stage uses a dummy `NEXT_PUBLIC_API_BASE_URL` — remove it (not needed in template). Add the entrypoint script:

```diff
# In builder stage, remove:
- ENV NEXT_PUBLIC_API_BASE_URL="http://host.docker.internal:3003/data"

# In runner stage, add before USER nextjs:
+ COPY --from=builder --chown=nextjs:nodejs /app/apps/web/docker-entrypoint.sh ./apps/web/docker-entrypoint.sh
+ RUN chmod +x ./apps/web/docker-entrypoint.sh
```

---

### 11.9 Mapbox — Make Token Optional

The `MapSection` component uses `NEXT_PUBLIC_MAPBOX_TOKEN`. Add a guard:

```tsx
// components/home/map-section.tsx
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  return (
    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
      <p className="text-slate-400 text-sm">Map unavailable — set NEXT_PUBLIC_MAPBOX_TOKEN in .env</p>
    </div>
  );
}
```

This lets the rest of the dashboard work without requiring a Mapbox account.

---

### 11.10 GitHub Repository Setup

**Files to commit:**
```
✅ .env.example          (safe defaults only, no real secrets)
✅ docker-compose.yml    (cleaned, no hardcoded secrets)
✅ apps/web/Dockerfile   (updated)
✅ apps/web/docker-entrypoint.sh
✅ apps/web/scripts/seed.ts
✅ apps/web/prisma/migrations/  (all migration files)
```

**Never commit:**
```
❌ .env                  (covered by .gitignore)
❌ apps/web/.env
❌ Any file with real API keys, JWT secrets, or passwords
```

**Recommended GitHub repo description:**
> Open-source VPP (Virtual Power Plant) dashboard template. One-command Docker deploy with auth, BESS monitoring UI, reports, and historical charts. Static mock data — replace with your own API.

---

### 11.11 Complete One-Command Deploy Flow

```
git clone → cp .env.example .env → (edit 2 values) → docker-compose up --build
                                                              │
                                              ┌───────────────▼──────────────┐
                                              │  1. Build Next.js (standalone)│
                                              │  2. Start postgres container  │
                                              │  3. Wait for postgres health  │
                                              │  4. prisma migrate deploy     │
                                              │  5. seed.ts (admin user)      │
                                              │  6. Start Next.js server      │
                                              └───────────────────────────────┘
                                                              │
                                              http://localhost:3000
                                              Login: admin@vpp.local / vpp-admin-2026
```

---

### 11.12 Updated File Change Summary (with deployment)

| File | Action | Notes |
|------|--------|-------|
| `.env.example` | **Create** | 2 required values, safe defaults |
| `docker-compose.yml` | **Rewrite** | Self-contained, no secrets hardcoded |
| `apps/web/Dockerfile` | **Edit** | Remove external API env, add entrypoint |
| `apps/web/docker-entrypoint.sh` | **Create** | migrate → seed → start |
| `apps/web/scripts/seed.ts` | **Create** | Default admin user |
| `apps/web/prisma/schema.prisma` | **Edit** | Remove ChatSession, Message, UsageMetric |
| `apps/web/prisma/migrations/` | **New migration** | Drop AI tables |
| `constants/auth-constants.ts` | **Edit** | Add `admin@vpp.local` to whitelist + USER_ROLES |
| `components/home/map-section.tsx` | **Edit** | Guard for missing Mapbox token |

**Grand total new/changed files for deployment:** +7 files, edit 3 existing

---

**Full summary:**
- **Clone + deploy:** 1 command after copying `.env.example`
- **External dependencies:** 0 required (Mapbox optional)
- **Default login:** `admin@vpp.local` / `vpp-admin-2026`
- **Database:** bundled PostgreSQL in Docker, auto-migrated
- **Secrets in repo:** none

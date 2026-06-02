# VPP Dashboard - Project Structure

> 最後更新：2026-03-11
> 版本：整理後的乾淨結構

---

## 📁 專案概覽

這是一個基於 **Next.js 16 (App Router)** 的 VPP (Virtual Power Plant) 監控系統，用於追蹤和管理多個儲能站點的即時遙測數據、電池狀態、充電資訊和能源流動。

**技術棧：**

- Next.js 16 (App Router) + React 19
- TypeScript 5.9.2
- Tailwind CSS 4
- Prisma ORM (PostgreSQL)
- Zustand (狀態管理)
- Anthropic Claude AI (聊天助手)

---

## 🗂️ 目錄結構

```
apps/web/
├── app/                          # Next.js App Router 頁面和 API
│   ├── page.tsx                  # 首頁 - 多站點總覽（地圖 + 側邊欄）
│   ├── sites/[siteId]/page.tsx   # 站點詳細頁 - 單站點監控
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 認證 API（signin, signup, signout, me）
│   │   ├── ai/chat/              # AI 聊天 API
│   │   └── neihu/                # 內湖站點專用 API
│   │       ├── report/           # 歷史報告 API
│   │       ├── data-json/        # JSON 數據 API
│   │       └── savings/          # 節費計算 API
│   └── auth/                     # 認證相關頁面
│
├── components/                   # React 元件
│   ├── home/                     # 首頁元件（navbar, site-sidebar, map, summary-cards）
│   ├── site/                     # 站點詳細頁元件（charts, diagrams, grids）
│   └── ui/                       # 可重用 UI 元件（shadcn/ui 風格）
│
├── services/                     # 業務邏輯服務層
│   └── ai/                       # AI 相關服務
│       ├── chat-service.ts       # 對話管理（CRUD 操作）
│       ├── ai-provider.ts        # AI 模型互動（generateText）
│       ├── usage-tracker.ts      # Token 使用追蹤
│       ├── context-provider.ts   # 即時數據上下文提供
│       └── historical-data-service.ts  # 歷史數據查詢
│
├── stores/                       # Zustand 狀態管理
│   ├── auth-store.ts             # 認證狀態（持久化）
│   └── data-store.ts             # 多站點遙測數據狀態
│
├── lib/                          # 工具函數和配置
│   ├── prisma.ts                 # Prisma 客戶端單例（PrismaPg adapter）
│   ├── generated/prisma/         # 生成的 Prisma 客戶端
│   └── ai/prompts.ts             # AI 系統提示詞和語言檢測
│
├── utils/                        # 工具函數
│   ├── bess-unified.ts           # BESS 模擬核心模組（跨日 SOC、充放電、電費計算）
│   ├── period-savings.ts         # 月/年節費計算
│   └── feature-flags.ts          # 功能開關
│
├── middleware/                   # 中介層
│   └── auth.ts                   # 認證中介（getCurrentUser, requireAuth）
│
├── types/                        # TypeScript 型別定義
│   ├── data-type.ts              # 核心數據型別（TelemetryData, SiteId, BESS, etc.）
│   ├── bess-type.ts              # BESS 模擬型別（PersistedBESSState）
│   └── ai-types.ts               # AI 相關型別（ChatRequest, ChatResponse）
│
├── config/                       # 配置檔案
│   └── site-configs.ts           # 站點專屬配置（電池容量、費率、尖離峰時段）
│
├── constants/                    # 常數
│   ├── taiwan-holidays.ts        # 台灣國定假日
│   └── neihu-charging-station-data.json  # 內湖歷史數據（用於報告 API）
│
├── hooks/                        # 自定義 React Hooks
│   └── use-auth-guard.ts         # 認證保護 hook
│
├── prisma/                       # Prisma 配置和遷移
│   ├── schema.prisma             # 資料庫 schema
│   └── migrations/               # 資料庫遷移檔案
│
└── scripts/                      # 腳本和測試
    ├── tests/                    # 測試檔案（組織化結構）
    │   ├── integration/          # 整合測試（API, BESS, 數據流）
    │   ├── unit/                 # 單元測試（bess-unified）
    │   ├── e2e/                  # E2E 測試（CSV 匯出）
    │   └── type-checking/        # 型別檢查測試
    ├── utils/                    # 測試工具函數
    ├── get-yesterday-peak-usage.ts  # 工具腳本
    ├── inspect-api-data.ts       # 數據檢查腳本
    ├── sync-historical-data.ts   # 數據同步腳本
    └── vitest.config.ts          # Vitest 配置
```

---

## 🔑 核心模組說明

### 1. **BESS 模擬核心** ([`utils/bess-unified.ts`](utils/bess-unified.ts))

**功能：** 嚴格的跨日 SOC（State of Charge）持續性模擬系統

**核心規則：**

- ✅ SOC 永不猜測：基於前一狀態計算，無時間啟發式
- ✅ 充電僅在工作日 00:00 啟動：每日一次充電會話（週末/假日不充電）
- ✅ 充電功率：PCS 最大功率 100kW（不受契約容量限制）
- ✅ 充滿後停止：`chargeSessionActive = false`
- ✅ 尖峰放電：跟隨負載，受 PCS 限制（僅工作日）
- ✅ 週末/假日：完全停用（不充電、不放電）
- ✅ 跨日保持：SOC 狀態持久化，無重置

**關鍵函數：**

- `stepBESSSimulation()` - 單步模擬（核心邏輯）
- `simulateBESSForRealData()` - 批次模擬（處理真實數據）
- `calculateElectricityCost()` - 電費計算（有/無儲能比較）
- `isPeakTimeTW()` - 尖峰時段判斷（台灣時間）
- `getElectricityRate()` - 電價費率獲取

### 2. **電價算法** ([`config/site-configs.ts`](config/site-configs.ts))

**費率設定（NT$/kWh）：**

| 時段     | 夏月（6-9月） | 非夏月 |
| -------- | ------------- | ------ |
| **尖峰** | 12.47         | 12.14  |
| **離峰** | 3.05          | 2.90   |

**尖峰時段：**

- 夏月：16:00-22:00（工作日）
- 非夏月：15:00-21:00（工作日）
- 週末/假日：**全天離峰**（不分尖離峰）

**計算公式：**

```typescript
總電費 = (尖峰用電 × 尖峰費率) + (離峰用電 × 離峰費率)
節費金額 = 無儲能電費 - 有儲能電費
節費率 = (節費金額 / 無儲能電費) × 100%
```

### 3. **AI 聊天助手** ([`services/ai/`](services/ai/))

**架構：** 服務導向架構（SOA）

**服務層：**

- **chat-service.ts** - 對話管理（session CRUD, message 儲存）
- **ai-provider.ts** - AI 模型互動（Anthropic Claude Haiku）
- **usage-tracker.ts** - Token 使用追蹤
- **context-provider.ts** - 即時數據上下文（從外部 API 獲取）
- **historical-data-service.ts** - 歷史數據查詢（日期範圍檢測）

**特色：**

- ✅ 多語言支援（自動檢測英文/中文，並以相同語言回應）
- ✅ 即時數據查詢（自動從 API 獲取最新站點數據）
- ✅ 歷史數據查詢（支援 "2025整年"、"上個月" 等自然語言查詢）
- ✅ 對話歷史管理（session-based）

### 4. **數據來源**

**即時數據：**

- 來源：`http://127.0.0.1:3003/neihu/data?range=today`
- 格式：`{ data: TelemetryData[] }`
- 更新頻率：15 分鐘一筆
- 用途：首頁和站點詳細頁的即時顯示、AI 上下文

**歷史數據：**

- 來源：`constants/neihu-charging-station-data.json`
- 格式：每小時用電快照 `HourlyPowerRecord[]`
- 用途：報告 API (`/api/neihu/report`) 和 AI 歷史查詢

### 5. **狀態管理** ([`stores/`](stores/))

**data-store.ts** - 多站點數據管理

- 管理多個站點的遙測數據 `Record<SiteId, TelemetryData[]>`
- 自動計算摘要指標（electricityUsage, costs, solarPower, energyStorage, chargingPiles）
- 每 10 秒自動刷新（站點詳細頁）
- 支援時間範圍：today | month | year

**auth-store.ts** - 認證狀態管理

- JWT-based 認證（HTTP-only cookies）
- 持久化到 localStorage（user + isAuthenticated）
- 方法：signIn(), signUp(), signOut(), checkAuth()

---

## 🧪 測試結構

### **整合測試** (`scripts/tests/integration/`)

- `electricity-cost-comparison.test.ts` - 電費成本對比（最全面的 BESS 測試）
- `cross-day-soc.test.ts` - 跨日 SOC 持續性測試
- `battery-soc-calculation.test.ts` - 電池 SOC 計算測試
- `auth-api.test.ts` - 認證 API 測試
- `chat-api-full.test.ts` - AI 聊天完整流程測試
- `report-api.test.ts` - 報告 API 測試
- `neihu-data-fetch.test.ts` / `neihu-data-render.test.ts` - 數據獲取和渲染測試

### **單元測試** (`scripts/tests/unit/`)

- `bess-unified.test.ts` - BESS 核心函數單元測試

### **E2E 測試** (`scripts/tests/e2e/`)

- `report-csv-export.test.ts` - CSV 匯出功能測試

### **執行測試：**

```bash
# 運行最全面的 BESS 測試
npx tsx scripts/tests/integration/electricity-cost-comparison.test.ts

# 運行所有測試（使用 Vitest）
pnpm test
```

---

## 🔐 認證流程

1. **Sign In/Up:** POST to `/api/auth/signin` or `/api/auth/signup`
   - 驗證 email 是否在白名單 (`ALLOWED_EMAILS`)
   - 密碼使用 bcrypt 雜湊
   - 返回 JWT token 設定為 HTTP-only cookie

2. **Auth Check:** GET `/api/auth/me`
   - 驗證 JWT 並返回用戶資訊

3. **Sign Out:** POST `/api/auth/signout`
   - 清除 JWT cookie

4. **保護路由:** 使用 `useAuthGuard()` hook
   - 未認證用戶重定向到 `/auth/signin`

---

## 📊 數據流動

### **首頁（多站點總覽）：**

```
外部 API → useSiteDataStore.fetchData()
         → 計算 summaryData（六大指標）
         → 更新 UI (SummaryCards + Map + Sidebar)
```

### **站點詳細頁：**

```
外部 API → useSiteDataStore.fetchData()
         → simulateBESSForRealData()（BESS 模擬）
         → 更新圖表（BatterySOCChart, EnergyFlowDiagram, ChargerGrid）
         → 每 10 秒自動刷新
```

### **AI 聊天：**

```
用戶訊息 → /api/ai/chat
         → 檢測語言（detectLanguage）
         → 檢測日期範圍（detectDateRange）
         → 獲取上下文（即時 or 歷史）
         → generateResponse（Claude Haiku）
         → 儲存對話（chatService）
         → 返回 AI 回應
```

---

## 🛠️ 開發指南

### **新增站點配置：**

1. 在 `types/data-type.ts` 新增 `SiteId` 型別
2. 在 `config/site-configs.ts` 新增站點配置
3. 在 `SITE_CONFIGS` map 中註冊站點
4. 更新 `stores/data-store.ts` 的初始狀態

### **修改 BESS 模擬邏輯：**

⚠️ **警告：** `utils/bess-unified.ts` 是核心模組，修改前請：

1. 閱讀檔案頂部的嚴格規則說明
2. 運行完整測試套件 (`electricity-cost-comparison.test.ts`)
3. 驗證跨日 SOC 持續性

### **新增 AI 功能：**

1. 在 `services/ai/` 建立新服務
2. 在 `lib/ai/prompts.ts` 新增對應 prompt
3. 在 `/api/ai/chat/route.ts` 整合新服務
4. 建立測試檔案於 `scripts/tests/integration/`

---

## 📝 命名慣例

- **檔案命名：** kebab-case (`battery-soc-chart.tsx`)
- **元件命名：** PascalCase (`BatterySOCChart`)
- **函數命名：** camelCase (`calculateElectricityCost`)
- **常數命名：** UPPER_SNAKE_CASE (`SUMMER_PEAK_RATE`)
- **測試檔案：** `*.test.ts` 或 `*.test.tsx`
- **型別檔案：** `*-type.ts` 或 `*-types.ts`

---

## 🚀 快速開始

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 生成 Prisma 客戶端
cd apps/web && npx prisma generate

# 運行測試
npx tsx scripts/tests/integration/electricity-cost-comparison.test.ts

# 建置專案
pnpm build
```

---

## 📚 重要文件

- [`../CLAUDE.md`](../CLAUDE.md) - Claude Code 專案指引
- [`docs/README.md`](README.md) - 文檔中心索引
- [`docs/AI_MODULE_STRUCTURE.md`](AI_MODULE_STRUCTURE.md) - AI 模組架構文件
- [`docs/REPORT_ALGORITHM_SUMMARY.md`](REPORT_ALGORITHM_SUMMARY.md) - 報告演算法摘要
- [`docs/PERIOD_SAVINGS_SETUP.md`](PERIOD_SAVINGS_SETUP.md) - 月年節費計算設定
- [`docs/TEST-RESULTS.md`](TEST-RESULTS.md) - 測試結果記錄

---

## 🔍 專案清理記錄（2026-03-11）

完成的清理任務：

- ✅ 移除未使用的測試腳本檔案（debug-store.ts, battery-status-test.ts 等）
- ✅ 移除 deprecated API route (`/api/neihu/data`)
- ✅ 移除未使用的 Prisma model (`EnergyDocument`)
- ✅ 移除未使用的 store (`useTelemetryStore`)
- ✅ 整理測試檔案到專用目錄（`scripts/tests/integration/`）
- ✅ 統一測試檔案命名規範（`*.test.ts`）

---

**維護者：** Fortune ESS Team
**最後檢查：** 2026-03-11

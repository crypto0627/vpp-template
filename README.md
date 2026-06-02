# VPP Dashboard - 虛擬電廠監控系統

> 🔋 智慧能源管理與儲能優化平台
>
> **Fortune ESS** - Next.js 16 + React 19 + TypeScript 全棧應用

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)](https://tailwindcss.com/)

---

## 📖 專案簡介

**VPP Dashboard** 是一個用於監控和管理**虛擬電廠（Virtual Power Plant）**的全棧 Web 應用程式。系統整合多個儲能站點的即時遙測數據，透過先進的 BESS（Battery Energy Storage System）模擬算法，為用戶提供：

- ⚡ **即時能源監控** - 電池狀態、充電樁使用、能源流動可視化
- 💰 **智慧電費優化** - 尖離峰時段管理、自動節費計算（節省率可達 15-20%）
- 🔋 **跨日 SOC 模擬** - 精確的電池充放電策略模擬
- 🤖 **AI 智慧助手** - Claude 驅動的多語言能源諮詢服務
- 📊 **歷史數據分析** - 月度/年度報告、成本對比、趨勢分析

### 🎯 專案目標

1. **降低電費成本** - 透過智慧充放電策略，利用尖離峰電價差異節省電費
2. **優化能源使用** - 實現電池儲能系統的最佳化運作
3. **提升可視化** - 提供直觀的儀表板和圖表，協助能源管理決策
4. **智慧化管理** - AI 助手提供即時數據查詢和歷史分析

---

## ✨ 核心功能

### 1. 🏠 多站點監控總覽

- **Mapbox 地圖整合** - 視覺化顯示多個站點位置
- **即時數據更新** - 每 10 秒自動刷新
- **六大關鍵指標**：
  - 💡 總用電量（kWh）
  - 💰 電費成本（NT$）
  - ☀️ 太陽能發電（如適用）
  - 🔋 儲能容量和 SOC
  - 🚗 充電樁使用率
  - 📈 即時功率需求

### 2. 📊 站點詳細監控

- **電池 SOC 即時圖表** - 顯示充放電曲線和狀態變化
- **能源流向圖** - 視覺化電網、電池、負載之間的能量流動
- **充電樁狀態網格** - 即時顯示 15 個 AC 充電樁 + DC/超充狀態
- **功率需求分析** - 尖離峰用電、BESS 貢獻度分析

### 3. 💡 BESS 智慧模擬

- **跨日 SOC 持續性** - 嚴格的狀態持久化，無時間啟發式
- **工作日充電策略** - 每日 00:00 自動充電至滿（100kW PCS 功率）
- **尖峰放電優化** - 夏月 16:00-22:00、非夏月 15:00-21:00 自動放電
- **週末/假日停用** - 避免不必要的充電成本
- **電費對比計算** - 自動計算有/無儲能的成本差異

### 4. 🤖 AI 智慧助手

- **多語言支援** - 自動偵測中文/英文並以相同語言回應
- **即時數據查詢** - "現在的電池 SOC 是多少？"、"目前充電樁使用狀況？"
- **歷史數據分析** - "2025 整年的用電成本？"、"上個月節省多少電費？"
- **對話記憶** - Session-based 對話管理，支援多輪問答
- **能源諮詢** - 提供節費建議、趨勢分析、系統操作指引

### 5. 📈 報告與分析

- **歷史報告 API** - 支援自訂日期範圍查詢
- **月度/年度節費計算** - 基於 JSON 歷史數據
- **電費分項統計** - 尖峰/離峰用電分析
- **CSV 匯出功能** - 方便進一步數據處理

---

## 🗄️ 數據來源

### **即時數據（Real-time）**

- **來源：** `http://127.0.0.1:3003/neihu/data?range=today`
- **格式：** JSON - `{ data: TelemetryData[] }`
- **更新頻率：** 每 15 分鐘一筆
- **數據內容：**
  - BESS 狀態（SOC, SOH, Voltage, Current）
  - 充電樁資訊（SuperCharging, DC, AC1-AC15）
  - 環境數據（溫度、濕度）
  - 總用電量

### **歷史數據（Historical）**

- **來源：** `apps/web/constants/neihu-charging-station-data.json`
- **格式：** 每小時用電快照 `HourlyPowerRecord[]`
- **時間範圍：** 2024-2025 年度數據
- **用途：** 報告 API、AI 歷史查詢、年度分析

---

## 🏗️ 技術架構

### **前端技術棧**

- **框架：** Next.js 16 (App Router)
- **UI 庫：** React 19
- **樣式：** Tailwind CSS 4
- **組件庫：** Radix UI + shadcn/ui
- **圖表：** Recharts
- **地圖：** Mapbox GL JS
- **狀態管理：** Zustand (with persist middleware)

### **後端技術棧**

- **API：** Next.js App Router API Routes
- **資料庫：** PostgreSQL
- **ORM：** Prisma 7 (with PrismaPg adapter)
- **認證：** JWT + bcrypt (HTTP-only cookies)
- **AI：** Anthropic Claude Haiku 3 (via @ai-sdk/anthropic)

### **開發工具**

- **語言：** TypeScript 5.9.2
- **包管理器：** pnpm 9.0.0
- **Monorepo：** Turborepo
- **測試：** Vitest
- **程式碼品質：** ESLint + Prettier

---

## 📁 專案結構

```
vpp/                                    # Turborepo 根目錄
├── apps/
│   └── web/                            # 主應用程式
│       ├── app/                        # Next.js App Router
│       │   ├── page.tsx                # 首頁（多站點總覽）
│       │   ├── sites/[siteId]/         # 站點詳細頁
│       │   └── api/                    # API 路由
│       │       ├── auth/               # 認證 API
│       │       ├── ai/chat/            # AI 聊天 API
│       │       └── neihu/              # 內湖站點 API
│       ├── components/                 # React 元件
│       │   ├── home/                   # 首頁元件
│       │   ├── site/                   # 站點元件
│       │   └── ui/                     # 通用 UI 元件
│       ├── services/                   # 業務邏輯服務層
│       │   └── ai/                     # AI 相關服務
│       ├── stores/                     # Zustand 狀態管理
│       ├── utils/                      # 工具函數
│       │   └── bess-unified.ts         # 🔋 BESS 模擬核心
│       ├── config/                     # 配置檔案
│       │   └── site-configs.ts         # 站點配置（電價、容量）
│       ├── constants/                  # 常數
│       │   ├── taiwan-holidays.ts      # 國定假日
│       │   └── neihu-charging-station-data.json  # 歷史數據
│       ├── types/                      # TypeScript 型別定義
│       ├── prisma/                     # Prisma schema 和 migrations
│       ├── docs/                       # 📚 完整技術文檔
│       │   ├── README.md               # 文檔中心索引
│       │   ├── PROJECT_STRUCTURE.md    # 專案架構詳解
│       │   ├── AI_MODULE_STRUCTURE.md  # AI 模組設計
│       │   ├── REPORT_ALGORITHM_SUMMARY.md  # 演算法說明
│       │   └── TEST-RESULTS.md         # 測試記錄
│       └── scripts/                    # 測試和工具腳本
│           └── tests/                  # 整合/單元/E2E 測試
├── packages/                           # 共用套件
│   ├── eslint-config/                  # ESLint 配置
│   └── typescript-config/              # TypeScript 配置
└── turbo.json                          # Turborepo 配置
```

**📚 詳細架構文檔：** [`apps/web/docs/PROJECT_STRUCTURE.md`](apps/web/docs/PROJECT_STRUCTURE.md)

---

## 🧮 核心算法

### 1. **BESS 跨日 SOC 模擬**

**檔案位置：** [`apps/web/utils/bess-unified.ts`](apps/web/utils/bess-unified.ts)

**核心原則：**

- ✅ **SOC 永不猜測** - 基於前一狀態計算，無時間啟發式
- ✅ **工作日充電** - 每日 00:00 啟動充電會話（週末/假日停用）
- ✅ **全功率充電** - 使用 PCS 最大功率 100kW（不受契約容量限制）
- ✅ **充滿即停** - SOC 達到 MAX_SOC 時停止充電
- ✅ **尖峰放電** - 工作日尖峰時段自動放電
- ✅ **狀態持久化** - SOC 狀態跨日保持，無重置

**關鍵函數：**

```typescript
// 單步模擬（核心邏輯）
stepBESSSimulation(state: PersistedBESSState, currentTime: Date, siteLoadKW: number, intervalHours: number)

// 批次模擬（處理真實數據）
simulateBESSForRealData(data: TelemetryData[], initialState: PersistedBESSState)

// 電費計算（有/無儲能比較）
calculateElectricityCost(data: TelemetryData[])
```

**📊 詳細演算法文檔：** [`apps/web/docs/REPORT_ALGORITHM_SUMMARY.md`](apps/web/docs/REPORT_ALGORITHM_SUMMARY.md)

### 2. **電價算法**

**檔案位置：** [`apps/web/config/site-configs.ts`](apps/web/config/site-configs.ts)

**費率設定（NT$/kWh）：**

| 時段     | 夏月（6-9月） | 非夏月（其他月份） |
| -------- | ------------- | ------------------ |
| **尖峰** | 12.47         | 12.14              |
| **離峰** | 3.05          | 2.90               |

**尖峰時段定義：**

- **夏月：** 16:00-22:00（僅工作日）
- **非夏月：** 15:00-21:00（僅工作日）
- **週末/假日：** 全天離峰（無尖峰時段）

**計算公式：**

```typescript
總電費 = (尖峰用電量 × 尖峰費率) + (離峰用電量 × 離峰費率)
節費金額 = 無儲能電費 - 有儲能電費
節費率 = (節費金額 / 無儲能電費) × 100%
```

**實際節費效果：** 根據模擬數據，BESS 系統可節省 **15-20%** 的電費成本

---

## 🚀 快速開始

### **環境需求**

- Node.js 18+
- pnpm 9.0.0+
- PostgreSQL 14+
- (可選) Global Turbo CLI

### **1. 安裝依賴**

```bash
# Clone 專案
git clone <repository-url>
cd vpp

# 安裝依賴
pnpm install
```

### **2. 環境變數設定**

在 `apps/web/` 建立 `.env` 檔案：

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vpp_db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Mapbox (for maps)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your-mapbox-token"

# Anthropic API (for AI chat)
ANTHROPIC_API_KEY="sk-ant-your-api-key"

# External API
NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:3003/neihu/data"
```

### **3. 資料庫設定**

```bash
cd apps/web

# 生成 Prisma Client
npx prisma generate

# 執行資料庫遷移
npx prisma migrate dev

# (可選) 開啟 Prisma Studio 查看資料
npx prisma studio
```

### **4. 啟動開發伺服器**

```bash
# 在專案根目錄執行
pnpm dev

# 或只啟動 web app
turbo dev --filter=web
```

應用程式將在 `http://localhost:3000` 啟動

---

## 🛠️ 開發指南

### **專案慣例**

- **檔案命名：** kebab-case (`battery-soc-chart.tsx`)
- **元件命名：** PascalCase (`BatterySOCChart`)
- **函數命名：** camelCase (`calculateElectricityCost`)
- **常數命名：** UPPER_SNAKE_CASE (`SUMMER_PEAK_RATE`)
- **測試檔案：** `*.test.ts` 或 `*.test.tsx`

### **新增站點配置**

1. 在 `types/data-type.ts` 新增 `SiteId` 型別
2. 在 `config/site-configs.ts` 新增站點配置
3. 在 `SITE_CONFIGS` map 中註冊站點
4. 更新 `stores/data-store.ts` 的初始狀態

```typescript
// config/site-configs.ts
export const NEW_SITE_CONFIG: SiteSimulationConfig = {
  BESS_CAPACITY_KWH: 370,
  PCS_CAPACITY_KW: 100,
  SUMMER_PEAK_RATE: 12.47,
  SUMMER_OFFPEAK_RATE: 3.05,
  // ... 其他配置
};
```

### **修改 BESS 模擬邏輯**

⚠️ **警告：** `utils/bess-unified.ts` 是核心模組，修改前請：

1. 閱讀檔案頂部的嚴格規則說明
2. 閱讀 [`docs/REPORT_ALGORITHM_SUMMARY.md`](apps/web/docs/REPORT_ALGORITHM_SUMMARY.md)
3. 運行完整測試套件（見下方測試章節）
4. 驗證跨日 SOC 持續性
5. 檢查電費計算準確性

### **新增 AI 功能**

1. 在 `services/ai/` 建立新服務
2. 在 `lib/ai/prompts.ts` 新增對應 prompt
3. 在 `/api/ai/chat/route.ts` 整合新服務
4. 建立測試檔案於 `scripts/tests/integration/`

**範例：** 參考 [`docs/AI_MODULE_STRUCTURE.md`](apps/web/docs/AI_MODULE_STRUCTURE.md)

---

## 🧪 測試

### **測試結構**

```
scripts/tests/
├── integration/       # 整合測試（API, BESS, 數據流）
├── unit/             # 單元測試（純函數）
├── e2e/              # E2E 測試（使用者流程）
└── type-checking/    # TypeScript 型別檢查
```

### **執行測試**

```bash
cd apps/web

# 最全面的 BESS 電費對比測試
npx tsx scripts/tests/integration/electricity-cost-comparison.test.ts

# 跨日 SOC 持續性測試
npx tsx scripts/tests/integration/cross-day-soc.test.ts

# AI 聊天完整流程測試
npx tsx scripts/tests/integration/chat-api-full.test.ts

# 執行所有測試（使用 Vitest）
pnpm test

# 型別檢查
pnpm check-types

# Lint 檢查
pnpm lint
```

### **關鍵測試案例**

1. **BESS 模擬準確性** - 驗證充放電邏輯、SOC 計算
2. **電費計算正確性** - 確認尖離峰費率、節費率計算
3. **跨日 SOC 持續** - 確保週五→週一 SOC 正確保持
4. **週末/假日停用** - 驗證非工作日不充放電
5. **API 整合** - 測試外部 API 數據獲取和處理

**📋 完整測試記錄：** [`apps/web/docs/TEST-RESULTS.md`](apps/web/docs/TEST-RESULTS.md)

---

## 🏗️ 建置與部署

### **本地建置**

```bash
# 建置所有應用和套件
pnpm build

# 或只建置 web app
turbo build --filter=web

# 啟動生產模式
cd apps/web
pnpm start
```

### **資料庫遷移（生產環境）**

```bash
cd apps/web

# 執行 migrations（不生成新的）
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate
```

### **環境變數檢查清單**

部署前確認以下環境變數已設定：

- ✅ `DATABASE_URL` - PostgreSQL 連接字串
- ✅ `JWT_SECRET` - JWT 簽章金鑰（強隨機值）
- ✅ `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox API token
- ✅ `ANTHROPIC_API_KEY` - Anthropic Claude API key
- ✅ `NEXT_PUBLIC_API_BASE_URL` - 外部數據 API URL
- ✅ `NODE_ENV=production`

---

## 🎓 核心技能與能力

此專案展示以下技術能力：

### **前端開發**

- ✅ Next.js 16 App Router 架構
- ✅ React 19 Server/Client Components
- ✅ TypeScript 嚴格模式開發
- ✅ Tailwind CSS 4 響應式設計
- ✅ Zustand 狀態管理與持久化
- ✅ Recharts 複雜數據可視化
- ✅ Mapbox GL 地圖整合

### **後端開發**

- ✅ Next.js API Routes 設計
- ✅ Prisma ORM 資料庫建模
- ✅ PostgreSQL 關聯式資料庫
- ✅ JWT 認證機制
- ✅ RESTful API 設計
- ✅ 服務層架構（SOA）

### **演算法與數學**

- ✅ 電池充放電模擬算法
- ✅ 時間序列數據處理
- ✅ 電價優化計算
- ✅ 成本效益分析
- ✅ 狀態機設計（SOC 狀態管理）

### **AI 整合**

- ✅ Anthropic Claude API 整合
- ✅ 多語言 NLP 處理
- ✅ 日期範圍自然語言解析
- ✅ 對話管理與上下文維護
- ✅ Prompt Engineering

### **DevOps 與工具**

- ✅ Turborepo Monorepo 管理
- ✅ pnpm Workspace 配置
- ✅ Prisma Migrations
- ✅ Vitest 測試框架
- ✅ ESLint + Prettier 程式碼品質

### **軟體工程最佳實踐**

- ✅ 模組化架構設計
- ✅ 關注點分離（Separation of Concerns）
- ✅ DRY 原則（Don't Repeat Yourself）
- ✅ 型別安全開發
- ✅ 完整文檔撰寫
- ✅ 整合測試覆蓋

---

## 📚 完整文檔

專案提供完整的技術文檔，位於 [`apps/web/docs/`](apps/web/docs/)：

| 文檔                                                        | 說明                         |
| ----------------------------------------------------------- | ---------------------------- |
| [**文檔中心**](apps/web/docs/README.md)                     | 📚 所有文檔的導航索引        |
| [**專案結構**](apps/web/docs/PROJECT_STRUCTURE.md)          | 🏗️ 完整的專案架構說明        |
| [**AI 模組架構**](apps/web/docs/AI_MODULE_STRUCTURE.md)     | 🤖 AI 聊天助手設計文檔       |
| [**演算法摘要**](apps/web/docs/REPORT_ALGORITHM_SUMMARY.md) | 📊 BESS 模擬和電費計算演算法 |
| [**節費計算設定**](apps/web/docs/PERIOD_SAVINGS_SETUP.md)   | 💰 月年節費計算邏輯          |
| [**測試結果記錄**](apps/web/docs/TEST-RESULTS.md)           | 🧪 關鍵功能測試報告          |

**新開發者建議閱讀順序：**

1. 📖 專案結構 → 2. 📊 演算法摘要 → 3. 🤖 AI 模組架構

---

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 專案
2. 建立 Feature Branch (`git checkout -b feature/AmazingFeature`)
3. 遵循專案程式碼規範（ESLint + Prettier）
4. 撰寫測試（整合測試優先）
5. 更新相關文檔
6. Commit 變更 (`git commit -m 'Add some AmazingFeature'`)
7. Push 到 Branch (`git push origin feature/AmazingFeature`)
8. 開啟 Pull Request

**Commit 規範：**

- `feat:` 新功能
- `fix:` Bug 修復
- `docs:` 文檔更新
- `refactor:` 程式碼重構
- `test:` 測試相關
- `chore:` 雜項（依賴更新等）

---

## 📞 支援與聯絡

- **技術文檔：** [`apps/web/docs/`](apps/web/docs/)
- **Issue Tracker：** GitHub Issues
- **開發團隊：** Fortune ESS Development Team

---

## 📝 授權

本專案為 Fortune ESS 內部專案，版權所有。

---

## 🎉 致謝

- **Next.js Team** - 強大的全棧框架
- **Anthropic** - Claude AI API 支援
- **Vercel** - 出色的開發與部署體驗
- **Turborepo Team** - Monorepo 工具
- **所有開源貢獻者** - 讓這個專案成為可能

---

**Built with ❤️ by Fortune ESS Team**

_最後更新：2026-03-11_

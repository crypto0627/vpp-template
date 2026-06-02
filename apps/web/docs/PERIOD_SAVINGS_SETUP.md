# 期間節費功能設置指南

## 概述

此功能從後端 API 抓取歷史數據，計算當月和當年的儲能節費，並在 Site 詳細頁面的 Summary Cards 中顯示。

## 架構

```
後端 API (fortune-ess.com)
    ↓
數據同步腳本 (sync-historical-data.ts)
    ↓
JSON 檔案 (neihu-charging-station-data.json)
    ↓
節費計算 API (/api/neihu/savings)
    ↓
UI 組件 (site-summary-cards.tsx)
```

## 設置步驟

### 1. 初次數據同步

首次使用前，需要從後端 API 同步歷史數據到 JSON 檔案：

```bash
cd apps/web
npx tsx scripts/sync-historical-data.ts
```

此腳本會：

- 從 `https://www.fortune-ess.com/neihu/data` 抓取最近 30 天的數據
- 將資料庫的每日匯總數據轉換為每小時格式
- 合併今天的即時數據
- 更新 `constants/neihu-charging-station-data.json`

**執行結果範例：**

```
🔄 Starting historical data sync...

📡 Fetching data from 2026-02-04 to 2026-03-06...
✅ Fetched 30 daily records
✅ Fetched 145 real-time records for today

📦 Fetched 865 hourly records

📂 Loaded 500 existing records from JSON

📊 Added 365 new records, updated 500 existing records

✅ Total records after merge: 865

💾 Saved to /path/to/constants/neihu-charging-station-data.json

📅 Data range: 2026-02-04 to 2026-03-06

✅ Sync completed successfully!
```

### 2. 定期更新（可選）

建議設定 cron job 每天自動同步：

```bash
# 每天凌晨 1:00 執行
0 1 * * * cd /path/to/vpp/apps/web && npx tsx scripts/sync-historical-data.ts >> /var/log/sync-data.log 2>&1
```

或在 package.json 添加 script：

```json
{
  "scripts": {
    "sync-data": "tsx scripts/sync-historical-data.ts"
  }
}
```

## API 端點

### GET /api/neihu/savings

計算指定期間的儲能節費。

**參數：**

- `period` (required): "month" | "year"

**範例請求：**

```bash
# 當月節費
curl "http://localhost:3000/api/neihu/savings?period=month"

# 當年節費
curl "http://localhost:3000/api/neihu/savings?period=year"
```

**回應範例：**

```json
{
  "period": "month",
  "start": "2026-03-01",
  "end": "2026-03-06",
  "savings": 12450.5,
  "costWithoutBESS": 45000.0,
  "costWithBESS": 32549.5,
  "savingsRate": 27.67,
  "daysCount": 6
}
```

**欄位說明：**

- `savings`: 節省的電費金額（NT$）
- `costWithoutBESS`: 無儲能時的電費
- `costWithBESS`: 有儲能時的電費
- `savingsRate`: 節費率（%）
- `daysCount`: 計算的天數

## UI 顯示

在 Site 詳細頁面（`/sites/neihu`）的 Summary Cards 中：

**第四張卡片 - 累積節費**

```
┌─────────────────┐
│ 累積節費        │
├─────────────────┤
│ 當月節費        │
│ $12,450         │
│ 本月累積至今日  │
│                 │
│ ─────────────   │
│ 當年節費        │
│ $85,230         │
│ 本年累積至今日  │
└─────────────────┘
```

**顯示邏輯：**

- 載入中：顯示「載入中...」
- 負值（尚未節省）：顯示「尚未節省」
- 正值：顯示節費金額

## 數據格式

### JSON 檔案格式 (neihu-charging-station-data.json)

```json
[
  {
    "date_timerange": "2026-03-01T00:00:00.000Z",
    "power(kwh)": 125.5
  },
  {
    "date_timerange": "2026-03-01T01:00:00.000Z",
    "power(kwh)": 130.2
  }
]
```

**欄位說明：**

- `date_timerange`: ISO 8601 格式的時間戳（UTC+8 台灣時間，但以 UTC 儲存）
- `power(kwh)`: 該小時的平均功率（kW）

## 注意事項

### 1. 時區處理

- 所有時間計算使用台灣時間（UTC+8）
- API 自動處理時區轉換

### 2. 數據更新

- 今天的數據每次同步都會被即時數據覆蓋
- 歷史數據只會在缺失時才新增

### 3. BESS 計算邏輯

- 電池容量：370 kWh
- 工作日：離峰充電到滿，尖峰放電
- 週末/假日：不充放電
- 使用台灣電價時段和費率

### 4. 效能考量

- JSON 檔案會逐漸增大，建議定期清理過舊數據
- 計算 API 使用快取機制加速讀取

## 疑難排解

### Q: 同步腳本執行失敗

**A:** 檢查：

1. 後端 API 是否可訪問：`curl https://www.fortune-ess.com/neihu/data?range=month`
2. 是否有寫入 constants/ 目錄的權限
3. 檢查錯誤日誌

### Q: API 返回 "No data available"

**A:** 表示 JSON 檔案中沒有該期間的數據，需要執行同步腳本。

### Q: 顯示「尚未節省」

**A:** 表示計算結果為負值（充電成本 > 放電節省），屬正常情況（例如月初剛開始充電）。

### Q: 數據不準確

**A:**

1. 確認 JSON 檔案數據完整性
2. 檢查台灣假日設定（`constants/taiwan-holidays.ts`）
3. 驗證電價費率設定（`utils/bess-unified.ts`）

## 維護

### 清理舊數據

如果 JSON 檔案過大，可以刪除一年前的數據：

```bash
# 手動編輯或寫腳本過濾
# 建議保留最近 365 天的數據
```

### 監控

建議監控：

- JSON 檔案大小（建議 < 50MB）
- API 回應時間（建議 < 2s）
- 數據同步成功率

## 相關檔案

```
apps/web/
├── scripts/
│   └── sync-historical-data.ts          # 數據同步腳本
├── app/api/neihu/
│   ├── report/route.ts                  # 報告 API（已存在）
│   └── savings/route.ts                 # 期間節費 API（新增）
├── components/site/
│   └── site-summary-cards.tsx           # UI 組件（已修改）
├── constants/
│   ├── neihu-charging-station-data.json # 數據檔案
│   └── taiwan-holidays.ts               # 台灣假日
└── utils/
    └── bess-unified.ts                   # BESS 計算邏輯
```

## 後續優化建議

1. **資料庫直連**：將來可考慮直接從資料庫查詢，減少 JSON 檔案依賴
2. **快取機制**：為計算結果添加 Redis 快取
3. **增量更新**：只更新缺失的日期，而非每次都查詢 30 天
4. **即時更新**：當天數據可每小時自動更新一次
5. **圖表顯示**：添加月度/年度節費趨勢圖表

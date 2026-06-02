# 財報算法總結：有儲能 vs 無儲能電費計算

## 概述

本文檔說明 VPP Dashboard 財報系統中，如何計算「無儲能」和「有儲能」兩種情境下的電費成本，以及儲能系統（BESS）的充放電模擬邏輯。

---

## 一、無儲能電費算法

### 1.1 基本概念

**無儲能**情境假設充電站沒有安裝儲能系統，所有充電樁的用電直接從電網取電，按照台電的時間電價（TOU）計費。

### 1.2 計算流程

#### 步驟 1：按日期分組充電記錄

```typescript
// 來源：apps/web/app/api/neihu/report/route.ts (line 114-142)
for (const rec of filteredRecords) {
  const tw = getTW(rec.startTime);
  const key = `${tw.year}-${tw.month}-${tw.day}`;

  // 根據時段累加充電度數
  if (isPeakTimeTW(rec.startTime)) {
    row.peakKWh += rec.powerKWh; // 尖峰用電
  } else {
    row.offPeakKWh += rec.powerKWh; // 離峰用電
  }
}
```

#### 步驟 2：計算每日電費

```typescript
// 來源：route.ts (line 185-187)
const { peakRate, offRate } = getElectricityRate(dateObj);

// 無儲能費用 = 尖峰用電 × 尖峰電價 + 離峰用電 × 離峰電價
const woPeak = noStorage.peakKWh * peakRate;
const woOff = noStorage.offPeakKWh * offRate;
const costWithoutBESS = woPeak + woOff;
```

### 1.3 電價結構

| 時段                     | 夏月 (6-9月)              | 非夏月 (1-5, 10-12月)     |
| ------------------------ | ------------------------- | ------------------------- |
| **尖峰** (週一至週五)    | 16:00-22:00<br>$12.47/kWh | 15:00-21:00<br>$12.14/kWh |
| **離峰** (其他時段+週末) | 其他時段<br>$3.05/kWh     | 其他時段<br>$2.90/kWh     |

**重點：**

- 週末全天視為離峰
- 尖離峰時段判斷基於充電記錄的**開始時間**

---

## 二、有儲能電費算法（方案 B：理論最大節費）

### 2.1 核心假設

方案 B 採用「理論最大節費」模式，假設：

1. **電池每天充滿**：每天在離峰時段 00:00 充電到 370 kWh
2. **盡可能替代尖峰用電**：電池在尖峰時段放電，替代從電網的尖峰取電
3. **不受負載間歇性限制**：假設電池可以充分利用其容量（忽略充電樁間歇性的影響）

### 2.2 計算流程

#### 步驟 1：確定電池可替代的尖峰用電量

```typescript
// 來源：route.ts (line 189-215)
const BESS_CAPACITY = 370; // 電池容量 370 kWh
const DISCHARGE_EFFICIENCY = 0.95; // 放電效率 95%
const ROUNDTRIP_EFFICIENCY = 0.9025; // 往返效率 90.25%

// 判斷是否為週末
const dayOfWeek = dateObj.getDay();
const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

let peakReplacedKWh = 0;
let gridChargeKWh = 0;

if (!isWeekend && noStorage.peakKWh > 0) {
  // 電池最大放電量 = 370 kWh × 0.95 = 351.5 kWh
  const maxDischargeKWh = BESS_CAPACITY * DISCHARGE_EFFICIENCY;

  // 實際替代量 = min(最大放電量, 當天尖峰用電)
  peakReplacedKWh = Math.min(maxDischargeKWh, noStorage.peakKWh);

  // 為了放電這麼多，需要從電網充電的量（考慮往返效率損失）
  gridChargeKWh = peakReplacedKWh / ROUNDTRIP_EFFICIENCY;
}
```

#### 步驟 2：計算有儲能的電費

```typescript
// 來源：route.ts (line 218-222)
// 有儲能：尖峰用電 = 原尖峰用電 - 電池替代量
const withPeak = (noStorage.peakKWh - peakReplacedKWh) * peakRate;

// 有儲能：離峰用電 = 原離峰用電 + 電池充電需求
const withOff = (noStorage.offPeakKWh + gridChargeKWh) * offRate;

const costWithBESS = withPeak + withOff;
```

### 2.3 公式總結

```
有儲能成本 = (尖峰用電 - 電池替代量) × 尖峰電價
           + (離峰用電 + 電池充電量) × 離峰電價

其中：
  電池替代量 = min(351.5 kWh, 當天尖峰用電)  // 週末 = 0
  電池充電量 = 電池替代量 / 0.9025            // 考慮往返效率
```

### 2.4 節費計算

```
節費 = 無儲能成本 - 有儲能成本

節費來源：
  1. 減少尖峰用電：電池替代量 × (尖峰電價 - 離峰電價)
  2. 扣除效率損失：電池充電量 × 離峰電價 - 電池替代量 × 離峰電價

淨節費 ≈ 電池替代量 × (尖峰電價 - 離峰電價 × 1.108)
       ≈ 電池替代量 × ($12.3 - $3.3)
       ≈ 電池替代量 × $9.0
```

---

## 三、儲能充放電模擬邏輯

雖然方案 B 採用理論最大值計算電費，但系統仍保留完整的充放電模擬邏輯（用於顯示充放電數據和 SOC 狀態）。

### 3.1 核心規則

模擬系統遵循以下核心規則：

```typescript
// 來源：apps/web/utils/bess-unified.ts
/**
 * BESS 嚴格跨日 SOC 持續性模擬系統
 *
 * 核心規則：
 * 1. SOC 永不猜測：基於前一狀態計算，無時間啟發式
 * 2. 充電僅在 00:00 啟動：每日一次充電會話
 * 3. 充滿後停止：chargeSessionActive = false
 * 4. 尖峰放電：跟隨負載，受 PCS 限制
 * 5. 契約容量：grid = siteLoad + chargePower ≤ 366.7 kW
 * 6. 跨日保持：SOC 狀態持久化，無重置
 */
```

### 3.2 系統參數

| 參數                 | 值      | 說明                         |
| -------------------- | ------- | ---------------------------- |
| BESS_CAPACITY        | 370 kWh | 電池總容量                   |
| PCS_CAPACITY         | 100 kW  | 功率轉換系統最大功率         |
| CONTRACT_LIMIT       | 432 kW  | 契約容量                     |
| SAFETY_MARGIN        | 0.85    | 安全係數 → 實際限制 366.7 kW |
| CHARGE_EFFICIENCY    | 0.95    | 充電效率 95%                 |
| DISCHARGE_EFFICIENCY | 0.95    | 放電效率 95%                 |
| MIN_SOC_PERCENT      | 20%     | 最低 SOC（保護電池）         |
| MAX_SOC_PERCENT      | 90%     | 最高 SOC（充電上限）         |

### 3.3 充電邏輯

#### 充電觸發條件

```typescript
// 來源：bess-unified.ts (line 300-306)
const isIntervalStartsAtMidnight =
  startHour === 0 && intervalStartDateTW !== state.lastChargeSessionDateTW;

const shouldStartChargeSession =
  isIntervalStartsAtMidnight &&
  !state.chargeSessionActive &&
  state.socKWh < MAX_SOC;
```

**條件：**

1. 時間為 00:00（台灣時間午夜）
2. 是新的一天（與上次充電日期不同）
3. 充電會話未啟動
4. SOC < 370 kWh

#### 充電計算

```typescript
// 來源：bess-unified.ts (line 424-442)
// 可充電能量（電池側）
let canChargeKWh = Math.min(
  availableChargePowerKW * intervalHours, // PCS 限制
  MAX_SOC - updatedState.socKWh, // 容量限制
);

// 電網需供應的能量（考慮充電效率）
const gridChargeKWh = canChargeKWh / CHARGE_EFFICIENCY; // ÷ 0.95

// 確保不超過契約容量
let actualGridImportKW = siteLoadKW + gridChargePowerKW;
if (actualGridImportKW > MAX_GRID_POWER) {
  // 366.7 kW
  // 減少充電功率以符合契約容量限制
  const maxAllowedChargePowerKW = MAX_GRID_POWER - siteLoadKW;
  const maxAllowedChargeKWh =
    maxAllowedChargePowerKW * intervalHours * CHARGE_EFFICIENCY;
  canChargeKWh = Math.min(canChargeKWh, maxAllowedChargeKWh);
}
```

**關鍵點：**

- 充電受限於 PCS 上限（100 kW）、契約容量（366.7 kW）、和剩餘容量
- 電網供電 = 站場負載 + 充電功率
- 充電效率損失：電網需供應 105.26 kWh 才能充入 100 kWh

#### 充電結束

```typescript
// 來源：bess-unified.ts (line 449-450)
const sessionActive = newSOCKWh < MAX_SOC;

// 當 SOC 達到 370 kWh 時，充電會話自動結束
```

### 3.4 放電邏輯

#### 放電觸發條件

```typescript
// 來源：bess-unified.ts (line 320-321)
if (isPeak) {
  // 尖峰時段
  if (updatedState.socKWh > 0) {
    // 執行放電
  }
}
```

**條件：**

1. 尖峰時段（週一至週五 15:00/16:00 - 21:00/22:00）
2. SOC > 0

#### 放電計算

```typescript
// 來源：bess-unified.ts (line 340-357)
// 放電功率 = min(負載, PCS 上限)
const targetDischargeKW = Math.min(siteLoadKW, PCS_MAX_POWER);
const targetEnergyKWh = targetDischargeKW * intervalHours;

// 考慮放電效率：從電池取出的能量
const energyNeededFromBattery = targetEnergyKWh / DISCHARGE_EFFICIENCY; // ÷ 0.95
const canDischarge = Math.min(energyNeededFromBattery, updatedState.socKWh);

// 實際供給負載的能量（考慮效率損失）
const actualDischargeToLoad = canDischarge * DISCHARGE_EFFICIENCY; // × 0.95

// 電網補充不足部分
const loadEnergyKWh = siteLoadKW * intervalHours;
const gridSupplyKWh = Math.max(0, loadEnergyKWh - actualDischargeToLoad);
const gridImportKW = gridSupplyKWh / intervalHours;
```

**關鍵點：**

- 放電受限於站場負載、PCS 上限（100 kW）、和可用 SOC
- 放電效率損失：電池放出 105.26 kWh 才能供應 100 kWh 給負載
- 電網只補充電池無法滿足的部分

### 3.5 SOC 狀態追蹤

#### 跨日持續性

```typescript
// 來源：bess-unified.ts (line 50-60)
export interface BESSState {
  socKWh: number; // 當前 SOC (kWh)
  lastTimestamp: number; // 上次更新時間
  chargeSessionActive: boolean; // 充電會話是否活躍
  lastChargeSessionDateTW: string; // 上次充電日期（台灣時間）
}
```

**重要特性：**

- SOC 在跨日時**持續保持**，不會重置
- 每天只在 00:00 啟動一次充電會話
- 如果前一天沒充滿（例如從 300 kWh 開始），第二天 00:00 會繼續充至 370 kWh

#### 每日統計

```typescript
// 來源：bess-unified.ts (line 987-995)
export interface DailyBESSStats {
  date: string;
  chargedKWh: number; // 當日充電量（電池側）
  dischargedKWh: number; // 當日放電量（電池側）
  startSOC: number; // 日初 SOC
  endSOC: number; // 日末 SOC
  peakFromGrid: number; // 尖峰時段電網供電
  offPeakFromGrid: number; // 離峰時段電網供電
}
```

---

## 四、兩種方案的對比

### 4.1 方案 A vs 方案 B

| 項目             | 方案 A（實際模擬）       | 方案 B（理論最大）      |
| ---------------- | ------------------------ | ----------------------- |
| **電池放電假設** | 受充電樁間歇性限制       | 不受間歇性限制          |
| **每日替代量**   | 實際放電量（~25 kWh/天） | 理論最大（~320 kWh/天） |
| **全年節費**     | $54,638 (2.7%)           | $749,839 (37.1%)        |
| **適用場景**     | 真實 EV 充電站           | 理想化評估              |

### 4.2 選擇 方案 B 的原因

**問題：** 方案 A 的模擬結果顯示全年只節費 $54,638，遠低於預期的 50-100 萬。

**原因分析：**

- EV 充電站的負載是**間歇性的**
- 大部分時間沒有車在充電，loadKW = 0
- 電池只能在有負載時放電
- 即使一天有 500 kWh 尖峰用電，但分散在多個短時段，中間有大量空檔
- 電池實際放電量遠低於容量

**方案 B 的假設：**

- 假設站場有持續的基礎負載（或充電樁用電可被電池完全替代）
- 電池每天可以充分利用其 370 kWh 容量
- 更符合「理論最大節費能力評估」的需求

---

## 五、實際運行範例

### 5.1 典型工作日（方案 B）

假設 2025-01-02（週四）：

**無儲能：**

- 尖峰用電：514 kWh @ $12.14/kWh = $6,240
- 離峰用電：382 kWh @ $2.90/kWh = $1,108
- **總成本：$7,348**

**有儲能：**

1. 電池可替代量 = min(351.5, 514) = 351.5 kWh
2. 電池充電需求 = 351.5 / 0.9025 = 389.5 kWh
3. 尖峰成本 = (514 - 351.5) × $12.14 = $1,973
4. 離峰成本 = (382 + 389.5) × $2.90 = $2,237
5. **總成本：$4,210**
6. **節費：$3,138**

### 5.2 週末

週末沒有尖峰時段，電池不運作：

**無儲能 = 有儲能：**

- 全天離峰用電 @ $3.05 或 $2.90/kWh
- 節費 = $0

### 5.3 全年統計（2025）

根據方案 B 計算：

| 項目           | 數值             |
| -------------- | ---------------- |
| 工作日數       | 261 天           |
| 總尖峰用電     | 100,558 kWh      |
| 總尖峰替代     | 83,474 kWh (83%) |
| 平均每日替代   | 320 kWh          |
| 總電池充電     | 92,492 kWh       |
| **無儲能成本** | **$2,022,437**   |
| **有儲能成本** | **$1,272,597**   |
| **全年節費**   | **$749,839**     |

---

## 六、關鍵技術細節

### 6.1 效率計算

**充電效率（0.95）：**

```
電網供電 100 kWh → 電池儲存 95 kWh
損失：5 kWh (熱能)
```

**放電效率（0.95）：**

```
電池放出 100 kWh → 負載獲得 95 kWh
損失：5 kWh (熱能)
```

**往返效率（0.9025）：**

```
電網供電 100 kWh → 電池儲存 95 kWh → 負載獲得 90.25 kWh
總損失：9.75 kWh (9.75%)
```

### 6.2 契約容量限制

```typescript
// 來源：route.ts
CONTRACT_LIMIT = 432 kW
SAFETY_MARGIN = 0.85
MAX_GRID_POWER = 432 × 0.85 = 366.7 kW

// 充電時的約束
站場負載 + 充電功率 ≤ 366.7 kW

// 範例：
// 如果站場負載 = 300 kW
// 則充電功率 ≤ 66.7 kW（無法達到 PCS 上限 100 kW）
```

### 6.3 跨邊界時段處理

**目前邏輯（待優化）：**

- 充電記錄按**開始時間**分類為尖峰或離峰
- 如果記錄跨越尖離峰邊界（例如 15:50-16:10），整個記錄按開始時間分類

**影響：**

- 約 9.5% 的記錄（1,518/15,927）跨越邊界
- 可能導致部分能量被錯誤分類
- 但在方案 B 中影響較小（因為使用理論最大值）

---

## 七、結論

### 7.1 算法總結

**無儲能：**

```
成本 = Σ(尖峰kWh × 尖峰電價) + Σ(離峰kWh × 離峰電價)
```

**有儲能（方案 B）：**

```
成本 = Σ[(尖峰kWh - min(351.5, 尖峰kWh)) × 尖峰電價]
     + Σ[(離峰kWh + 電池充電量) × 離峰電價]

其中：電池充電量 = min(351.5, 尖峰kWh) / 0.9025
```

### 7.2 模擬系統特點

1. **嚴格的跨日 SOC 追蹤**：電池狀態真實持續，不會每天重置
2. **智慧充電策略**：每天 00:00 自動啟動充電，充滿後自動停止
3. **尖峰削峰**：在尖峰時段優先使用電池供電
4. **契約容量保護**：確保總取電不超過 366.7 kW
5. **效率損失建模**：充放電均考慮 5% 效率損失

### 7.3 方案 B 的價值

方案 B 提供**理論最大節費能力評估**，適用於：

- 評估儲能系統的投資回報率
- 展示儲能系統的最佳效益
- 忽略實際運營中的間歇性限制

雖然實際節費可能低於方案 B（因為負載間歇性），但方案 B 提供了一個**上限參考值**，幫助決策者了解儲能系統在理想條件下的潛力。

---

**文檔版本：** 1.0
**最後更新：** 2026-02-12
**相關文件：**

- `apps/web/app/api/neihu/report/route.ts` - 成本計算主邏輯
- `apps/web/utils/bess-unified.ts` - 充放電模擬核心
- `apps/web/config/neihu-simulation.config.ts` - 系統參數配置

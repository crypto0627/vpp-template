/**
 * 測試今日總用電量計算
 * 驗證有儲能的充電量是否正確計入
 */

import {
  simulateBESSForRealData,
  calculateElectricityCost,
  createPersistedState,
} from "@/utils/bess-unified";
import type { TelemetryData } from "@/types/data-type";
import { NEIHU_SIMULATION_CONFIG } from "@/config/site-configs";

const API_BASE_URL = "https://www.fortune-ess.com.tw/neihu/data";

async function testElectricityUsage() {
  console.log("🔋 測試今日總用電量計算\n");
  console.log("=".repeat(60));

  // 1. 獲取今天的數據
  console.log("\n📡 正在獲取今天的數據...");
  const response = await fetch(`${API_BASE_URL}?range=today&siteId=neihu`);

  if (!response.ok) {
    throw new Error(`API 返回錯誤: ${response.status}`);
  }

  const result = await response.json();
  const rawData: TelemetryData[] = result.data;

  if (!rawData || rawData.length === 0) {
    console.log("❌ 沒有數據");
    return;
  }

  console.log(`✅ 獲取 ${rawData.length} 筆數據`);

  const firstPoint = rawData[0];
  const lastPoint = rawData[rawData.length - 1];
  if (firstPoint && lastPoint) {
    const startTime = new Date(firstPoint.createAt).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });
    const endTime = new Date(lastPoint.createAt).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });
    console.log(`📅 數據時間範圍: ${startTime} ~ ${endTime}`);
  }

  // 2. 運行 BESS 模擬
  console.log("\n⚡ 運行 BESS 模擬...");
  const today = new Date(rawData[0]!.createAt);
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);

  const initialState = createPersistedState(
    todayMidnight.getTime(),
    NEIHU_SIMULATION_CONFIG,
    0,
  );
  const simulationResult = simulateBESSForRealData(
    rawData,
    NEIHU_SIMULATION_CONFIG,
    initialState,
  );
  const simulatedData = simulationResult.updatedData;

  console.log(`✅ 模擬完成，生成 ${simulatedData.length} 筆模擬數據`);

  // 3. 計算電費和用電量
  console.log("\n💰 計算電費和用電量...");
  const costResult = calculateElectricityCost(
    simulatedData,
    NEIHU_SIMULATION_CONFIG,
  );

  console.log("\n📊 【計算結果】");
  console.log("=".repeat(60));

  // 無儲能用電量
  const totalUsageWithoutBESS =
    costResult.peakUsageKWh + costResult.offPeakUsageKWh;
  console.log("\n🔸 無儲能（場站負載）:");
  console.log(`  尖峰用電:     ${costResult.peakUsageKWh.toFixed(2)} kWh`);
  console.log(`  離峰用電:     ${costResult.offPeakUsageKWh.toFixed(2)} kWh`);
  console.log(`  總用電量:     ${totalUsageWithoutBESS.toFixed(2)} kWh`);

  // 有儲能用電量
  const electricityUsageWithBESS =
    costResult.peakUsageKWh -
    costResult.peakDischargeKWh +
    (costResult.offPeakUsageKWh + costResult.offPeakChargeKWh);

  console.log("\n🔋 有儲能（電網取電）:");
  console.log(`  尖峰放電:     ${costResult.peakDischargeKWh.toFixed(2)} kWh`);
  console.log(`  離峰充電:     ${costResult.offPeakChargeKWh.toFixed(2)} kWh`);
  console.log(
    `  尖峰取電:     ${(costResult.peakUsageKWh - costResult.peakDischargeKWh).toFixed(2)} kWh`,
  );
  console.log(
    `  離峰取電:     ${(costResult.offPeakUsageKWh + costResult.offPeakChargeKWh).toFixed(2)} kWh`,
  );
  console.log(`  總用電量:     ${electricityUsageWithBESS.toFixed(2)} kWh`);

  // 差異
  const difference = electricityUsageWithBESS - totalUsageWithoutBESS;
  console.log("\n📈 用電量差異:");
  console.log(
    `  差異:         ${difference >= 0 ? "+" : ""}${difference.toFixed(2)} kWh`,
  );
  console.log(`  說明:         有儲能時從電網取電 = 負載 - 放電 + 充電`);

  // 驗證
  console.log("\n✅ 驗證結果:");
  if (costResult.offPeakChargeKWh > 0) {
    console.log(
      `  ✓ 充電量已計入: ${costResult.offPeakChargeKWh.toFixed(2)} kWh`,
    );
  } else {
    console.log("  ⚠️  今天尚無充電數據（可能還在尖峰時段或週末）");
  }

  if (costResult.peakDischargeKWh > 0) {
    console.log(
      `  ✓ 放電量已計入: ${costResult.peakDischargeKWh.toFixed(2)} kWh`,
    );
  } else {
    console.log("  ⚠️  今天尚無放電數據（可能還未到尖峰時段或週末）");
  }

  // 檢查 Power 欄位
  console.log("\n🔍 檢查 BESS.Power 欄位:");
  const sampleWithPower = simulatedData.filter(
    (d) => d.BESS?.Power !== undefined && d.BESS.Power !== 0,
  );
  if (sampleWithPower.length > 0) {
    console.log(`  ✓ 找到 ${sampleWithPower.length} 筆有 Power 數據的記錄`);
    const charging = sampleWithPower.filter(
      (d) => (d.BESS?.Power || 0) > 0,
    ).length;
    const discharging = sampleWithPower.filter(
      (d) => (d.BESS?.Power || 0) < 0,
    ).length;
    console.log(`    - 充電記錄: ${charging} 筆`);
    console.log(`    - 放電記錄: ${discharging} 筆`);
  } else {
    console.log("  ❌ 沒有找到 Power 數據！模擬可能有問題");
  }

  console.log("\n" + "=".repeat(60));
}

// 執行測試
testElectricityUsage().catch((error) => {
  console.error("\n❌ 測試過程發生錯誤:", error);
  if (error instanceof Error) {
    console.error(`   錯誤訊息: ${error.message}`);
  }
  process.exit(1);
});

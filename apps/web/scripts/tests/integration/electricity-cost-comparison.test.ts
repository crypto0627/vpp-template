/**
 * 電費成本對比測試
 * 比較有儲能 vs 沒儲能的總用電量和電費成本
 *
 * 使用方法：
 * npx tsx apps/web/scripts/tests/integration/electricity-cost-comparison-test.ts
 */

import {
  simulateBESSForRealData,
  calculateElectricityCost,
  createPersistedState,
} from "@/utils/bess-unified";
import type { TelemetryData } from "@/types/data-type";
import { NEIHU_SIMULATION_CONFIG } from "@/config/site-configs";

const API_BASE_URL = "https://www.fortune-ess.com.tw/neihu/data";

async function main() {
  console.log("🔋 電費成本對比測試\n");
  console.log("=".repeat(60));

  try {
    // 1. 獲取今天的數據
    console.log("\n📡 正在獲取今天的數據...");
    const response = await fetch(`${API_BASE_URL}?range=today&siteId=neihu`);

    if (!response.ok) {
      throw new Error(`API 返回錯誤: ${response.status}`);
    }

    const result = await response.json();
    const rawData: TelemetryData[] = result.data;

    if (!rawData || rawData.length === 0) {
      console.log("❌ 沒有數據可供分析");
      return;
    }

    console.log(`✅ 成功獲取 ${rawData.length} 筆數據點`);

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
    console.log("\n⚡ 正在運行 BESS 模擬...");

    const today = new Date(rawData[0]!.createAt);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    const initialState = createPersistedState(
      todayMidnight.getTime(),
      NEIHU_SIMULATION_CONFIG,
      0, // 從空電池開始
    );

    const simulationResult = simulateBESSForRealData(
      rawData,
      NEIHU_SIMULATION_CONFIG,
      initialState,
    );
    const simulatedData = simulationResult.updatedData;

    console.log(`✅ 模擬完成，生成 ${simulatedData.length} 筆模擬數據`);

    // 3. 計算沒有儲能的電費（僅計算場站負載）
    console.log("\n💰 計算沒有儲能的電費成本...");
    const costWithoutBESS = calculateElectricityCost(
      rawData,
      NEIHU_SIMULATION_CONFIG,
    );

    console.log("\n📊 【沒有儲能】電力使用與成本：");
    console.log("-".repeat(60));
    console.log(
      `  尖峰用電量:   ${costWithoutBESS.peakUsageKWh.toFixed(2)} kWh`,
    );
    console.log(
      `  離峰用電量:   ${costWithoutBESS.offPeakUsageKWh.toFixed(2)} kWh`,
    );
    console.log(
      `  總用電量:     ${(costWithoutBESS.peakUsageKWh + costWithoutBESS.offPeakUsageKWh).toFixed(2)} kWh`,
    );
    console.log(`  \n  尖峰電費:     $${costWithoutBESS.peakCost.toFixed(2)}`);
    console.log(`  離峰電費:     $${costWithoutBESS.offPeakCost.toFixed(2)}`);
    console.log(
      `  總電費:       $${costWithoutBESS.costWithoutBESS.toFixed(2)}`,
    );

    // 4. 計算有儲能的電費
    console.log("\n💰 計算有儲能的電費成本...");
    const costWithBESS = calculateElectricityCost(
      simulatedData,
      NEIHU_SIMULATION_CONFIG,
    );

    console.log("\n📊 【有儲能】電力使用與成本：");
    console.log("-".repeat(60));
    console.log(`  尖峰用電量:   ${costWithBESS.peakUsageKWh.toFixed(2)} kWh`);
    console.log(
      `  離峰用電量:   ${costWithBESS.offPeakUsageKWh.toFixed(2)} kWh`,
    );
    console.log(
      `  總用電量:     ${(costWithBESS.peakUsageKWh + costWithBESS.offPeakUsageKWh).toFixed(2)} kWh`,
    );
    console.log(
      `  \n  離峰充電:     ${costWithBESS.offPeakChargeKWh.toFixed(2)} kWh`,
    );
    console.log(
      `  尖峰放電:     ${costWithBESS.peakDischargeKWh.toFixed(2)} kWh`,
    );
    console.log(`  \n  尖峰電費:     $${costWithBESS.peakCost.toFixed(2)}`);
    console.log(`  離峰電費:     $${costWithBESS.offPeakCost.toFixed(2)}`);
    console.log(`  總電費:       $${costWithBESS.costWithBESS.toFixed(2)}`);

    // 5. 計算差異與節省
    console.log("\n💡 【儲能效益分析】");
    console.log("=".repeat(60));

    const totalUsageWithoutBESS =
      costWithoutBESS.peakUsageKWh + costWithoutBESS.offPeakUsageKWh;
    const totalUsageWithBESS =
      costWithBESS.peakUsageKWh + costWithBESS.offPeakUsageKWh;
    const usageDiff = totalUsageWithBESS - totalUsageWithoutBESS;

    console.log(`\n📈 用電量對比:`);
    console.log(
      `  無儲能總用電:  ${totalUsageWithoutBESS.toFixed(2)} kWh (場站負載)`,
    );
    console.log(
      `  有儲能總用電:  ${totalUsageWithBESS.toFixed(2)} kWh (電網取電)`,
    );
    console.log(
      `  用電差異:      ${usageDiff >= 0 ? "+" : ""}${usageDiff.toFixed(2)} kWh`,
    );
    console.log(
      `  說明:          有儲能時從電網取電 = 場站負載 - 尖峰放電 + 離峰充電`,
    );

    const costDiff =
      costWithoutBESS.costWithoutBESS - costWithBESS.costWithBESS;
    const savingsRate = (costDiff / costWithoutBESS.costWithoutBESS) * 100;

    console.log(`\n💰 電費對比:`);
    console.log(
      `  無儲能電費:    $${costWithoutBESS.costWithoutBESS.toFixed(2)}`,
    );
    console.log(`  有儲能電費:    $${costWithBESS.costWithBESS.toFixed(2)}`);
    console.log(`  節省金額:      $${costDiff.toFixed(2)}`);
    console.log(`  節費率:        ${savingsRate.toFixed(2)}%`);

    // 6. 儲能運作摘要
    console.log(`\n🔋 儲能運作摘要:`);
    console.log(
      `  離峰充電量:    ${costWithBESS.offPeakChargeKWh.toFixed(2)} kWh`,
    );
    console.log(
      `  尖峰放電量:    ${costWithBESS.peakDischargeKWh.toFixed(2)} kWh`,
    );
    console.log(
      `  充放電效率:    ${costWithBESS.offPeakChargeKWh > 0 ? ((costWithBESS.peakDischargeKWh / costWithBESS.offPeakChargeKWh) * 100).toFixed(1) : 0}%`,
    );

    // 7. 結論
    console.log("\n" + "=".repeat(60));
    if (costDiff > 0) {
      console.log(
        `✅ 結論: 儲能系統今日節省電費 $${costDiff.toFixed(2)} (${savingsRate.toFixed(2)}%)`,
      );
    } else if (costDiff < 0) {
      console.log(
        `⚠️  結論: 今日儲能成本高於無儲能 $${Math.abs(costDiff).toFixed(2)}`,
      );
      console.log(`   可能原因: 充電成本高於放電節省，或充放電效率較低`);
    } else {
      console.log(`ℹ️  結論: 今日儲能與無儲能電費相同`);
    }
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ 測試過程發生錯誤:", error);
    if (error instanceof Error) {
      console.error(`   錯誤訊息: ${error.message}`);
    }
    process.exit(1);
  }
}

// 執行測試
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

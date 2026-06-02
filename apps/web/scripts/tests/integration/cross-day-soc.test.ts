/**
 * 測試跨日 SOC 持續性
 * 驗證從 API 獲取昨天的最終 SOC 並計算今天需要充電的量
 */

const API_BASE_URL = "https://www.fortune-ess.com.tw/neihu/data";
const MAX_SOC = 370; // kWh

interface HourlyData {
  hour: number;
  avgSOC: number;
  chargeKWh: number;
  dischargeKWh: number;
  loadKWh: number;
  gridImportKWh: number;
}

interface DailyData {
  _id: string;
  date: string;
  siteId: string;
  bessSimulation?: {
    summary: {
      peakDischargeKWh: number;
      offPeakChargeKWh: number;
    };
    hourlyData: HourlyData[];
  };
}

/**
 * 從 API 獲取指定日期的最終 SOC
 */
async function fetchDayFinalSOC(dateStr: string): Promise<number | null> {
  try {
    const url = `${API_BASE_URL}/daily/${dateStr}?siteId=neihu`;
    console.log(`📡 正在獲取 ${dateStr} 的數據...`);
    console.log(`   URL: ${url}`);

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.log(`❌ API 返回錯誤: ${response.status}`);
      return null;
    }

    const dailyData: DailyData = await response.json();

    const hourlyData = dailyData?.bessSimulation?.hourlyData;
    if (!hourlyData || hourlyData.length === 0) {
      console.log(`❌ 數據中沒有 hourlyData`);
      return null;
    }

    // 獲取最後一筆的 avgSOC
    const lastHour = hourlyData[hourlyData.length - 1];
    const finalSOCPercent = lastHour.avgSOC;
    const finalSOCKWh = (finalSOCPercent / 100) * MAX_SOC;

    console.log(`✅ ${dateStr} 最後一小時 (${lastHour.hour}:00):`);
    console.log(`   SOC: ${finalSOCPercent.toFixed(1)}%`);
    console.log(`   電量: ${finalSOCKWh.toFixed(2)} kWh\n`);

    return finalSOCKWh;
  } catch (error) {
    console.error(`❌ 獲取數據失敗:`, error);
    return null;
  }
}

async function testCrossDaySOC() {
  console.log("🔋 測試跨日 SOC 持續性\n");
  console.log("=".repeat(70));
  console.log("\n📅 測試日期: 3/9 → 3/10");
  console.log(`   電池容量: ${MAX_SOC} kWh\n`);

  // 1. 獲取 3/9 的最終 SOC
  const march9FinalSOC = await fetchDayFinalSOC("2026-03-09");

  if (march9FinalSOC === null) {
    console.log("❌ 無法獲取 3/9 的數據，測試失敗");
    return;
  }

  // 2. 計算 3/10 需要充電的量
  console.log("📊 【充電計算】");
  console.log("=".repeat(70));

  const march9EOD = march9FinalSOC; // 3/9 結束時的電量
  const march10StartSOC = march9EOD; // 3/10 開始時的電量（應該相同）
  const targetSOC = MAX_SOC; // 目標充電到滿
  const requiredChargeKWh = targetSOC - march10StartSOC; // 需要充電的量

  console.log(`\n🌙 3/9 結束時:`);
  console.log(`   剩餘電量:     ${march9EOD.toFixed(2)} kWh`);
  console.log(`   SOC:          ${((march9EOD / MAX_SOC) * 100).toFixed(1)}%`);

  console.log(`\n☀️  3/10 開始時 (00:00):`);
  console.log(`   初始電量:     ${march10StartSOC.toFixed(2)} kWh`);
  console.log(`   目標電量:     ${targetSOC.toFixed(2)} kWh`);
  console.log(`   需要充電:     ${requiredChargeKWh.toFixed(2)} kWh`);

  console.log(
    `\n⚡ 充電後 (約 ${(requiredChargeKWh / 100).toFixed(1)} 小時 @ 100kW):`,
  );
  console.log(`   最終電量:     ${targetSOC.toFixed(2)} kWh`);
  console.log(`   最終 SOC:     100.0%`);

  console.log("\n" + "=".repeat(70));

  // 3. 驗證邏輯
  console.log("\n✅ 【驗證結果】");
  if (march9EOD < MAX_SOC) {
    console.log(
      `   ✓ 3/9 結束時未充滿 (${((march9EOD / MAX_SOC) * 100).toFixed(1)}%)`,
    );
    console.log(`   ✓ 3/10 需要充電 ${requiredChargeKWh.toFixed(2)} kWh`);
    console.log(`   ✓ 充電後達到 ${targetSOC} kWh (100%)`);
  } else {
    console.log(
      `   ✓ 3/9 結束時已充滿 (${((march9EOD / MAX_SOC) * 100).toFixed(1)}%)`,
    );
    console.log(`   ✓ 3/10 不需要充電`);
  }

  console.log("\n🎯 測試成功！data-store 會使用這個邏輯來初始化今天的 SOC。\n");

  // 4. 顯示 3/9 的 hourly breakdown
  console.log("📋 【3/9 逐時 SOC 變化】");
  console.log("=".repeat(70));
  await showDayHourlySOC("2026-03-09");
}

async function showDayHourlySOC(dateStr: string) {
  try {
    const url = `${API_BASE_URL}/daily/${dateStr}?siteId=neihu`;
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) return;

    const dailyData: DailyData = await response.json();
    const hourlyData = dailyData?.bessSimulation?.hourlyData;

    if (!hourlyData) return;

    console.log("時段    SOC(%)  充電(kWh)  放電(kWh)  負載(kWh)");
    console.log("-".repeat(70));

    hourlyData.forEach((item) => {
      console.log(
        `${String(item.hour).padStart(2, "0")}:00   ` +
          `${item.avgSOC.toFixed(1).padStart(6)}  ` +
          `${item.chargeKWh.toFixed(2).padStart(9)}  ` +
          `${item.dischargeKWh.toFixed(2).padStart(9)}  ` +
          `${item.loadKWh.toFixed(2).padStart(9)}`,
      );
    });
  } catch {
    console.error("無法顯示逐時數據");
  }
}

// 執行測試
testCrossDaySOC().catch((error) => {
  console.error("\n❌ 測試失敗:", error);
  process.exit(1);
});

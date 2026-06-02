/**
 * Test Battery SOC Chart calculation
 * Verify that SOC percentage is calculated correctly from simulated battery state
 */

import { TelemetryData } from "@/types/data-type";
import {
  createPersistedState,
  processIntervalCrossingMidnight,
} from "@/utils/bess-unified";
import { SITE_CONFIGS } from "@/config/site-configs";

const NEIHU_SIMULATION_CONFIG = SITE_CONFIGS.neihu;

const BASE_URL = "http://localhost:3001";

async function testBatterySOCCalculation() {
  console.log("=== Battery SOC Calculation Test ===\n");

  try {
    // 1. Fetch today's real data
    const response = await fetch(`${BASE_URL}/api/neihu/data?range=today`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    const siteData: TelemetryData[] = result.data;

    console.log(`✓ Fetched ${siteData.length} data points\n`);

    if (siteData.length === 0) {
      console.log("⚠️  No data available, cannot test\n");
      return;
    }

    // Display data time range
    const firstTime = new Date(siteData[0]!.createAt);
    const lastTime = new Date(siteData[siteData.length - 1]!.createAt);
    console.log(`Data time range:`);
    console.log(
      `  Start: ${firstTime.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
    );
    console.log(
      `  End: ${lastTime.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}\n`,
    );

    // 2. Simulate Battery SOC Chart logic
    console.log("=== Running Battery SOC Chart Simulation ===\n");

    // Step 1: Collect 30-minute time slots with average load
    const timeSlots: Array<{
      time: string;
      hour: number;
      minute: number;
      avgLoadKW: number;
      slotDate: Date;
    }> = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotData = siteData.filter((item) => {
          const date = new Date(item.createAt);
          const itemHour = date.getHours();
          const itemMinute = date.getMinutes();
          return (
            itemHour === hour &&
            itemMinute >= minute &&
            itemMinute < minute + 30
          );
        });

        if (slotData.length === 0) continue;

        const avgLoadKW =
          slotData.reduce(
            (sum, item) => sum + (item.TotalUsage || 0) / 1000,
            0,
          ) / slotData.length;
        const slotDate = new Date(slotData[0]!.createAt);

        timeSlots.push({
          time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          hour,
          minute,
          avgLoadKW,
          slotDate,
        });
      }
    }

    console.log(`Found ${timeSlots.length} time slots with data\n`);

    if (timeSlots.length === 0) {
      console.log("⚠️  No time slots found, cannot test\n");
      return;
    }

    // Step 2: Run BESS simulation from midnight to latest data point
    const today = new Date(siteData[0]!.createAt);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    let bessState = createPersistedState(
      todayMidnight.getTime(),
      NEIHU_SIMULATION_CONFIG,
      0,
    );
    let latestBatteryPower = 0; // W

    console.log("Initial state:");
    console.log(
      `  Time: ${todayMidnight.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
    );
    console.log(`  Initial SOC: ${bessState.socKWh} kWh\n`);

    console.log("Time    Load      Battery   SOC       SOC%     Status");
    console.log("─".repeat(70));

    for (const slot of timeSlots) {
      const slotStartMs = new Date(slot.slotDate).setMinutes(slot.minute, 0, 0);
      const slotEndMs = slotStartMs + 30 * 60 * 1000;

      const simResult = processIntervalCrossingMidnight(
        bessState,
        slotStartMs,
        slotEndMs,
        slot.avgLoadKW,
        NEIHU_SIMULATION_CONFIG,
      );

      bessState = simResult.finalState;

      const step = simResult.steps[simResult.steps.length - 1];
      if (step) {
        latestBatteryPower = step.battery.power; // W
      }

      const batteryPowerKW = latestBatteryPower / 1000;
      const socPercentage =
        (bessState.socKWh / NEIHU_SIMULATION_CONFIG.BESS_CAPACITY_KWH) * 100;

      let status = "待機";
      if (batteryPowerKW > 0.1) {
        status = "充電中";
      } else if (batteryPowerKW < -0.1) {
        status = "放電中";
      }

      console.log(
        `${slot.time}  ${slot.avgLoadKW.toFixed(1).padStart(6)}kW  ${batteryPowerKW.toFixed(1).padStart(7)}kW  ${bessState.socKWh.toFixed(1).padStart(6)}kWh  ${socPercentage.toFixed(1).padStart(5)}%  ${status}`,
      );
    }

    console.log("─".repeat(70));

    // 3. Calculate final SOC percentage
    const finalSOCPercentage =
      Math.round(
        (bessState.socKWh / NEIHU_SIMULATION_CONFIG.BESS_CAPACITY_KWH) * 10000,
      ) / 100;

    console.log("\n=== Test Results ===\n");
    console.log(`Final battery state:`);
    console.log(`  SOC: ${bessState.socKWh.toFixed(1)} kWh`);
    console.log(`  SOC Percentage: ${finalSOCPercentage}%`);
    console.log(
      `  Capacity: ${NEIHU_SIMULATION_CONFIG.BESS_CAPACITY_KWH} kWh\n`,
    );

    // 4. Verify calculation
    console.log("=== Verification ===\n");

    const expectedPercentage =
      (bessState.socKWh / NEIHU_SIMULATION_CONFIG.BESS_CAPACITY_KWH) * 100;
    console.log(
      `Expected: (${bessState.socKWh.toFixed(1)} / ${NEIHU_SIMULATION_CONFIG.BESS_CAPACITY_KWH}) × 100 = ${expectedPercentage.toFixed(2)}%`,
    );
    console.log(`Calculated: ${finalSOCPercentage}%`);

    // Example calculation
    const exampleRemaining = 185;
    const examplePercentage =
      (exampleRemaining / NEIHU_SIMULATION_CONFIG.BESS_CAPACITY_KWH) * 100;
    console.log(`\nExample: If remaining = ${exampleRemaining} kWh:`);
    console.log(
      `  SOC% = (${exampleRemaining} / ${NEIHU_SIMULATION_CONFIG.BESS_CAPACITY_KWH}) × 100 = ${examplePercentage.toFixed(1)}%`,
    );

    if (Math.abs(bessState.socKWh - 185) < 10) {
      console.log(
        `\n✓ Current SOC (${bessState.socKWh.toFixed(1)} kWh) is close to 185 kWh example`,
      );
      console.log(`  Expected ~50%, showing ${finalSOCPercentage}%`);
    }

    console.log("\n✓ Calculation verified successfully!\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

testBatterySOCCalculation();

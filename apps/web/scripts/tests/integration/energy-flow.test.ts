/**
 * Test Energy Flow Diagram calculation
 * Verify battery discharge is capped at PCS capacity
 */

import { TelemetryData } from "@/types/data-type";
import {
  createPersistedState,
  processIntervalCrossingMidnight,
} from "@/utils/bess-unified";
import { getSiteConfig } from "@/config/site-configs";

const BASE_URL = "http://localhost:3001";

async function testEnergyFlow() {
  console.log("=== Energy Flow Diagram Test ===\n");

  try {
    // Fetch today's real data
    const response = await fetch(`${BASE_URL}/api/neihu/data?range=today`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    const siteData: TelemetryData[] = result.data;

    console.log(`✓ Fetched ${siteData.length} data points\n`);

    if (siteData.length === 0) {
      console.log("⚠️  No data available\n");
      return;
    }

    // Get site config
    const siteConfig = getSiteConfig("neihu");
    console.log(`Site Configuration:`);
    console.log(`  BESS Capacity: ${siteConfig.BESS_CAPACITY_KWH} kWh`);
    console.log(`  PCS Capacity: ${siteConfig.PCS_CAPACITY_KW} kW\n`);

    // Get latest data
    const latestData = siteData[siteData.length - 1];
    if (!latestData) {
      console.log("⚠️  No latest data\n");
      return;
    }

    // Charging station load from TotalUsage
    const chargingStationLoad =
      Math.round(((latestData.TotalUsage || 0) / 1000) * 100) / 100;
    console.log(`Latest Charging Station Load: ${chargingStationLoad} kW\n`);

    // Run BESS simulation
    console.log("=== Running BESS Simulation ===\n");

    const timeSlots: Array<{
      avgLoadKW: number;
      slotDate: Date;
      minute: number;
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
          avgLoadKW,
          slotDate,
          minute,
        });
      }
    }

    // Run simulation from midnight to now
    const today = new Date(siteData[0]!.createAt);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    let bessState = createPersistedState(
      todayMidnight.getTime(),
      siteConfig,
      0,
    );
    let latestBatteryPower = 0; // W

    for (const slot of timeSlots) {
      const slotStartMs = new Date(slot.slotDate).setMinutes(slot.minute, 0, 0);
      const slotEndMs = slotStartMs + 30 * 60 * 1000;

      const simResult = processIntervalCrossingMidnight(
        bessState,
        slotStartMs,
        slotEndMs,
        slot.avgLoadKW,
        siteConfig,
      );

      bessState = simResult.finalState;

      const step = simResult.steps[simResult.steps.length - 1];
      if (step) {
        latestBatteryPower = step.battery.power; // W
      }
    }

    console.log(
      `Simulated Battery Power: ${(latestBatteryPower / 1000).toFixed(2)} kW`,
    );
    console.log(`Battery SOC: ${bessState.socKWh.toFixed(2)} kWh\n`);

    // Calculate BESS power and status
    let bessPowerKW =
      Math.round(Math.abs(latestBatteryPower / 1000) * 100) / 100;

    let bessStatus: "charging" | "discharging" | "idle";
    if (Math.abs(latestBatteryPower) < 100) {
      bessStatus = "idle";
    } else if (latestBatteryPower > 0) {
      bessStatus = "charging";
    } else {
      bessStatus = "discharging";
    }

    console.log(`=== Energy Flow Calculation ===\n`);
    console.log(`Battery Status: ${bessStatus}`);
    console.log(`Raw Battery Power: ${bessPowerKW} kW\n`);

    // Apply PCS capacity constraints
    let gridPower: number;
    if (bessStatus === "charging") {
      bessPowerKW = Math.min(bessPowerKW, siteConfig.PCS_CAPACITY_KW);
      gridPower = Math.round((chargingStationLoad + bessPowerKW) * 100) / 100;

      console.log(`Charging Mode:`);
      console.log(`  Battery Charge Power (capped): ${bessPowerKW} kW`);
      console.log(
        `  Grid Power = Load + Battery = ${chargingStationLoad} + ${bessPowerKW} = ${gridPower} kW`,
      );
    } else if (bessStatus === "discharging") {
      const rawBessPower = bessPowerKW;
      bessPowerKW = Math.min(
        bessPowerKW,
        siteConfig.PCS_CAPACITY_KW,
        chargingStationLoad,
      );
      gridPower = Math.round((chargingStationLoad - bessPowerKW) * 100) / 100;

      console.log(`Discharging Mode:`);
      console.log(`  Raw Battery Discharge: ${rawBessPower} kW`);
      console.log(`  PCS Capacity Limit: ${siteConfig.PCS_CAPACITY_KW} kW`);
      console.log(`  Load Limit: ${chargingStationLoad} kW`);
      console.log(`  Battery Discharge (capped): ${bessPowerKW} kW`);
      console.log(
        `  Grid Power = Load - Battery = ${chargingStationLoad} - ${bessPowerKW} = ${gridPower} kW`,
      );

      if (rawBessPower > siteConfig.PCS_CAPACITY_KW) {
        console.log(`\n  ⚠️  Battery power exceeded PCS capacity!`);
        console.log(`  ✓ Correctly capped to ${siteConfig.PCS_CAPACITY_KW} kW`);
      }

      if (chargingStationLoad > siteConfig.PCS_CAPACITY_KW) {
        console.log(
          `\n  ✓ Load (${chargingStationLoad} kW) > PCS (${siteConfig.PCS_CAPACITY_KW} kW)`,
        );
        console.log(
          `  ✓ Battery discharges at max PCS capacity: ${bessPowerKW} kW`,
        );
        console.log(`  ✓ Grid supplies remaining: ${gridPower} kW`);
      }
    } else {
      gridPower = chargingStationLoad;
      console.log(`Idle Mode:`);
      console.log(`  Battery Power: 0 kW`);
      console.log(`  Grid Power = Load = ${gridPower} kW`);
    }

    console.log(`\n=== Final Energy Flow ===`);
    console.log(`📊 Charging Station Load: ${chargingStationLoad} kW`);
    console.log(`🔋 Battery Power: ${bessPowerKW} kW (${bessStatus})`);
    console.log(`⚡ Grid Power: ${gridPower} kW`);
    console.log(`\n✓ Test completed successfully!\n`);
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

testEnergyFlow();

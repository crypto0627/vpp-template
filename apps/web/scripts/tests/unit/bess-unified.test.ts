/**
 * Strict Cross-Day BESS Simulation - Unit Tests
 *
 * 測試嚴格跨日 SOC 持續性和午夜行為
 */

import { describe, it, expect } from "vitest";
import {
  stepBESSSimulation,
  processIntervalCrossingMidnight,
  createPersistedState,
  isPeakTimeTW,
  getMaxSOC,
  getMaxGridPower,
} from "@/utils/bess-unified";
import { NEIHU_SIMULATION_CONFIG } from "@/config/site-configs";

const CONFIG = NEIHU_SIMULATION_CONFIG;
const PCS_MAX_POWER = CONFIG.PCS_CAPACITY_KW;
const MAX_GRID_POWER = getMaxGridPower(CONFIG);

describe("Strict Cross-Day BESS Simulation", () => {
  /**
   * Test 1: Cross Midnight Split (23:45 -> 00:15)
   */
  describe("Test 1: Cross Midnight Split", () => {
    it("should split interval crossing midnight and activate charging at 00:00", () => {
      // Setup: Wednesday 2026-02-04 23:45 TW time
      // UTC+8, so TW 2026-02-04 23:45 = UTC 2026-02-04 15:45
      const startDate = new Date("2026-02-04T15:45:00.000Z"); // TW 23:45
      const endDate = new Date("2026-02-04T16:15:00.000Z"); // TW 00:15 next day (2026-02-05)

      // Initial state from previous day (session already completed)
      const initialState = createPersistedState(
        startDate.getTime(),
        CONFIG,
        100,
      );
      initialState.lastChargeSessionDateTW = "2026-02-04"; // Same day as 23:45
      initialState.chargeSessionActive = false; // Session ended

      const siteLoadKW = 50;

      // Process interval crossing midnight
      const result = processIntervalCrossingMidnight(
        initialState,
        startDate.getTime(),
        endDate.getTime(),
        siteLoadKW,
        CONFIG,
      );

      // Assertions:
      expect(result.steps.length).toBe(2); // Should split into 2 steps

      // Step 1: 23:45 -> 00:00 (15 minutes, no charging session - previous day's session ended)
      const step1 = result.steps[0];
      if (!step1) throw new Error("Step 1 missing");
      expect(step1.battery.newSOCKWh).toBe(100); // SOC unchanged
      expect(step1.battery.power).toBe(0); // No charging

      // Step 2: 00:00 -> 00:15 (15 minutes, NEW DAY - charging session starts)
      const step2 = result.steps[1];
      if (!step2) throw new Error("Step 2 missing");
      expect(step2.battery.newSOCKWh).toBeGreaterThan(100); // SOC increased
      expect(step2.battery.power).toBeGreaterThan(0); // Charging active
      expect(step2.battery.current).toBeGreaterThan(0); // Positive current

      // Final state checks
      const maxSOC = getMaxSOC(endDate.getTime(), CONFIG);
      expect(result.finalState.socKWh).toBeGreaterThan(100);
      expect(result.finalState.socKWh).toBeLessThanOrEqual(maxSOC);
      expect(result.finalState.chargeSessionActive).toBe(true);
      expect(result.finalState.lastChargeSessionDateTW).toBe("2026-02-05"); // New day
    });
  });

  /**
   * Test 2: Charging Session Stops After Full
   */
  describe("Test 2: Charging Session Stops After Full", () => {
    it("should stop charging when SOC reaches maxSOC", () => {
      // Setup: Thursday 2026-02-05 00:00 TW
      // TW 2026-02-05 00:00 = UTC 2026-02-04 16:00
      const startTime = new Date("2026-02-04T16:00:00.000Z"); // TW 00:00
      const maxSOC = getMaxSOC(startTime.getTime(), CONFIG);
      const initialSOC = maxSOC - 10;

      let state = createPersistedState(startTime.getTime(), CONFIG, initialSOC);
      state.chargeSessionActive = true; // Session started at 00:00
      state.lastChargeSessionDateTW = "2026-02-05"; // Current day

      const siteLoadKW = 20; // Low load
      const intervalHours = 0.25; // 15 minutes

      // Simulate several intervals
      const results = [];
      let reachedFullOnce = false;

      for (let i = 0; i < 8; i++) {
        // 2 hours = 8 intervals of 15 min
        const currentTime = new Date(startTime.getTime() + i * 15 * 60 * 1000);
        const result = stepBESSSimulation(
          state,
          currentTime,
          siteLoadKW,
          intervalHours,
          CONFIG,
        );
        results.push(result);
        state = result.newState;

        // Once full, mark it
        if (result.newState.socKWh >= maxSOC) {
          reachedFullOnce = true;
          expect(result.newState.socKWh).toBe(maxSOC);
          expect(result.newState.chargeSessionActive).toBe(false);
        }

        // After reaching full once, all subsequent intervals should have zero charging
        if (reachedFullOnce && i > 0) {
          const prevResult = results[i - 1];
          if (prevResult && prevResult.newState.socKWh >= maxSOC) {
            // This interval starts with full battery
            expect(result.battery.power).toBe(0);
            expect(result.battery.current).toBe(0);
          }
        }
      }

      // Final assertions
      expect(state.socKWh).toBe(maxSOC);
      expect(state.chargeSessionActive).toBe(false);
      expect(reachedFullOnce).toBe(true);

      // Last result should have zero charging power (battery is full)
      const lastResult = results[results.length - 1];
      if (lastResult) {
        expect(lastResult.battery.power).toBe(0);
        expect(lastResult.battery.current).toBe(0);
      }
    });
  });

  /**
   * Test 3: Peak Discharge Only During Peak
   */
  describe("Test 3: Peak Discharge Only During Peak", () => {
    it("should only discharge during peak hours on weekdays", () => {
      // Setup: Monday 2026-02-02 (non-summer), 14:00-16:00 TW
      // TW 2026-02-02 14:00 = UTC 2026-02-02 06:00
      const startTime14 = new Date("2026-02-02T06:00:00.000Z"); // TW 14:00
      const time15 = new Date("2026-02-02T07:00:00.000Z"); // TW 15:00
      const time16 = new Date("2026-02-02T08:00:00.000Z"); // TW 16:00

      const state = createPersistedState(startTime14.getTime(), CONFIG, 200);
      state.lastChargeSessionDateTW = "2026-02-02";
      state.chargeSessionActive = false; // No active charging session in afternoon

      const siteLoadKW = 80;

      // 14:00-15:00 (off-peak for non-summer)
      const result1 = stepBESSSimulation(
        state,
        time15,
        siteLoadKW,
        1.0,
        CONFIG,
      );
      expect(result1.battery.power).toBeLessThanOrEqual(0); // No discharge or zero
      expect(result1.newState.socKWh).toBe(200); // SOC unchanged (no session active, no peak)

      // 15:00-16:00 (peak for non-summer weekday)
      const result2 = stepBESSSimulation(
        result1.newState,
        time16,
        siteLoadKW,
        1.0,
        CONFIG,
      );
      expect(isPeakTimeTW(time15, CONFIG)).toBe(true); // Verify it's peak
      expect(result2.battery.power).toBeLessThan(0); // Discharging (negative power)
      expect(result2.battery.current).toBeLessThan(0); // Negative current
      expect(result2.newState.socKWh).toBeLessThan(result1.newState.socKWh); // SOC decreased
    });
  });

  /**
   * Test 4: Weekend Has No Peak
   */
  describe("Test 4: Weekend Has No Peak", () => {
    it("should treat weekend as off-peak (no discharge)", () => {
      // Setup: Saturday 2026-02-07, 15:00-17:00 TW
      // TW 2026-02-07 15:00 = UTC 2026-02-07 07:00
      const time15 = new Date("2026-02-07T07:00:00.000Z"); // Saturday TW 15:00
      const time16 = new Date("2026-02-07T08:00:00.000Z"); // Saturday TW 16:00
      const time17 = new Date("2026-02-07T09:00:00.000Z"); // Saturday TW 17:00

      const state = createPersistedState(time15.getTime(), CONFIG, 200);
      state.lastChargeSessionDateTW = "2026-02-07";
      state.chargeSessionActive = false;

      const siteLoadKW = 80;

      // Verify these times are NOT peak (weekend)
      expect(isPeakTimeTW(time15, CONFIG)).toBe(false);
      expect(isPeakTimeTW(time16, CONFIG)).toBe(false);

      // 15:00-16:00
      const result1 = stepBESSSimulation(
        state,
        time16,
        siteLoadKW,
        1.0,
        CONFIG,
      );
      expect(result1.battery.current).toBeGreaterThanOrEqual(0); // No discharge
      expect(result1.newState.socKWh).toBe(200); // SOC unchanged (no session)

      // 16:00-17:00
      const result2 = stepBESSSimulation(
        result1.newState,
        time17,
        siteLoadKW,
        1.0,
        CONFIG,
      );
      expect(result2.battery.current).toBeGreaterThanOrEqual(0); // No discharge
      expect(result2.newState.socKWh).toBe(result1.newState.socKWh);
    });
  });

  /**
   * Test 5: Charging Power Limits
   */
  describe("Test 5: Charging Power Limits", () => {
    it("should charge at PCS max power when off-peak session is active", () => {
      // Setup: Thursday 2026-02-05 00:00 TW
      // TW 2026-02-05 00:00 = UTC 2026-02-04 16:00
      const startTime = new Date("2026-02-04T16:00:00.000Z"); // TW 00:00
      const time01 = new Date("2026-02-04T17:00:00.000Z"); // TW 01:00

      const state = createPersistedState(startTime.getTime(), CONFIG, 0);
      state.chargeSessionActive = true; // Session active at 00:00
      state.lastChargeSessionDateTW = "2026-02-05";

      const highLoad = 330; // kW (very high load)

      // Simulate 00:00 -> 01:00 (1 hour)
      const result = stepBESSSimulation(state, time01, highLoad, 1.0, CONFIG);

      // Assertions
      expect(result.battery.power).toBeGreaterThan(0); // Should be charging
      expect(result.battery.current).toBeGreaterThan(0); // Positive current

      // Charging power should not exceed PCS max
      const chargePowerKW = result.battery.power / 1000;
      expect(chargePowerKW).toBeLessThanOrEqual(PCS_MAX_POWER);

      // Grid import will include load + charging
      // This scenario is fine because the algorithm no longer derates on
      // contract capacity, only PCS max. AC side = DC / charge_efficiency.
      const maxAcChargeKW = PCS_MAX_POWER / CONFIG.CHARGE_EFFICIENCY;
      expect(result.gridImportKW).toBeGreaterThan(highLoad);
      expect(result.gridImportKW).toBeLessThanOrEqual(
        highLoad + maxAcChargeKW + 0.1,
      );

      // SOC should increase (charging at full PCS power)
      expect(result.newState.socKWh).toBeGreaterThan(0);
    });

    it("should respect PCS max power regardless of grid headroom", () => {
      // Setup: Thursday 2026-02-05 00:00 TW
      const startTime = new Date("2026-02-04T16:00:00.000Z"); // TW 00:00
      const time01 = new Date("2026-02-04T17:00:00.000Z"); // TW 01:00

      const state = createPersistedState(startTime.getTime(), CONFIG, 0);
      state.chargeSessionActive = true;
      state.lastChargeSessionDateTW = "2026-02-05";

      const lowLoad = 10; // kW

      const result = stepBESSSimulation(state, time01, lowLoad, 1.0, CONFIG);

      // Charging at PCS max (100 kW)
      expect(result.battery.power).toBeGreaterThan(0);
      expect(result.battery.power / 1000).toBeLessThanOrEqual(
        PCS_MAX_POWER + 0.1,
      );
      // Grid must cover load + charging, bounded by contract + PCS
      expect(result.gridImportKW).toBeLessThanOrEqual(
        MAX_GRID_POWER + PCS_MAX_POWER + 0.1,
      );
    });
  });

  /**
   * Additional Assertions: SOC Boundaries and Continuity
   */
  describe("SOC Boundaries and Continuity", () => {
    it("should never allow SOC to go below 0 or above maxSOC", () => {
      // Test discharge beyond available capacity
      const testTime = new Date("2026-02-02T08:00:00.000Z");
      const state = createPersistedState(testTime.getTime(), CONFIG, 10); // Very low SOC
      const result = stepBESSSimulation(
        state,
        testTime, // Monday 16:00 TW (peak)
        200, // High load
        2.0, // 2 hours
        CONFIG,
      );

      const maxSOC = getMaxSOC(testTime.getTime(), CONFIG);
      expect(result.newState.socKWh).toBeGreaterThanOrEqual(0);
      expect(result.newState.socKWh).toBeLessThanOrEqual(maxSOC);
    });

    it("should maintain SOC continuity across steps", () => {
      let state = createPersistedState(
        new Date("2026-02-04T16:00:00.000Z").getTime(),
        CONFIG,
        100,
      );
      state.chargeSessionActive = true;
      state.lastChargeSessionDateTW = "2026-02-05";

      const times = [
        new Date("2026-02-04T16:15:00.000Z"),
        new Date("2026-02-04T16:30:00.000Z"),
        new Date("2026-02-04T16:45:00.000Z"),
      ];

      const socs = [state.socKWh];

      for (const time of times) {
        const result = stepBESSSimulation(state, time, 50, 0.25, CONFIG);
        socs.push(result.newState.socKWh);
        state = result.newState;
      }

      // SOC should be monotonically increasing (charging) or decreasing (discharging)
      // In this case, off-peak + session active = charging
      for (let i = 1; i < socs.length; i++) {
        expect(socs[i]).toBeGreaterThanOrEqual(socs[i - 1]!); // Monotonic increase
      }
    });
  });
});

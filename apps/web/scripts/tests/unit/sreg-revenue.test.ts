/**
 * sReg 電力輔助服務收益計算 - Unit Tests
 *
 * Revenue = MW × Price × Hours × UtilizationFactor
 *
 * ETai schedule:
 *   Monday:      1 MW × 7h
 *   Tue-Fri:     2 MW × 6h + 1 MW × 9h (per day)
 *   Saturday:    1 MW × 24h
 *   Sunday:      no revenue
 *   Holidays:    no revenue
 *
 * Price: 275 NT$/MW/hour, Utilization: 67%
 */

import { describe, it, expect } from "vitest";
import {
  calculateSRegRevenue,
  ETAI_SIMULATION_CONFIG,
  NEIHU_SIMULATION_CONFIG,
} from "@/config/site-configs";

const CONFIG = ETAI_SIMULATION_CONFIG;
const PRICE = 275;
const UF = 0.67;

// Pre-calculated daily revenues
const MONDAY_REVENUE = 1 * PRICE * 7 * UF; // 1,289.75
const TUE_FRI_REVENUE = (2 * PRICE * 6 + 1 * PRICE * 9) * UF; // 3,869.25
const SATURDAY_REVENUE = 1 * PRICE * 24 * UF; // 4,422
const WEEKLY_REVENUE =
  MONDAY_REVENUE + TUE_FRI_REVENUE * 4 + SATURDAY_REVENUE; // 21,188.75

const round2 = (n: number) => Math.round(n * 100) / 100;

describe("sReg Revenue Calculation", () => {
  describe("Daily revenue values", () => {
    it("Monday revenue = 1 × 275 × 7 × 0.67 = 1,289.75", () => {
      expect(round2(MONDAY_REVENUE)).toBe(1289.75);
    });

    it("Tue-Fri revenue per day = (2×275×6 + 1×275×9) × 0.67 = 3,869.25", () => {
      expect(round2(TUE_FRI_REVENUE)).toBe(3869.25);
    });

    it("Saturday revenue = 1 × 275 × 24 × 0.67 = 4,422", () => {
      expect(round2(SATURDAY_REVENUE)).toBe(4422);
    });

    it("Weekly revenue = 21,188.75", () => {
      expect(round2(WEEKLY_REVENUE)).toBe(21188.75);
    });
  });

  describe("Single day calculations", () => {
    // 2026-05-04 is a Monday
    it("single Monday = 1,289.75", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-05-04", "2026-05-04");
      expect(result).toBe(1289.75);
    });

    // 2026-05-05 is a Tuesday
    it("single Tuesday = 3,869.25", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-05-05", "2026-05-05");
      expect(result).toBe(3869.25);
    });

    // 2026-05-06 is a Wednesday
    it("single Wednesday = 3,869.25", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-05-06", "2026-05-06");
      expect(result).toBe(3869.25);
    });

    // 2026-05-09 is a Saturday
    it("single Saturday = 4,422", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-05-09", "2026-05-09");
      expect(result).toBe(4422);
    });

    // 2026-05-10 is a Sunday
    it("Sunday = 0 (no revenue)", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-05-10", "2026-05-10");
      expect(result).toBe(0);
    });
  });

  describe("Full week calculation", () => {
    // 2026-05-04 (Mon) to 2026-05-10 (Sun) = full week
    it("Mon-Sun week = 21,188.75", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-05-04", "2026-05-10");
      expect(result).toBe(round2(WEEKLY_REVENUE));
    });
  });

  describe("Monthly calculation (4 full weeks)", () => {
    // 2026-08-03 (Mon) to 2026-08-30 (Sun) = exactly 4 weeks, no holidays in Aug
    it("4 full weeks (no holidays) = 84,755", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-08-03", "2026-08-30");
      expect(result).toBe(round2(WEEKLY_REVENUE * 4));
    });
  });

  describe("Taiwan holiday uses Saturday logic", () => {
    // 2026-01-01 is New Year's Day (Thursday) — holiday → Saturday logic
    it("New Year's Day (Thu, holiday) = Saturday revenue", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-01-01", "2026-01-01");
      expect(result).toBe(round2(SATURDAY_REVENUE));
    });

    // 2026-01-01 (Thu, holiday→sat logic) + 2026-01-02 (Fri, normal)
    it("holiday Thu (sat logic) + normal Fri", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-01-01", "2026-01-02");
      expect(result).toBe(round2(SATURDAY_REVENUE + TUE_FRI_REVENUE));
    });

    // 2026-05-01 is Labor Day (Friday) — holiday → Saturday logic
    it("Labor Day (Fri, holiday) = Saturday revenue", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-05-01", "2026-05-01");
      expect(result).toBe(round2(SATURDAY_REVENUE));
    });
  });

  describe("Week with holiday", () => {
    // 2026-04-27 (Mon) to 2026-05-03 (Sun)
    // 2026-05-01 (Fri) is Labor Day — skip that day
    // Mon(4/27) + Tue(4/28) + Wed(4/29) + Thu(4/30) + Fri(5/1=holiday→sat) + Sat(5/2)
    // = 1289.75 + 3869.25*3 + 4422 + 4422 = 21,741.50
    it("week containing Labor Day: holiday uses Saturday logic", () => {
      const expected = round2(
        MONDAY_REVENUE + TUE_FRI_REVENUE * 3 + SATURDAY_REVENUE * 2,
      );
      const result = calculateSRegRevenue(CONFIG, "2026-04-27", "2026-05-03");
      expect(result).toBe(expected);
    });
  });

  describe("Neihu site (no sReg)", () => {
    it("returns 0 for site without SREG config", () => {
      const result = calculateSRegRevenue(
        NEIHU_SIMULATION_CONFIG,
        "2026-05-04",
        "2026-05-10",
      );
      expect(result).toBe(0);
    });
  });

  describe("Yearly estimate", () => {
    // 2026 full year
    it("2026 full year revenue is reasonable (~1M TWD)", () => {
      const result = calculateSRegRevenue(CONFIG, "2026-01-01", "2026-12-31");
      // ~52 weeks × 21,188.75 ≈ 1,101,815, minus holidays
      // Should be roughly around 1,000,000-1,100,000
      expect(result).toBeGreaterThan(900000);
      expect(result).toBeLessThan(1200000);
      console.log(`2026 yearly sReg revenue: $${result.toLocaleString()} TWD`);
    });
  });
});

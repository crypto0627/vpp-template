import { describe, it, expect, beforeAll } from "vitest";
import type { ReportData } from "@/types/report-type";
import { BASE_URL } from "../../utils/test-helpers";

describe("Report API - Complete Data Flow (2025-01-01 to 2025-12-01)", () => {
  let reportData: ReportData;

  beforeAll(async () => {
    const response = await fetch(
      `${BASE_URL}/api/neihu/report?start=2025-01-01&end=2025-12-01`,
    );
    expect(response.ok).toBe(true);
    reportData = await response.json();
  }, 60000); // Allow up to 60 seconds for API call

  it("should fetch report data for full date range", () => {
    expect(reportData).toBeDefined();
  });

  it("should return valid ReportData structure", () => {
    expect(reportData.summary).toBeDefined();
    expect(Array.isArray(reportData.dailyReport)).toBe(true);
  });

  describe("Daily Report Validation", () => {
    it("should have daily records for entire range", () => {
      // 2025-01-01 to 2025-12-01 is approximately 335 days
      expect(reportData.dailyReport.length).toBeGreaterThan(300);
      expect(reportData.dailyReport.length).toBeLessThanOrEqual(336);
    });

    it("should have valid DailyRecord structure for each day", () => {
      const record = reportData.dailyReport[0];
      if (!record) {
        throw new Error("No daily records found");
      }

      expect(record.date).toBeTypeOf("string");
      expect(record.peakKWh).toBeTypeOf("number");
      expect(record.offPeakKWh).toBeTypeOf("number");
      expect(record.hours).toBeTypeOf("number");
      expect(record.withoutBESS).toBeTypeOf("number");
      expect(record.withBESS).toBeTypeOf("number");
      expect(record.savings).toBeTypeOf("number");
    });

    it("should include charge/discharge data", () => {
      const record = reportData.dailyReport[0];
      if (!record) {
        throw new Error("No daily records found");
      }

      expect(record.chargedKWh).toBeTypeOf("number");
      expect(record.dischargedKWh).toBeTypeOf("number");
      expect(record.startSOC).toBeTypeOf("number");
      expect(record.endSOC).toBeTypeOf("number");

      expect(record.chargedKWh).toBeGreaterThanOrEqual(0);
      expect(record.dischargedKWh).toBeGreaterThanOrEqual(0);
      expect(record.startSOC).toBeGreaterThanOrEqual(0);
      expect(record.endSOC).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Summary Validation", () => {
    it("should calculate total peak and off-peak kWh", () => {
      const { summary } = reportData;

      expect(summary.totalPeakKWh).toBeTypeOf("number");
      expect(summary.totalOffPeakKWh).toBeTypeOf("number");
      expect(summary.totalKWh).toBeTypeOf("number");

      expect(summary.totalPeakKWh).toBeGreaterThan(0);
      expect(summary.totalOffPeakKWh).toBeGreaterThan(0);
      expect(summary.totalKWh).toBeCloseTo(
        summary.totalPeakKWh + summary.totalOffPeakKWh,
        1,
      );
    });

    it("should calculate cost with and without BESS", () => {
      const { summary } = reportData;

      expect(summary.costWithoutBESS).toBeTypeOf("number");
      expect(summary.costWithBESS).toBeTypeOf("number");
      expect(summary.savings).toBeTypeOf("number");

      expect(summary.costWithoutBESS).toBeGreaterThan(0);
      expect(summary.costWithBESS).toBeGreaterThan(0);
      expect(summary.savings).toBeCloseTo(
        summary.costWithoutBESS - summary.costWithBESS,
        1,
      );
    });

    it("should match daily report sum (precision test)", () => {
      const sumPeakKWh = reportData.dailyReport.reduce(
        (sum, d) => sum + d.peakKWh,
        0,
      );
      const sumOffPeakKWh = reportData.dailyReport.reduce(
        (sum, d) => sum + d.offPeakKWh,
        0,
      );
      const sumWithoutBESS = reportData.dailyReport.reduce(
        (sum, d) => sum + d.withoutBESS,
        0,
      );
      const sumWithBESS = reportData.dailyReport.reduce(
        (sum, d) => sum + d.withBESS,
        0,
      );
      const sumSavings = reportData.dailyReport.reduce(
        (sum, d) => sum + d.savings,
        0,
      );

      // Allow small precision differences (< 1.0)
      expect(
        Math.abs(sumPeakKWh - reportData.summary.totalPeakKWh),
      ).toBeLessThan(1.0);
      expect(
        Math.abs(sumOffPeakKWh - reportData.summary.totalOffPeakKWh),
      ).toBeLessThan(1.0);
      expect(
        Math.abs(sumWithoutBESS - reportData.summary.costWithoutBESS),
      ).toBeLessThan(1.0);
      expect(
        Math.abs(sumWithBESS - reportData.summary.costWithBESS),
      ).toBeLessThan(1.0);
      expect(Math.abs(sumSavings - reportData.summary.savings)).toBeLessThan(
        1.0,
      );
    });
  });

  describe("BESS Simulation Logic", () => {
    it("should simulate charging sessions at midnight", () => {
      // Check that some days have charging (chargedKWh > 0)
      const daysWithCharging = reportData.dailyReport.filter(
        (d) => d.chargedKWh > 0,
      );
      expect(daysWithCharging.length).toBeGreaterThan(0);
    });

    it("should simulate peak discharge behavior", () => {
      // Check that some days have discharge (dischargedKWh > 0)
      const daysWithDischarge = reportData.dailyReport.filter(
        (d) => d.dischargedKWh > 0,
      );
      expect(daysWithDischarge.length).toBeGreaterThan(0);
    });

    it("should maintain SOC continuity across days", () => {
      for (let i = 1; i < reportData.dailyReport.length; i++) {
        const prevDay = reportData.dailyReport[i - 1];
        const currDay = reportData.dailyReport[i];

        if (!prevDay || !currDay) {
          throw new Error(`Missing daily record at index ${i}`);
        }

        // endSOC of previous day should equal startSOC of current day
        // Allow small tolerance for floating point precision
        expect(prevDay.endSOC).toBeCloseTo(currDay.startSOC, 1);
      }
    });

    it("should respect SOC boundaries (0-370 kWh)", () => {
      const MAX_SOC = 370;

      for (const day of reportData.dailyReport) {
        expect(day.startSOC).toBeGreaterThanOrEqual(0);
        expect(day.startSOC).toBeLessThanOrEqual(MAX_SOC);
        expect(day.endSOC).toBeGreaterThanOrEqual(0);
        expect(day.endSOC).toBeLessThanOrEqual(MAX_SOC);
      }
    });

    it("should validate charge/discharge balance", () => {
      for (const day of reportData.dailyReport) {
        // endSOC = startSOC + chargedKWh - dischargedKWh
        const expectedEndSOC =
          day.startSOC + day.chargedKWh - day.dischargedKWh;
        expect(day.endSOC).toBeCloseTo(expectedEndSOC, 1);
      }
    });
  });

  describe("Date Range Coverage", () => {
    it("should have consecutive dates", () => {
      for (let i = 1; i < reportData.dailyReport.length; i++) {
        const prevDay = reportData.dailyReport[i - 1];
        const currDay = reportData.dailyReport[i];

        if (!prevDay || !currDay) {
          throw new Error(`Missing daily record at index ${i}`);
        }

        const prevDate = new Date(prevDay.date);
        const currDate = new Date(currDay.date);

        const daysDiff = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Should be consecutive days (difference of 1 day)
        expect(daysDiff).toBe(1);
      }
    });

    it("should start with 2025-01-01", () => {
      const firstRecord = reportData.dailyReport[0];
      if (!firstRecord) {
        throw new Error("No daily records found");
      }
      expect(firstRecord.date).toBe("2025-01-01");
    });

    it("should end with 2025-12-01 or earlier", () => {
      const lastRecord =
        reportData.dailyReport[reportData.dailyReport.length - 1];
      if (!lastRecord) {
        throw new Error("No daily records found");
      }
      const lastDate = lastRecord.date;
      expect(new Date(lastDate) <= new Date("2025-12-01")).toBe(true);
    });
  });
});

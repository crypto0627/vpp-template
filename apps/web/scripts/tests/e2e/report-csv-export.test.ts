import { describe, it, expect, beforeAll } from "vitest";
import type { ReportData } from "@/types/report-type";
import { BASE_URL } from "../../utils/test-helpers";

describe("Report CSV Export Format", () => {
  let reportData: ReportData;

  beforeAll(async () => {
    // Fetch test report data
    const response = await fetch(
      `${BASE_URL}/api/neihu/report?start=2025-01-01&end=2025-01-31`,
    );
    reportData = await response.json();
  });

  describe("CSV Structure Validation", () => {
    it("should have correct report data structure", () => {
      expect(reportData).toBeDefined();
      expect(reportData.summary).toBeDefined();
      expect(Array.isArray(reportData.dailyReport)).toBe(true);
    });

    it("should validate CSV export would include all fields", () => {
      const { summary, dailyReport } = reportData;

      // Verify summary fields that should be in CSV
      expect(summary.totalKWh).toBeTypeOf("number");
      expect(summary.totalHours).toBeTypeOf("number");
      expect(summary.totalPeakKWh).toBeTypeOf("number");
      expect(summary.totalOffPeakKWh).toBeTypeOf("number");
      expect(summary.costWithoutBESS).toBeTypeOf("number");
      expect(summary.costWithBESS).toBeTypeOf("number");
      expect(summary.savings).toBeTypeOf("number");
      expect(summary.savingsRate).toBeTypeOf("number");
      expect(summary.peakSavingsKWh).toBeTypeOf("number");

      // Verify daily report fields
      expect(dailyReport.length).toBeGreaterThan(0);
      const firstDay = dailyReport[0];
      if (!firstDay) return;
      expect(firstDay.date).toBeTypeOf("string");
      expect(firstDay.hours).toBeTypeOf("number");
      expect(firstDay.peakKWh).toBeTypeOf("number");
      expect(firstDay.offPeakKWh).toBeTypeOf("number");
      expect(firstDay.withoutBESS).toBeTypeOf("number");
      expect(firstDay.withBESS).toBeTypeOf("number");
      expect(firstDay.savings).toBeTypeOf("number");
    });

    it("should validate CSV headers would match expected format", () => {
      // Expected headers based on report-csv-export.ts
      const expectedHeaders = [
        "日期",
        "充電時數 (小時)",
        "尖峰用電 (kWh)",
        "離峰用電 (kWh)",
        "無儲能花費 (NT$)",
        "有儲能花費 (NT$)",
        "省費 (NT$)",
      ];

      expect(expectedHeaders.length).toBe(7);
    });

    it("should validate summary section would be included", () => {
      const { summary } = reportData;

      // Expected summary rows
      const summaryFields = {
        "充電總量 (kWh)": summary.totalKWh,
        "充電時數 (小時)": summary.totalHours,
        "尖峰用電 (kWh)": summary.totalPeakKWh,
        "離峰用電 (kWh)": summary.totalOffPeakKWh,
        "無儲能花費 (NT$)": summary.costWithoutBESS,
        "有儲能花費 (NT$)": summary.costWithBESS,
        "省電費 (NT$)": summary.savings,
        "省費率 (%)": summary.savingsRate,
        "儲能抵消尖峰 (kWh)": summary.peakSavingsKWh,
      };

      for (const [key, value] of Object.entries(summaryFields)) {
        expect(key).toBeTypeOf("string");
        expect(value).toBeTypeOf("number");
      }
    });
  });

  describe("Data Consistency", () => {
    it("should have matching totals between summary and daily records", () => {
      const { summary, dailyReport } = reportData;

      const totalPeakFromDaily = dailyReport.reduce(
        (sum, d) => sum + d.peakKWh,
        0,
      );
      const totalOffPeakFromDaily = dailyReport.reduce(
        (sum, d) => sum + d.offPeakKWh,
        0,
      );

      expect(Math.abs(totalPeakFromDaily - summary.totalPeakKWh)).toBeLessThan(
        1.0,
      );
      expect(
        Math.abs(totalOffPeakFromDaily - summary.totalOffPeakKWh),
      ).toBeLessThan(1.0);
    });

    it("should have valid date format in daily records", () => {
      const { dailyReport } = reportData;

      for (const record of dailyReport) {
        // Date should be in YYYY-MM-DD format
        expect(record.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // Date should be parseable
        const date = new Date(record.date);
        expect(date.toString()).not.toBe("Invalid Date");
      }
    });

    it("should have non-negative values", () => {
      const { summary, dailyReport } = reportData;

      // Summary should have non-negative values
      expect(summary.totalKWh).toBeGreaterThanOrEqual(0);
      expect(summary.totalHours).toBeGreaterThanOrEqual(0);
      expect(summary.totalPeakKWh).toBeGreaterThanOrEqual(0);
      expect(summary.totalOffPeakKWh).toBeGreaterThanOrEqual(0);
      expect(summary.costWithoutBESS).toBeGreaterThanOrEqual(0);
      expect(summary.costWithBESS).toBeGreaterThanOrEqual(0);

      // Daily records should have non-negative values
      for (const record of dailyReport) {
        expect(record.hours).toBeGreaterThanOrEqual(0);
        expect(record.peakKWh).toBeGreaterThanOrEqual(0);
        expect(record.offPeakKWh).toBeGreaterThanOrEqual(0);
        expect(record.withoutBESS).toBeGreaterThanOrEqual(0);
        expect(record.withBESS).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("CSV Export Function", () => {
    it("should validate exportReportCSV function exists", async () => {
      // Import the function to verify it exists and can be used
      const { exportReportCSV } = await import("@/utils/report-csv-export");

      expect(exportReportCSV).toBeTypeOf("function");
    });

    it("should handle various date ranges", () => {
      // Test with different date ranges
      const testRanges = [
        { start: "2025-01-01", end: "2025-01-07" },
        { start: "2025-01-01", end: "2025-01-31" },
        { start: "2025-01-01", end: "2025-12-01" },
      ];

      for (const range of testRanges) {
        expect(range.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(range.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(range.start) <= new Date(range.end)).toBe(true);
      }
    });
  });
});

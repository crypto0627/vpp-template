import { describe, it, expect, beforeAll } from "vitest";
import type { TelemetryData } from "@/types/data-type";

describe("Neihu Data Rendering", () => {
  let telemetryData: TelemetryData[];

  beforeAll(async () => {
    // Fetch real data from Neihu API
    const response = await fetch(
      "https://www.fortune-ess.com.tw/neihu/data?range=today",
    );
    const result = await response.json();
    telemetryData = result.data;
  });

  describe("Data Structure Validation", () => {
    it("should have telemetry data available", () => {
      expect(telemetryData).toBeDefined();
      expect(Array.isArray(telemetryData)).toBe(true);
      expect(telemetryData.length).toBeGreaterThan(0);
    });

    it("should have valid BESS data for charts", () => {
      const firstData = telemetryData[0];
      if (!firstData) return;

      const bess = firstData.BESS;
      expect(bess.SOC).toBeTypeOf("number");
      expect(bess.SOH).toBeTypeOf("number");
      expect(bess.Voltage).toBeTypeOf("number");
    });

    it("should have valid charging info for status grid", () => {
      const firstData = telemetryData[0];
      if (!firstData) return;

      const chargingInfo = firstData.ChargingInfo;
      expect(chargingInfo).toBeDefined();

      // Verify SuperCharging structure
      expect(chargingInfo.SuperCharging).toBeDefined();
      expect(chargingInfo.SuperCharging.數值).toBeTypeOf("number");
      expect(chargingInfo.SuperCharging.開關).toBeTypeOf("string");
    });
  });

  describe("Chart Data Mapping", () => {
    it("should map telemetry data to SOC chart format", () => {
      const chartData = telemetryData.map((d) => ({
        timestamp: new Date(d.createAt).getTime(),
        soc: d.BESS.SOC,
      }));

      expect(chartData.length).toBeGreaterThan(0);
      const firstPoint = chartData[0];
      if (!firstPoint) return;
      expect(firstPoint.soc).toBeTypeOf("number");
      expect(firstPoint.timestamp).toBeTypeOf("number");
    });

    it("should map telemetry data to power chart format", () => {
      const chartData = telemetryData.map((d) => ({
        timestamp: new Date(d.createAt).getTime(),
        voltage: d.BESS.Voltage,
      }));

      expect(chartData.length).toBeGreaterThan(0);
      const firstPoint = chartData[0];
      if (!firstPoint) return;
      expect(firstPoint.voltage).toBeTypeOf("number");
    });

    it("should handle empty data gracefully", () => {
      const emptyData: TelemetryData[] = [];
      const chartData = emptyData.map((d) => ({
        timestamp: new Date(d.createAt).getTime(),
        soc: d.BESS.SOC,
      }));

      expect(chartData.length).toBe(0);
    });
  });

  describe("Component Data Flow", () => {
    it("should validate data transformations for battery SOC chart", () => {
      // Verify data can be transformed for BatterySOCChart component
      const socData = telemetryData
        .map((d) => ({
          time: d.createAt,
          soc: d.BESS.SOC,
        }))
        .filter((d) => d.soc >= 0 && d.soc <= 100);

      expect(socData.length).toBeGreaterThan(0);
      expect(socData.every((d) => d.soc >= 0 && d.soc <= 100)).toBe(true);
    });

    it("should validate data transformations for energy flow diagram", () => {
      // Verify current state can be extracted for EnergyFlowDiagram
      const latestData = telemetryData[telemetryData.length - 1];
      if (!latestData) return;

      const flowData = {
        gridPower: latestData.TotalUsage,
        solarPower: 0, // Not available in current data
        batteryVoltage: latestData.BESS.Voltage,
        loadPower: latestData.TotalUsage,
      };

      expect(flowData.gridPower).toBeTypeOf("number");
      expect(flowData.batteryVoltage).toBeTypeOf("number");
      expect(flowData.loadPower).toBeTypeOf("number");
    });

    it("should validate data transformations for charger status grid", () => {
      // Verify charging info can be mapped to grid format
      const latestData = telemetryData[telemetryData.length - 1];
      if (!latestData) return;

      const { SuperCharging, DC } = latestData.ChargingInfo;

      expect(SuperCharging).toBeDefined();
      expect(SuperCharging.數值).toBeTypeOf("number");
      expect(SuperCharging.開關).toBeTypeOf("string");

      expect(DC).toBeDefined();
      expect(DC.數值).toBeTypeOf("number");
      expect(DC.開關).toBeTypeOf("string");
    });
  });
});

import { describe, it, expect } from "vitest";
import type { TelemetryData } from "@/types/data-type";

const NEIHU_API_URL = "https://www.fortune-ess.com.tw/neihu/data";

describe("Neihu Data Fetch", () => {
  it("should fetch real-time data from external API", async () => {
    const response = await fetch(`${NEIHU_API_URL}?range=today`);
    expect(response.ok).toBe(true);

    const result = await response.json();
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should return valid TelemetryData array", async () => {
    const response = await fetch(`${NEIHU_API_URL}?range=today`);
    const result = await response.json();

    expect(result.data.length).toBeGreaterThan(0);

    const telemetry: TelemetryData = result.data[0];
    expect(telemetry).toBeDefined();
    expect(telemetry.createAt).toBeDefined();
  });

  it("should include all required BESS fields", async () => {
    const response = await fetch(`${NEIHU_API_URL}?range=today`);
    const result = await response.json();
    const telemetry: TelemetryData = result.data[0];

    expect(telemetry.BESS).toBeDefined();
    expect(telemetry.BESS.SOC).toBeTypeOf("number");
    expect(telemetry.BESS.SOH).toBeTypeOf("number");
    expect(telemetry.BESS.Voltage).toBeTypeOf("number");
  });

  it("should include ChargingInfo data", async () => {
    const response = await fetch(`${NEIHU_API_URL}?range=today`);
    const result = await response.json();
    const telemetry: TelemetryData = result.data[0];

    expect(telemetry.ChargingInfo).toBeDefined();
    expect(telemetry.ChargingInfo.SuperCharging).toBeDefined();
    expect(telemetry.ChargingInfo.DC).toBeDefined();
    expect(telemetry.ChargingInfo.AC1).toBeDefined();
  });

  it("should handle API timeout gracefully", async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100);

      await fetch(`${NEIHU_API_URL}?range=today`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).name).toBe("AbortError");
    }
  }, 10000);

  it("should handle network errors", async () => {
    try {
      // Try to fetch from invalid URL
      await fetch("https://invalid-domain-that-does-not-exist.com/data");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

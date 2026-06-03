interface APIChargingStation {
  開關: string;
  數值: number;
  上限?: number;
}

interface APIData {
  _id: string;
  siteId: string;
  BESS: { SOH: number; Voltage: number };
  TotalUsage: number;
  ChargingInfo: {
    TotalCharging: number;
    SuperCharging: APIChargingStation;
    DC: APIChargingStation;
    AC1: APIChargingStation; AC2: APIChargingStation; AC3: APIChargingStation;
    AC4: APIChargingStation; AC5: APIChargingStation; AC6: APIChargingStation;
    AC7: APIChargingStation; AC8: APIChargingStation; AC9: APIChargingStation;
    AC10: APIChargingStation; AC11: APIChargingStation; AC12: APIChargingStation;
    AC13: APIChargingStation; AC14: APIChargingStation; AC15: APIChargingStation;
  };
  createAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getSiteDataContext(_siteId = "neihu"): Promise<string> {
  try {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003/data";
    const response = await fetch(`${apiBaseUrl}?range=today`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return `API Error: ${response.status}`;

    const result = await response.json();
    const data: APIData[] = result.data || [];

    if (data.length === 0) return "No real-time data available at the moment.";

    const latest = data[data.length - 1];
    if (!latest) return "No real-time data available at the moment.";

    return formatAPIDataContext(latest);
  } catch (error) {
    return `Data fetch error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

function formatAPIDataContext(data: APIData): string {
  const acKeys = ["AC1","AC2","AC3","AC4","AC5","AC6","AC7","AC8","AC9","AC10","AC11","AC12","AC13","AC14","AC15"] as const;
  const acStations = acKeys.map((id) => ({ id, ...data.ChargingInfo[id] }));
  const activeAC = acStations.filter((s) => s.數值 > 0);
  const totalACPower = acStations.reduce((sum, s) => sum + s.數值, 0);

  return `
Current System Status (${new Date(data.createAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}):

BESS (Battery Energy Storage System):
- State of Health (SOH): ${data.BESS.SOH}%
- Voltage: ${data.BESS.Voltage} V

Charging Stations:
- Super Charger: ${data.ChargingInfo.SuperCharging.開關 === "開" ? `ON - ${(data.ChargingInfo.SuperCharging.數值 / 1000).toFixed(1)} kW` : "OFF"}
- DC Charger: ${data.ChargingInfo.DC.開關 === "開" ? `ON - ${(data.ChargingInfo.DC.數值 / 1000).toFixed(1)} kW` : "OFF"}
- AC Chargers: ${activeAC.length}/15 active, Total: ${(totalACPower / 1000).toFixed(1)} kW
${activeAC.length > 0 ? activeAC.map((s) => `  - ${s.id}: ${(s.數值 / 1000).toFixed(1)} kW`).join("\n") : "  - No AC chargers active"}

Total Energy Usage: ${(data.TotalUsage / 1000).toFixed(1)} kWh
Total Charging Power: ${(data.ChargingInfo.TotalCharging / 1000).toFixed(1)} kW
  `.trim();
}

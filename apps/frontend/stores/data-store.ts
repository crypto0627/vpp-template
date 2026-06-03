import { create } from "zustand";
import { TelemetryData, SiteDataState, SiteId, SummaryData, SiteType } from "@/types/data-type";
import { simulateBESSForRealData, calculateElectricityCost, createPersistedState } from "@/utils/bess-unified";
import type { PersistedBESSState } from "@/types/bess-type";
import { FEATURE_FLAGS } from "@/utils/feature-flags";
import { getSiteConfig } from "@/config/site-configs";

const BESS_STATE_STORAGE_KEY = "vpp-bess-state";

function loadBESSState(siteId: SiteId): PersistedBESSState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`${BESS_STATE_STORAGE_KEY}-${siteId}`);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function saveBESSState(siteId: SiteId, state: PersistedBESSState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${BESS_STATE_STORAGE_KEY}-${siteId}`, JSON.stringify(state));
  } catch { /* ignore */ }
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0 && error instanceof Error && (error.name === "AbortError" || error.message.includes("fetch") || error.message.includes("network"))) {
      await new Promise((r) => setTimeout(r, Math.pow(2, 3 - retries) * 1000));
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    throw error;
  }
}

const SITE_TYPES: Record<SiteId, SiteType> = { neihu: "charging", etai: "storage" };

const mockEtaiSummary: SummaryData = {
  electricityUsage: { value: 0, unit: "kWh" },
  costs: { value: 0, unit: "NT$" },
  solarPower: { value: 0, unit: "kW" },
  energyStorage: { value: 0, unit: "kWh", status: "idle" },
  chargingPiles: { active: 0, total: 0, usage: 0 },
};

export const useSiteDataStore = create<SiteDataState>((set, get) => ({
  currentSite: "neihu",
  currentSiteType: SITE_TYPES["neihu"],
  data: { neihu: [], etai: [] },
  summaryData: {
    neihu: {
      electricityUsage: { value: 0, unit: "kWh" },
      costs: { value: 0, unit: "NT$" },
      solarPower: { value: 0, unit: "kW" },
      energyStorage: { value: 0, unit: "%", status: "idle" },
      chargingPiles: { active: 0, total: 0, usage: 0 },
      savings: { value: 0, unit: "NT$", costWithoutBESS: 0, costWithBESS: 0, peakDischargeKWh: 0, offPeakChargeKWh: 0 },
    },
    etai: mockEtaiSummary,
  },
  bessState: { neihu: loadBESSState("neihu"), etai: loadBESSState("etai") },
  error: { neihu: null, etai: null },
  isLoading: false,
  lastUpdated: null,

  setCurrentSite: (siteId: SiteId) => {
    set({ currentSite: siteId, currentSiteType: SITE_TYPES[siteId] });
    get().fetchData(siteId);
  },

  fetchData: async (siteId: SiteId) => {
    try {
      set({ isLoading: true });

      if (siteId === "etai") {
        set((state) => ({
          data: { ...state.data, etai: [] },
          summaryData: { ...state.summaryData, etai: mockEtaiSummary },
          isLoading: false,
          lastUpdated: new Date(),
        }));
        return;
      }

      const res = await fetchWithRetry(`/api/neihu/data?range=today`, { headers: { Accept: "application/json" }, cache: "no-store" }, 3, 10000);
      if (!res.ok) throw new Error(`API returned ${res.status}`);

      const json = await res.json();
      if (json.data && json.data.length > 0) {
        let data: TelemetryData[] = json.data;
        let finalBESSState: PersistedBESSState | null = null;

        if (FEATURE_FLAGS.USE_NEIHU_SIMULATION && data.length > 0) {
          const firstRecord = data[0]!;
          const today = new Date(firstRecord.createAt);
          const todayMidnight = new Date(today);
          todayMidnight.setHours(0, 0, 0, 0);
          const siteConfig = getSiteConfig(siteId);
          const initialState = createPersistedState(todayMidnight.getTime(), siteConfig, 0);
          const result = simulateBESSForRealData(data, siteConfig, initialState);
          data = result.updatedData;
          finalBESSState = result.finalState;
          saveBESSState(siteId, finalBESSState);
        }

        const latestData = data[data.length - 1]!;
        const siteConfig = getSiteConfig(siteId);
        const costResult = calculateElectricityCost(data, siteConfig);
        const totalElectricityUsageKWh = costResult.peakUsageKWh + costResult.offPeakUsageKWh;
        const electricityUsageWithBESS = costResult.peakUsageKWh - costResult.peakDischargeKWh + (costResult.offPeakUsageKWh + costResult.offPeakChargeKWh);

        const calculatedSummary: SummaryData = {
          electricityUsage: {
            value: Math.round(totalElectricityUsageKWh * 100) / 100,
            unit: "kWh",
            withBESS: Math.round(electricityUsageWithBESS * 100) / 100,
          },
          costs: { value: costResult.totalCost, unit: "NT$" },
          solarPower: { value: 0, unit: "kW" },
          energyStorage: {
            value: Math.round((latestData.BESS?.SOC || 0) * 100) / 100,
            unit: "%",
            status: "idle",
          },
          chargingPiles: {
            active: Object.keys(latestData.ChargingInfo || {}).filter(
              (key) => key.startsWith("AC") && latestData.ChargingInfo[key] && typeof latestData.ChargingInfo[key] === "object" && (latestData.ChargingInfo[key] as { 數值: number }).數值 > 0,
            ).length,
            total: Object.keys(latestData.ChargingInfo || {}).filter((key) => key.startsWith("AC")).length || 15,
            usage: 0,
          },
          savings: {
            value: costResult.savings,
            unit: "NT$",
            costWithoutBESS: costResult.costWithoutBESS,
            costWithBESS: costResult.costWithBESS,
            peakDischargeKWh: costResult.peakDischargeKWh,
            offPeakChargeKWh: costResult.offPeakChargeKWh,
          },
        };
        calculatedSummary.chargingPiles.usage = calculatedSummary.chargingPiles.total > 0
          ? Math.round((calculatedSummary.chargingPiles.active / calculatedSummary.chargingPiles.total) * 100 * 100) / 100 : 0;

        set((state) => ({
          data: { ...state.data, [siteId]: data },
          summaryData: { ...state.summaryData, [siteId]: calculatedSummary },
          bessState: { ...state.bessState, [siteId]: finalBESSState },
          error: { ...state.error, [siteId]: null },
          isLoading: false,
          lastUpdated: new Date(),
        }));
      } else {
        set((state) => ({
          data: { ...state.data, [siteId]: [] },
          summaryData: { ...state.summaryData, [siteId]: { electricityUsage: { value: 0, unit: "kWh" }, costs: { value: 0, unit: "NT$" }, solarPower: { value: 0, unit: "kW" }, energyStorage: { value: 0, unit: "%", status: "idle" }, chargingPiles: { active: 0, total: 0, usage: 0 } } },
          isLoading: false,
          lastUpdated: new Date(),
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      let userMessage = "無法載入數據";
      if (err instanceof Error && err.name === "AbortError") userMessage = "請求超時，請稍後再試";
      else if (errorMessage.includes("fetch") || errorMessage.includes("network")) userMessage = "網路連線失敗";

      set((currentState) => ({
        error: { ...currentState.error, [siteId]: userMessage },
        isLoading: false,
      }));
    }
  },

  appendData: (siteId: SiteId, item: TelemetryData) => {
    set((state) => ({ data: { ...state.data, [siteId]: [...state.data[siteId], item] }, lastUpdated: new Date() }));
  },

  calculatePeriodSavings: async (period: "month" | "year") => {
    const { calculatePeriodSavings } = await import("@/utils/period-savings");
    return calculatePeriodSavings(period);
  },
}));

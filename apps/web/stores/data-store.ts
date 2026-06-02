/**
 * Multi-site data store (Template Version — static mock data)
 *
 * All data is served from constants/mock-data.ts.
 * No API calls, no polling intervals, no BESS simulation at load time.
 *
 * To connect a real backend:
 *  1. Restore fetchData with your API URL
 *  2. Add a useEffect in each page to call fetchData on mount
 */
import { create, type StateCreator } from "zustand";
import type {
  TelemetryData,
  SiteDataState,
  SiteId,
  SummaryData,
  SiteType,
  PeriodSavings,
} from "../types/data-type";
import {
  MOCK_TELEMETRY,
  MOCK_SUMMARY_NEIHU,
  MOCK_SUMMARY_ETAI,
  MOCK_MONTHLY_SAVINGS,
  MOCK_YEARLY_SAVINGS,
} from "@/constants/mock-data";

const SITE_TYPES: Record<SiteId, SiteType> = {
  neihu: "charging",
  etai: "storage",
};

const INITIAL_SUMMARY: Record<SiteId, SummaryData> = {
  neihu: MOCK_SUMMARY_NEIHU,
  etai: MOCK_SUMMARY_ETAI,
};

const INITIAL_DATA: Record<SiteId, TelemetryData[]> = {
  neihu: MOCK_TELEMETRY,
  etai: [],
};

const storeCreator: StateCreator<SiteDataState> = (set) => ({
  currentSite: "neihu",
  currentSiteType: SITE_TYPES["neihu"],
  data: INITIAL_DATA,
  summaryData: INITIAL_SUMMARY,
  bessState: { neihu: null, etai: null },
  isLoading: false,
  error: { neihu: null, etai: null },
  lastUpdated: new Date(),

  setCurrentSite: (siteId: SiteId) => {
    set({
      currentSite: siteId,
      currentSiteType: SITE_TYPES[siteId],
    });
  },

  // No-op in template — data is static
  fetchData: async () => {
    // Replace with a real fetch when connecting to a live backend
  },

  appendData: (siteId: SiteId, item: TelemetryData) => {
    set((state: SiteDataState) => ({
      data: { ...state.data, [siteId]: [...state.data[siteId], item] },
      lastUpdated: new Date(),
    }));
  },

  calculatePeriodSavings: async (period: "month" | "year"): Promise<PeriodSavings> => {
    return period === "month" ? MOCK_MONTHLY_SAVINGS : MOCK_YEARLY_SAVINGS;
  },
});

export const useSiteDataStore = create<SiteDataState>(storeCreator);

import { create } from "zustand";
import type { SiteId } from "@/types/data-type";
import type { ControllerSiteState, ControlOperation } from "@/types/controller-types";
import {
  createInitialControllerState,
  applyRandomVariation,
} from "@/utils/mock-controller-data";

interface ControllerStore {
  selectedSite: SiteId | null;
  siteStates: Record<SiteId, ControllerSiteState>;
  isPending: boolean;
  pendingOperation: ControlOperation | null;

  setSelectedSite: (id: SiteId) => void;
  performOperation: (
    siteId: SiteId,
    op: ControlOperation,
  ) => Promise<{ success: boolean; message: string }>;
  tickVariation: () => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const OPERATION_LABELS: Record<ControlOperation, string> = {
  STARTUP: "系統啟動",
  SHUTDOWN: "停機作業",
  EMERGENCY_STOP: "緊急停機",
  CLEAR_ERRORS: "消除錯誤碼",
  SET_MANUAL: "切換手動模式",
  SET_AUTO: "恢復自動模式",
  FAULT_ISOLATE: "故障隔離",
};

export const useControllerStore = create<ControllerStore>((set, get) => ({
  selectedSite: null,
  siteStates: createInitialControllerState(),
  isPending: false,
  pendingOperation: null,

  setSelectedSite: (id) => set({ selectedSite: id }),

  performOperation: async (siteId, op) => {
    set({ isPending: true, pendingOperation: op });
    await sleep(2000);

    const state = get().siteStates[siteId];
    let updated: Partial<ControllerSiteState> = {};

    switch (op) {
      case "STARTUP":
        updated = { systemStatus: "NORMAL", pcsStatus: "RUNNING" };
        break;
      case "SHUTDOWN":
        updated = { systemStatus: "OFFLINE", pcsStatus: "OFFLINE" };
        break;
      case "EMERGENCY_STOP":
        updated = { systemStatus: "FAULT", operationMode: "EMERGENCY_STOP" };
        break;
      case "CLEAR_ERRORS":
        updated = { errorCodes: [] };
        break;
      case "SET_MANUAL":
        updated = { operationMode: "MANUAL" };
        break;
      case "SET_AUTO":
        updated = { operationMode: "AUTO" };
        break;
      case "FAULT_ISOLATE":
        updated = { systemStatus: "WARNING" };
        break;
    }

    const message = `${OPERATION_LABELS[op]} 執行成功`;
    const newSiteState: ControllerSiteState = {
      ...state,
      ...updated,
      lastOperation: {
        operation: op,
        timestamp: new Date(),
        result: "SUCCESS",
        message,
      },
    };

    set((s) => ({
      isPending: false,
      pendingOperation: null,
      siteStates: { ...s.siteStates, [siteId]: newSiteState },
    }));

    return { success: true, message };
  },

  tickVariation: () => {
    if (get().isPending) return;
    set((s) => ({
      siteStates: {
        neihu: applyRandomVariation(s.siteStates.neihu),
        etai: applyRandomVariation(s.siteStates.etai),
      },
    }));
  },
}));

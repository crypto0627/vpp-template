"use client";

import { useState } from "react";
import { Power, PowerOff, Eraser, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationConfirmModal } from "./operation-confirm-modal";
import { useControllerStore } from "@/stores/controller-store";
import type { SiteId } from "@/types/data-type";
import type { ControlOperation } from "@/types/controller-types";

interface PendingOp {
  op: ControlOperation;
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "warning" | "info";
}

interface ControlPanelProps {
  siteId: SiteId;
}

export function ControlPanel({ siteId }: ControlPanelProps) {
  const { siteStates, isPending, pendingOperation, performOperation } = useControllerStore();
  const siteState = siteStates[siteId];
  const [pendingOp, setPendingOp] = useState<PendingOp | null>(null);

  const isOffline = siteState.systemStatus === "OFFLINE";
  const isManual = siteState.operationMode === "MANUAL";
  const hasErrors = siteState.errorCodes.length > 0;

  const request = (op: PendingOp) => setPendingOp(op);

  const handleConfirm = async () => {
    if (!pendingOp) return;
    setPendingOp(null);
    await performOperation(siteId, pendingOp.op);
  };

  const isOpPending = (op: ControlOperation) => isPending && pendingOperation === op;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white/60 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal size={14} />
            系統控制
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-2">
            {/* Startup */}
            <ControlButton
              icon={<Power size={15} />}
              label="系統啟動"
              disabled={!isOffline || isPending}
              loading={isOpPending("STARTUP")}
              onClick={() =>
                request({
                  op: "STARTUP",
                  title: "確認系統啟動",
                  message: "即將啟動儲能系統，PCS 將切換至運行狀態。請確認現場安全後繼續。",
                  confirmLabel: "確認啟動",
                  variant: "info",
                })
              }
              colorClass="text-[#7D9B7E]"
            />

            {/* Shutdown */}
            <ControlButton
              icon={<PowerOff size={15} />}
              label="停機作業"
              disabled={isOffline || isPending}
              loading={isOpPending("SHUTDOWN")}
              onClick={() =>
                request({
                  op: "SHUTDOWN",
                  title: "確認停機作業",
                  message: "系統將執行正常停機程序，PCS 將停止運行。此操作不可立即復原，請確認。",
                  confirmLabel: "確認停機",
                  variant: "warning",
                })
              }
              colorClass="text-[#E8883E]"
            />

            {/* Clear errors */}
            <ControlButton
              icon={<Eraser size={15} />}
              label="消除錯誤碼"
              disabled={!hasErrors || isPending}
              loading={isOpPending("CLEAR_ERRORS")}
              onClick={() =>
                request({
                  op: "CLEAR_ERRORS",
                  title: "確認消除錯誤碼",
                  message: `目前共有 ${siteState.errorCodes.length} 筆錯誤碼。消除後紀錄將清除，請確認問題已排除後再執行。`,
                  confirmLabel: "確認消除",
                  variant: "warning",
                })
              }
              colorClass="text-white/70"
            />

            {/* Manual / Auto toggle */}
            <div className="border-t border-[#3A2415] pt-2 mt-1">
              {isManual ? (
                <ControlButton
                  icon={<SlidersHorizontal size={15} />}
                  label="恢復自動模式"
                  disabled={isPending}
                  loading={isOpPending("SET_AUTO")}
                  onClick={() =>
                    request({
                      op: "SET_AUTO",
                      title: "確認恢復自動模式",
                      message: "系統將切換回自動控制模式，BESS 排程將自動執行。",
                      confirmLabel: "確認切換",
                      variant: "info",
                    })
                  }
                  colorClass="text-[#4A9EDB]"
                />
              ) : (
                <ControlButton
                  icon={<SlidersHorizontal size={15} />}
                  label="切換手動模式"
                  disabled={isPending}
                  loading={isOpPending("SET_MANUAL")}
                  onClick={() =>
                    request({
                      op: "SET_MANUAL",
                      title: "確認切換手動模式",
                      message: "切換至手動模式後，自動排程將暫停，所有操作須由維運人員手動執行。",
                      confirmLabel: "確認切換",
                      variant: "warning",
                    })
                  }
                  colorClass="text-[#BEA98F]"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <OperationConfirmModal
        isOpen={pendingOp !== null}
        title={pendingOp?.title ?? ""}
        message={pendingOp?.message ?? ""}
        confirmLabel={pendingOp?.confirmLabel ?? "確認"}
        variant={pendingOp?.variant ?? "info"}
        onConfirm={handleConfirm}
        onCancel={() => setPendingOp(null)}
      />
    </>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  colorClass: string;
}

function ControlButton({ icon, label, disabled, loading, onClick, colorClass }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#3A2415] bg-[#1E1208] text-sm font-medium transition-all
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-[#E8883E]/30 hover:bg-[#2A1A0F] cursor-pointer"}`}
    >
      <span className={disabled ? "text-white/30" : colorClass}>
        {loading ? <Spinner /> : icon}
      </span>
      <span className={disabled ? "text-white/30" : "text-white/80"}>{label}</span>
      {loading && <span className="ml-auto text-xs text-white/40">執行中...</span>}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

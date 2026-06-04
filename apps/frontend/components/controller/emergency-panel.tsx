"use client";

import { useState } from "react";
import { ShieldAlert, ShieldOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationConfirmModal } from "./operation-confirm-modal";
import { useControllerStore } from "@/stores/controller-store";
import type { SiteId } from "@/types/data-type";

interface EmergencyPanelProps {
  siteId: SiteId;
}

export function EmergencyPanel({ siteId }: EmergencyPanelProps) {
  const { siteStates, isPending, pendingOperation, performOperation } = useControllerStore();
  const siteState = siteStates[siteId];

  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [showFaultIsolateConfirm, setShowFaultIsolateConfirm] = useState(false);

  const isEmergencyStop = siteState.operationMode === "EMERGENCY_STOP";
  const isFault = siteState.systemStatus === "FAULT";

  const handleEmergencyConfirm = async () => {
    setShowEmergencyConfirm(false);
    await performOperation(siteId, "EMERGENCY_STOP");
  };

  const handleFaultIsolateConfirm = async () => {
    setShowFaultIsolateConfirm(false);
    await performOperation(siteId, "FAULT_ISOLATE");
  };

  const isEmergencyPending = isPending && pendingOperation === "EMERGENCY_STOP";
  const isFaultIsolatePending = isPending && pendingOperation === "FAULT_ISOLATE";

  return (
    <>
      <Card className="border-[#E05454]/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[#E05454]/80 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={14} />
            緊急操作
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/30 leading-relaxed">
              以下操作具有高風險，執行前請確認現場安全狀況並通知相關人員。
            </p>

            {/* Emergency Stop */}
            <button
              onClick={() => setShowEmergencyConfirm(true)}
              disabled={isEmergencyStop || isPending}
              className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all
                ${isEmergencyStop || isPending
                  ? "opacity-40 cursor-not-allowed border-[#3A2415] bg-[#1E1208] text-white/30"
                  : "border-[#E05454]/50 bg-[#E05454]/10 text-[#E05454] hover:bg-[#E05454]/20 hover:border-[#E05454]/70 cursor-pointer"
                }`}
            >
              <span>{isEmergencyPending ? <Spinner className="text-[#E05454]" /> : <ShieldAlert size={16} />}</span>
              <span>緊急停機（E-Stop）</span>
              {isEmergencyStop && (
                <span className="ml-auto text-[11px] text-white/30">已觸發</span>
              )}
              {isEmergencyPending && (
                <span className="ml-auto text-xs text-[#E05454]/60">執行中...</span>
              )}
            </button>

            {/* Fault Isolate */}
            <button
              onClick={() => setShowFaultIsolateConfirm(true)}
              disabled={!isFault || isPending}
              className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-sm font-medium transition-all
                ${!isFault || isPending
                  ? "opacity-40 cursor-not-allowed border-[#3A2415] bg-[#1E1208] text-white/30"
                  : "border-[#E8883E]/40 bg-[#E8883E]/10 text-[#E8883E] hover:bg-[#E8883E]/20 hover:border-[#E8883E]/60 cursor-pointer"
                }`}
            >
              <span>{isFaultIsolatePending ? <Spinner className="text-[#E8883E]" /> : <ShieldOff size={16} />}</span>
              <span>故障隔離</span>
              {!isFault && (
                <span className="ml-auto text-[11px] text-white/30">無故障</span>
              )}
              {isFaultIsolatePending && (
                <span className="ml-auto text-xs text-[#E8883E]/60">執行中...</span>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Stop — 2-step: first confirm, then countdown */}
      <OperationConfirmModal
        isOpen={showEmergencyConfirm}
        title="⚠ 緊急停機確認"
        message="此操作將立即強制停止所有 PCS 與 BMS 操作。請確認現場已完成安全確認，且已通知相關人員。確認後將進入 3 秒倒數計時。"
        confirmLabel="我已確認，進入倒數"
        variant="danger"
        countdownSeconds={3}
        onConfirm={handleEmergencyConfirm}
        onCancel={() => setShowEmergencyConfirm(false)}
      />

      {/* Fault Isolate — single confirm */}
      <OperationConfirmModal
        isOpen={showFaultIsolateConfirm}
        title="確認故障隔離"
        message="系統將隔離目前故障模組，使其他健康模組恢復運行。隔離後請儘速安排維修人員處理故障點。"
        confirmLabel="確認隔離"
        variant="warning"
        onConfirm={handleFaultIsolateConfirm}
        onCancel={() => setShowFaultIsolateConfirm(false)}
      />
    </>
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

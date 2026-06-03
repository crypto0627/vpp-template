"use client";

import { useEffect, useRef, useState } from "react";

interface OperationConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  countdownSeconds?: number;
}

const VARIANT_STYLES = {
  danger: {
    border: "border-[#E05454]/40",
    title: "text-[#E05454]",
    button: "bg-[#E05454] hover:bg-[#c43e3e] text-white",
  },
  warning: {
    border: "border-[#E8883E]/40",
    title: "text-[#E8883E]",
    button: "bg-[#E8883E] hover:bg-[#d4762e] text-white",
  },
  info: {
    border: "border-[#4A9EDB]/40",
    title: "text-[#4A9EDB]",
    button: "bg-[#4A9EDB] hover:bg-[#3a8ec8] text-white",
  },
};

export function OperationConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  variant,
  onConfirm,
  onCancel,
  countdownSeconds,
}: OperationConfirmModalProps) {
  const styles = VARIANT_STYLES[variant];
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (countdownSeconds == null) {
      onConfirm();
      return;
    }
    setCountdown(countdownSeconds);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalRef.current!);
          onConfirm();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCountdown(null);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
      <div
        className={`relative z-10 w-full max-w-md mx-4 bg-[#2A1A0F] border ${styles.border} rounded-2xl p-6 shadow-2xl`}
      >
        <h3 className={`text-lg font-bold mb-2 ${styles.title}`}>{title}</h3>
        <p className="text-white/70 text-sm mb-6">{message}</p>

        {countdown !== null ? (
          <div className="flex flex-col items-center gap-4">
            <div className={`text-6xl font-bold tabular-nums ${styles.title}`}>{countdown}</div>
            <p className="text-white/50 text-sm">秒後自動執行，點擊取消可中止</p>
            <button
              onClick={handleCancel}
              className="w-full py-2.5 rounded-xl border border-[#3A2415] text-white/70 hover:text-white hover:bg-[#3A2415] transition-colors text-sm font-medium"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-xl border border-[#3A2415] text-white/70 hover:text-white hover:bg-[#3A2415] transition-colors text-sm font-medium"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${styles.button}`}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

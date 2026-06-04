"use client";

import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useControllerStore } from "@/stores/controller-store";
import type { SiteId } from "@/types/data-type";
import type { ErrorCode } from "@/types/controller-types";

const SEVERITY_STYLES: Record<
  ErrorCode["severity"],
  { icon: React.ReactNode; badge: string; text: string; label: string }
> = {
  FAULT: {
    icon: <AlertCircle size={14} />,
    badge: "bg-[#E05454]/20 text-[#E05454] border-[#E05454]/30",
    text: "text-[#E05454]",
    label: "故障",
  },
  WARNING: {
    icon: <AlertTriangle size={14} />,
    badge: "bg-[#E8883E]/20 text-[#E8883E] border-[#E8883E]/30",
    text: "text-[#E8883E]",
    label: "警告",
  },
  INFO: {
    icon: <Info size={14} />,
    badge: "bg-[#4A9EDB]/20 text-[#4A9EDB] border-[#4A9EDB]/30",
    text: "text-[#4A9EDB]",
    label: "資訊",
  },
};

function formatRelativeTime(ts: Date): string {
  const diff = Math.floor((Date.now() - ts.getTime()) / 60000);
  if (diff < 1) return "剛才";
  if (diff < 60) return `${diff} 分鐘前`;
  const hours = Math.floor(diff / 60);
  return `${hours} 小時前`;
}

interface ErrorCodePanelProps {
  siteId: SiteId;
}

export function ErrorCodePanel({ siteId }: ErrorCodePanelProps) {
  const errorCodes = useControllerStore((s) => s.siteStates[siteId].errorCodes);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/60 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertTriangle size={14} />
            異常錯誤碼
          </span>
          {errorCodes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E05454]/20 text-[#E05454] border border-[#E05454]/30">
              {errorCodes.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {errorCodes.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[#7D9B7E]">
            <CheckCircle size={16} />
            <span className="text-sm">目前無異常錯誤碼</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {errorCodes.map((err) => {
              const style = SEVERITY_STYLES[err.severity];
              return (
                <div
                  key={err.id}
                  className="flex flex-col gap-1 p-3 rounded-lg bg-[#1E1208] border border-[#3A2415]"
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${style.badge}`}>
                      {style.icon}
                      {style.label}
                    </span>
                    <span className={`text-xs font-mono font-bold ${style.text}`}>{err.code}</span>
                    <span className="ml-auto text-[11px] text-white/30">
                      {formatRelativeTime(err.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{err.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

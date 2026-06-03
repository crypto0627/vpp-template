"use client";

import type { Notification, NotificationSeverity } from "@/types/notification-type";
import { useNotificationStore } from "@/stores/notification-store";

const SEVERITY_CONFIG: Record<
  NotificationSeverity,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  critical: {
    label: "緊急",
    dotColor: "#E05454",
    bgColor: "rgba(224,84,84,0.15)",
    textColor: "#E05454",
  },
  warning: {
    label: "警告",
    dotColor: "#E8883E",
    bgColor: "rgba(232,136,62,0.15)",
    textColor: "#E8883E",
  },
  info: {
    label: "一般",
    dotColor: "#4A9EDB",
    bgColor: "rgba(74,158,219,0.15)",
    textColor: "#4A9EDB",
  },
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

interface Props {
  notification: Notification;
}

export function NotificationItem({ notification }: Props) {
  const markRead = useNotificationStore((s) => s.markRead);
  const config = SEVERITY_CONFIG[notification.severity];

  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border transition-colors ${
        notification.isRead
          ? "bg-[#1B0F08] border-[#3A2415]"
          : "bg-[#2A1A0F] border-[#3A2415]"
      }`}
    >
      {/* Severity dot */}
      <div className="flex-shrink-0 pt-[18px]">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: notification.isRead ? "#3A2415" : config.dotColor }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#3A2415] text-[#BEA98F]">
            {notification.siteName}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: config.bgColor, color: config.textColor }}
          >
            {config.label}
          </span>
        </div>
        <p className="text-sm font-semibold text-white mb-1">{notification.title}</p>
        <p className="text-xs text-white/50 mb-2 leading-relaxed">{notification.message}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">{formatRelativeTime(notification.createdAt)}</span>
          {!notification.isRead && (
            <button
              onClick={() => markRead(notification.id)}
              className="text-xs text-[#E8883E]/60 hover:text-[#E8883E] transition-colors cursor-pointer"
            >
              標已讀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

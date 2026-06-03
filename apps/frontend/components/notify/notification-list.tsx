"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/stores/notification-store";
import { NotificationItem } from "./notification-item";
import type { Notification } from "@/types/notification-type";

type FilterTab = "all" | "unread" | "critical" | "neihu" | "etai";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "unread", label: "未讀" },
  { id: "critical", label: "重要" },
  { id: "neihu", label: "內湖" },
  { id: "etai", label: "億泰" },
];

function filterNotifications(notifications: Notification[], tab: FilterTab): Notification[] {
  switch (tab) {
    case "unread":
      return notifications.filter((n) => !n.isRead);
    case "critical":
      return notifications.filter((n) => n.severity === "critical");
    case "neihu":
      return notifications.filter((n) => n.siteId === "neihu");
    case "etai":
      return notifications.filter((n) => n.siteId === "etai");
    default:
      return notifications;
  }
}

function getTabCount(notifications: Notification[], tab: FilterTab): number {
  switch (tab) {
    case "all":
      return notifications.length;
    case "unread":
      return notifications.filter((n) => !n.isRead).length;
    case "critical":
      return notifications.filter((n) => n.severity === "critical").length;
    case "neihu":
      return notifications.filter((n) => n.siteId === "neihu").length;
    case "etai":
      return notifications.filter((n) => n.siteId === "etai").length;
  }
}

export function NotificationList() {
  const { notifications, markAllRead, clear } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered = filterNotifications(notifications, activeTab);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const criticalCount = notifications.filter((n) => n.severity === "critical").length;
  const warningCount = notifications.filter((n) => n.severity === "warning").length;
  const infoCount = notifications.filter((n) => n.severity === "info").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">通知中心</h1>
          {unreadCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#E05454] text-white font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-white/40 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#3A2415] cursor-pointer"
            >
              全部標已讀
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clear}
              className="text-xs text-white/40 hover:text-[#E05454] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#3A2415] cursor-pointer"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((tab) => {
          const count = getTabCount(notifications, tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-[#E8883E] text-white"
                  : "bg-[#2A1A0F] text-white/40 hover:text-white hover:bg-[#3A2415]"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`text-[10px] rounded-full px-1.5 min-w-[18px] text-center ${
                    isActive ? "bg-white/20 text-white" : "bg-[#3A2415] text-white/40"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      {notifications.length > 0 && (
        <div className="flex gap-5 mb-4 px-1">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#E05454]" />
              <span className="text-xs text-white/40">{criticalCount} 緊急</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#E8883E]" />
              <span className="text-xs text-white/40">{warningCount} 警告</span>
            </div>
          )}
          {infoCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#4A9EDB]" />
              <span className="text-xs text-white/40">{infoCount} 一般</span>
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bell size={44} className="text-white/10 mb-4" />
            <p className="text-white/30 text-sm">目前沒有通知</p>
          </div>
        ) : (
          filtered.map((n) => <NotificationItem key={n.id} notification={n} />)
        )}
      </div>
    </div>
  );
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification, PendingNotification, NotificationStoreState } from "@/types/notification-type";

const MAX_NOTIFICATIONS = 100;

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: [],
      lastFiredAt: {},

      addNotifications: (items: PendingNotification[]) => {
        if (items.length === 0) return;
        const now = Date.now();
        const newItems: Notification[] = items.map((item) => ({
          ...item,
          id: `${item.ruleId}-${now}-${Math.random().toString(36).slice(2, 7)}`,
          isRead: false,
        }));
        const updatedLastFiredAt = { ...get().lastFiredAt };
        items.forEach((item) => {
          updatedLastFiredAt[item.ruleId] = now;
        });
        set((state) => ({
          notifications: [...newItems, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
          lastFiredAt: updatedLastFiredAt,
        }));
      },

      markRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        }));
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      clear: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: "vpp-notification-store",
      partialize: (state) => ({
        notifications: state.notifications,
        lastFiredAt: state.lastFiredAt,
      }),
    },
  ),
);

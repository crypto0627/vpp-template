export type NotificationSeverity = "critical" | "warning" | "info";

export interface Notification {
  id: string;
  ruleId: string;
  siteId: "neihu" | "etai";
  siteName: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export type PendingNotification = Omit<Notification, "id" | "isRead">;

export interface NotificationStoreState {
  notifications: Notification[];
  lastFiredAt: Record<string, number>;
  addNotifications: (items: PendingNotification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

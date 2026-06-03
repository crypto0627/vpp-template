"use client";

import { useNotificationEngine } from "@/hooks/use-notification-engine";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useNotificationEngine();
  return <>{children}</>;
}

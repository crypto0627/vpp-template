"use client";

import { useEffect, useRef } from "react";
import { useSiteDataStore } from "@/stores/data-store";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import { evaluateNotificationRules } from "@/utils/notification-engine";
import { NOTIFICATION_COOLDOWNS_MS } from "@/constants/notification-rules";
import type { SiteId } from "@/types/data-type";

const ALL_SITES: SiteId[] = ["neihu", "etai"];

function runEngine() {
  const { data, summaryData, lastUpdated } = useSiteDataStore.getState();
  const { lastFiredAt, addNotifications } = useNotificationStore.getState();
  const user = useAuthStore.getState().user;

  const allowedSites: SiteId[] =
    user?.role === "admin" ? ALL_SITES : ((user?.sitePermissions ?? []) as SiteId[]);

  if (allowedSites.length === 0) return;

  const now = new Date();
  const triggered = evaluateNotificationRules({ summaryData, data, lastUpdated, now, allowedSites });

  const toAdd = triggered.filter((n) => {
    const lastFired = lastFiredAt[n.ruleId];
    const cooldown = NOTIFICATION_COOLDOWNS_MS[n.ruleId] ?? 30 * 60 * 1000;
    return !lastFired || now.getTime() - lastFired > cooldown;
  });

  if (toAdd.length > 0) addNotifications(toAdd);
}

export function useNotificationEngine() {
  const lastUpdated = useSiteDataStore((s) => s.lastUpdated);
  const user = useAuthStore((s) => s.user);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: run once after auth settles (covers date-based rules like ETai DR season)
  useEffect(() => {
    const t = setTimeout(runEngine, 2000);
    return () => clearTimeout(t);
  }, []);

  // On data change: debounced run
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runEngine, 3000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [lastUpdated, user]);
}

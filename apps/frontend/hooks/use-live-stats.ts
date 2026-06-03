"use client";

import { useState, useEffect, useRef } from "react";
import type { LiveStats } from "@/utils/live-stats";
import { calcLiveStats } from "@/utils/live-stats";
import { NEIHU_SIMULATION_CONFIG } from "@/config/site-configs";
import type { SiteId } from "@/components/home/types";

const POLL_INTERVAL_MS = 10_000;

export function useLiveStats(siteId: SiteId) {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ETai has no real-time backend
  const isSupported = siteId === "neihu";

  useEffect(() => {
    if (!isSupported) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStats(null);
      return;
    }

    const fetch_ = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/neihu/data?range=today");
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        const data = json.data ?? [];
        setStats(calcLiveStats(data, NEIHU_SIMULATION_CONFIG));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetch_();
    timerRef.current = setInterval(fetch_, POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [siteId, isSupported]);

  return { stats, loading, error, isSupported };
}

"use client";

import { useEffect } from "react";
import HomeSidebar from "@/components/layout/sidebar";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useControllerStore } from "@/stores/controller-store";
import { ControllerHeader } from "@/components/controller/controller-header";
import { SystemStatusOverview } from "@/components/controller/system-status-overview";
import { BESSMonitoringPanel } from "@/components/controller/bess-monitoring-panel";
import { SensorPanel } from "@/components/controller/sensor-panel";
import { ErrorCodePanel } from "@/components/controller/error-code-panel";
import { ControlPanel } from "@/components/controller/control-panel";
import { EmergencyPanel } from "@/components/controller/emergency-panel";
import type { SiteId } from "@/types/data-type";

export default function ControllerPage() {
  const { isLoading, isAuthorized, user } = useAuthGuard({ allowedRoles: ["admin", "worker"] });
  const { selectedSite, setSelectedSite, tickVariation } = useControllerStore();

  // Auto-select site for worker (or first allowed site on mount)
  useEffect(() => {
    if (!user) return;
    if (selectedSite) return;

    const allowedSites: SiteId[] =
      user.role === "admin"
        ? ["neihu", "etai"]
        : ((user.sitePermissions ?? []) as SiteId[]);

    if (allowedSites.length > 0) {
      setSelectedSite(allowedSites[0]!);
    }
  }, [user, selectedSite, setSelectedSite]);

  // Tick mock sensor variation every 5 seconds
  useEffect(() => {
    const interval = setInterval(tickVariation, 5000);
    return () => clearInterval(interval);
  }, [tickVariation]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E1208]">
        <div className="text-white/50">載入中...</div>
      </div>
    );
  }
  if (!isAuthorized || !user) return null;

  const currentSite: SiteId =
    selectedSite ??
    ((user.role === "admin" ? "neihu" : (user.sitePermissions?.[0] ?? "neihu")) as SiteId);

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen bg-[#1E1208] lg:gap-4 lg:p-4">
      <HomeSidebar />
      <main className="flex-1 flex flex-col gap-4 text-white p-4 pb-24 lg:py-2 lg:px-0 lg:pb-0 lg:min-h-0 lg:overflow-y-auto">
        <ControllerHeader user={user} />

        <SystemStatusOverview siteId={currentSite} />

        <BESSMonitoringPanel siteId={currentSite} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SensorPanel siteId={currentSite} />
          <ErrorCodePanel siteId={currentSite} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ControlPanel siteId={currentSite} />
          <EmergencyPanel siteId={currentSite} />
        </div>
      </main>
    </div>
  );
}

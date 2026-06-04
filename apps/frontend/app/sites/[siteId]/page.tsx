"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";
import HomeSidebar from "@/components/layout/sidebar";
import { useSiteDataStore } from "@/stores/data-store";
import { useEffect } from "react";
import { SiteId } from "@/types/data-type";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getSiteConfig } from "@/config/site-configs";
import { LiveClock } from "@/components/ui/live-clock";

const SiteSummaryCards = dynamic(() => import("@/components/site/site-summary-cards").then((m) => m.SiteSummaryCards), { loading: () => <div className="h-32 bg-[#2A1A0F] rounded-xl animate-pulse" /> });
const PowerDemandChart = dynamic(() => import("@/components/site/power-demand-chart").then((m) => m.PowerDemandChart), { loading: () => <div className="h-80 bg-[#2A1A0F] rounded-xl animate-pulse" /> });
const BatterySOCChart = dynamic(() => import("@/components/site/battery-soc-chart").then((m) => m.BatterySOCChart), { loading: () => <div className="h-80 bg-[#2A1A0F] rounded-xl animate-pulse" /> });
const EnergyFlowDiagram = dynamic(() => import("@/components/site/energy-flow-diagram").then((m) => m.EnergyFlowDiagram), { loading: () => <div className="h-64 bg-[#2A1A0F] rounded-xl animate-pulse" /> });
const ChargerStatusGrid = dynamic(() => import("@/components/site/charger-status-grid").then((m) => m.ChargerStatusGrid), { loading: () => <div className="h-48 bg-[#2A1A0F] rounded-xl animate-pulse" /> });

const SITE_CONFIG: Record<SiteId, { name: string; location: string; contractLimit: number; capacity: number; type: "charging" | "storage" }> = {
  neihu: { name: "內湖Evalue旗艦站", location: "台北市內湖區", contractLimit: 432, capacity: 370, type: "charging" },
  etai: { name: "億泰電纜儲能站", location: "桃園市中壢區", contractLimit: 2400, capacity: 10030, type: "storage" },
};

const VALID_SITE_IDS: SiteId[] = ["neihu", "etai"];
const REPORT_SITE_IDS: SiteId[] = ["neihu", "etai"];

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.siteId as SiteId;
  const { isAuthenticated, isLoading } = useAuthGuard({ siteId });
  const { setCurrentSite, fetchData } = useSiteDataStore();
  const isValidSite = siteId && VALID_SITE_IDS.includes(siteId);

  useEffect(() => {
    if (isValidSite) {
      setCurrentSite(siteId);
      fetchData(siteId);
      const interval = setInterval(() => fetchData(siteId), 10000);
      return () => clearInterval(interval);
    }
  }, [siteId, isValidSite, setCurrentSite, fetchData]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E1208]">
        <div className="text-white/50">載入中...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!isValidSite) {
    return (
      <div className="flex flex-col lg:flex-row lg:h-screen bg-[#1E1208] lg:gap-4 lg:p-4">
        <HomeSidebar />
        <main className="flex-1 flex items-center justify-center text-white p-4 pb-24 lg:p-0">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">案場不存在</h1>
            <Link href="/" className="px-4 py-2 bg-[#E8883E] rounded-xl text-white hover:bg-[#d4762e]">返回首頁</Link>
          </div>
        </main>
      </div>
    );
  }

  const siteInfo = SITE_CONFIG[siteId];
  const simConfig = getSiteConfig(siteId);
  const isChargingSite = siteInfo.type === "charging";

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen bg-[#1E1208] lg:gap-4 lg:p-4">
      <HomeSidebar />
      <main className="flex-1 flex flex-col gap-4 text-white p-4 pb-24 lg:py-2 lg:px-0 lg:pb-0 lg:min-h-0 lg:overflow-y-auto">
        {/* Header */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="flex items-center gap-1 text-white/40 hover:text-[#E8883E] transition-colors text-sm">
              <ChevronLeft size={16} />首頁
            </Link>
            <span className="text-white/20">/</span>
            <h1 className="text-lg font-bold">{siteInfo.name}</h1>
            <span className="text-sm font-medium text-white/70 hidden xs:inline">{simConfig.PCS_CAPACITY_KW} kW / {simConfig.BESS_CAPACITY_KWH.toLocaleString()} kWh</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <LiveClock />
            <span className="text-white/20">|</span>
            <span className="text-xs text-white/40">{siteInfo.location}</span>
            <span className="px-2 py-0.5 rounded-lg text-xs bg-[#3A2415] text-[#E8883E] border border-[#E8883E]/20">
              {siteInfo.type === "storage" ? "儲能站" : "充電站"}
            </span>
            {REPORT_SITE_IDS.includes(siteId) && (
              <>
                <Link href={`/sites/${siteId}/history`} className="px-3 py-1.5 text-xs bg-[#E8883E] text-white rounded-lg hover:bg-[#d4762e] transition-colors">歷史數據</Link>
                <Link href={`/sites/${siteId}/report`} className="px-3 py-1.5 text-xs bg-[#3A2415] text-white/70 border border-[#E8883E]/20 rounded-lg hover:bg-[#4A3020] transition-colors">財報</Link>
              </>
            )}
          </div>
        </div>

        <SiteSummaryCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PowerDemandChart />
          <BatterySOCChart />
        </div>

        <EnergyFlowDiagram />

        {isChargingSite && <ChargerStatusGrid />}
      </main>
    </div>
  );
}

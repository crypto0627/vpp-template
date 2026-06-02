"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/home/navbar";
import { useSiteDataStore } from "@/stores/data-store";
import { useEffect } from "react";
import { SiteId } from "@/types/data-type";
import { SiteSummaryCards } from "@/components/site/site-summary-cards";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { PageLoading } from "@/components/ui";
import { getSiteConfig } from "@/config/site-configs";

// Code-split heavy visualization components
const PowerDemandChart = dynamic(
  () =>
    import("@/components/site/power-demand-chart").then(
      (m) => m.PowerDemandChart,
    ),
  {
    loading: () => <div className="h-80 bg-gray-50 rounded-lg animate-pulse" />,
  },
);
const BatterySOCChart = dynamic(
  () =>
    import("@/components/site/battery-soc-chart").then(
      (m) => m.BatterySOCChart,
    ),
  {
    loading: () => <div className="h-80 bg-gray-50 rounded-lg animate-pulse" />,
  },
);
const EnergyFlowDiagram = dynamic(
  () =>
    import("@/components/site/energy-flow-diagram").then(
      (m) => m.EnergyFlowDiagram,
    ),
  {
    loading: () => <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />,
  },
);
const ChargerStatusGrid = dynamic(
  () =>
    import("@/components/site/charger-status-grid").then(
      (m) => m.ChargerStatusGrid,
    ),
  {
    loading: () => <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />,
  },
);
// Site configuration
const SITE_CONFIG: Record<
  SiteId,
  { name: string; type: "charging" | "storage" }
> = {
  neihu: { name: "內湖Evalue旗艦站", type: "charging" },
  etai: { name: "億泰電纜儲能站", type: "storage" },
};

const VALID_SITE_IDS: SiteId[] = ["neihu", "etai"];

// Sites that have a financial report
const REPORT_SITE_IDS: SiteId[] = ["neihu", "etai"];

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.siteId as SiteId;
  const { isAuthenticated, isLoading } = useAuthGuard({ siteId });
  const { setCurrentSite } = useSiteDataStore();

  const isValidSite = siteId && VALID_SITE_IDS.includes(siteId);

  useEffect(() => {
    if (isValidSite) {
      setCurrentSite(siteId);
    }
  }, [siteId, isValidSite, setCurrentSite]);

  if (isLoading) {
    return <PageLoading text="載入中..." className="h-screen" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isValidSite) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              案場不存在
            </h1>
            <p className="text-gray-600 mb-6">找不到指定的案場資訊</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-[#DA7756] text-white rounded-md hover:bg-[#C2614A]"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const siteConfig = SITE_CONFIG[siteId];
  const siteName = siteConfig.name;
  const isChargingSite = siteConfig.type === "charging";
  const simConfig = getSiteConfig(siteId);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Site Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {siteName}
              <span className="ml-2 text-base sm:text-lg font-medium text-gray-500">
                {simConfig.PCS_CAPACITY_KW} kW / {simConfig.BESS_CAPACITY_KWH.toLocaleString()} kWh
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mt-1">
              即時監控與數據分析
            </p>
          </div>
          <div className="flex items-center gap-2">
            {REPORT_SITE_IDS.includes(siteId) && (
              <>
                <Link
                  href={`/sites/${siteId}/history`}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#DA7756] text-white rounded-md hover:bg-[#C2614A] transition-colors whitespace-nowrap"
                >
                  歷史數據
                </Link>
                <Link
                  href={`/sites/${siteId}/report`}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#DA7756] text-white rounded-md hover:bg-[#C2614A] transition-colors whitespace-nowrap"
                >
                  財報
                </Link>
              </>
            )}
            <Link
              href="/"
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              返回首頁
            </Link>
          </div>
        </div>

        {/* Row 1: Summary Cards - Total Usage & Savings */}
        <SiteSummaryCards />

        {/* Row 2: Power Demand & Battery SOC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <PowerDemandChart />
          <BatterySOCChart />
        </div>

        {/* Row 3: Energy Flow */}
        <EnergyFlowDiagram />

        {/* Row 4: Charger Status Grid - Only show for charging sites */}
        {isChargingSite && <ChargerStatusGrid />}
      </main>
    </div>
  );
}

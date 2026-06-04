import HomeLeftStats from "./electricity-stats";
import HomeBessStats from "./bess-stats";
import HomeFinanceCard from "./finance-card";
import type { SiteId } from "./types";

const SITE_NAMES: Record<SiteId, string> = {
  neihu: "內湖Evalue旗艦站",
  etai: "億泰電纜儲能站",
};

interface HomeLeftColumnProps {
  selectedSiteId: SiteId;
}

export default function HomeLeftColumn({ selectedSiteId }: HomeLeftColumnProps) {
  return (
    <div className="xl:flex-1 flex flex-col gap-4 xl:min-h-0 xl:overflow-hidden">
      {/* Site title */}
      <div className="shrink-0 px-1">
        <h2 className="text-lg font-bold text-white">{SITE_NAMES[selectedSiteId]}</h2>
      </div>

      <HomeFinanceCard selectedSiteId={selectedSiteId} />

      {/* Stats row: stacked on small phones, side-by-side on xs+ (iPhone 16+) */}
      <div className="flex flex-col xs:flex-row gap-4 xl:flex-1 xl:min-h-0">
        <HomeLeftStats selectedSiteId={selectedSiteId} />
        <HomeBessStats siteId={selectedSiteId} />
      </div>
    </div>
  );
}

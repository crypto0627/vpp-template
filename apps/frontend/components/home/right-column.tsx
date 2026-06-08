import HomeMap from "./site-map";
import type { SiteId } from "./types";

interface HomeRightColumnProps {
  allowedSites: SiteId[];
  onSiteSelect: (siteId: SiteId) => void;
}

export default function HomeRightColumn({ allowedSites, onSiteSelect }: HomeRightColumnProps) {
  return (
    /* Mobile: fixed height map; xl (MacBook+): flex-1 fills the column */
    <div className="xl:flex-1 flex flex-col gap-4">
      <div className="h-64 md:h-80 xl:flex-1 bg-[#2A1A0F] rounded-2xl overflow-hidden border border-[#3A2415]">
        <HomeMap allowedSites={allowedSites} onSiteSelect={onSiteSelect} />
      </div>
    </div>
  );
}

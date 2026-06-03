"use client";

import { useState } from "react";
import HomeLeftColumn from "./left-column";
import HomeRightColumn from "./right-column";
import type { SiteId } from "./types";

export default function Home() {
  const [selectedSiteId, setSelectedSiteId] = useState<SiteId>("neihu");

  return (
    <main className="flex-1 flex flex-col xl:flex-row gap-4 text-white p-4 pb-24 lg:p-0 lg:py-4 lg:pb-4 xl:min-h-0 xl:overflow-hidden">
      <HomeLeftColumn selectedSiteId={selectedSiteId} />
      <HomeRightColumn onSiteSelect={setSelectedSiteId} />
    </main>
  );
}

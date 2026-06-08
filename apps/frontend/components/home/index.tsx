"use client";

import { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import HomeLeftColumn from "./left-column";
import HomeRightColumn from "./right-column";
import type { SiteId } from "./types";

const ALL_SITES: SiteId[] = ["neihu", "etai"];

export default function Home() {
  const user = useAuthStore((s) => s.user);

  // admin → all sites; viewer/worker → only their permitted sites.
  const allowedSites = useMemo<SiteId[]>(() => {
    if (!user) return ALL_SITES;
    if (user.role === "admin") return ALL_SITES;
    const perms = (user.sitePermissions ?? []) as SiteId[];
    return ALL_SITES.filter((s) => perms.includes(s));
  }, [user]);

  const [selectedSiteId, setSelectedSiteId] = useState<SiteId>(allowedSites[0] ?? "neihu");

  // Derive the effective selection so it always stays within the permitted set
  // (e.g. when permissions load in or change) without syncing state in an effect.
  const effectiveSiteId =
    allowedSites.includes(selectedSiteId) ? selectedSiteId : allowedSites[0];

  if (allowedSites.length === 0 || !effectiveSiteId) {
    return (
      <main className="flex-1 flex items-center justify-center text-white/50 p-4 pb-24 lg:p-0">
        尚未指派可檢視的案場
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col xl:flex-row gap-4 text-white p-4 pb-24 lg:p-0 lg:py-4 lg:pb-4 xl:min-h-0 xl:overflow-hidden">
      <HomeLeftColumn selectedSiteId={effectiveSiteId} />
      <HomeRightColumn allowedSites={allowedSites} onSiteSelect={setSelectedSiteId} />
    </main>
  );
}

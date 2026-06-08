"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteId } from "@/types/data-type";

interface SiteNavProps {
  siteId: SiteId | string;
}

/** Top-right navigation for site pages — links to every site sub-page + 首頁. */
export function SiteNav({ siteId }: SiteNavProps) {
  const pathname = usePathname();

  const links = [
    { label: "監控", href: `/sites/${siteId}` },
    { label: "歷史數據", href: `/sites/${siteId}/history` },
    { label: "財報", href: `/sites/${siteId}/report` },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {links.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              isActive
                ? "bg-[#E8883E] text-white"
                : "bg-[#3A2415] text-white/70 border border-[#E8883E]/20 hover:bg-[#4A3020]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

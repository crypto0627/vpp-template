"use client";

import { useParams } from "next/navigation";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { PageLoading } from "@/components/ui";
import type { SiteId } from "@/types/data-type";

export default function Engineering() {
  const params = useParams();
  const siteId = params.siteId as SiteId;
  const { isAuthenticated, isLoading } = useAuthGuard({
    allowedRoles: ["admin", "worker"],
    siteId,
  });

  if (isLoading) return <PageLoading />;
  if (!isAuthenticated) return null;

  return (
    <div>
      here is Engineering
    </div>
  );
}

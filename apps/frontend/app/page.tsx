"use client";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import HomeSidebar from "@/components/layout/sidebar";
import Home from "@/components/home";

export default function HomePage() {
  const { isLoading, isAuthorized } = useAuthGuard({ allowedRoles: ["admin"] });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E1208]">
        <div className="text-white/50">載入中...</div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen bg-[#1E1208] lg:gap-4 lg:p-4">
      <HomeSidebar />
      <Home />
    </div>
  );
}

"use client";

// VPP Dashboard: Sites navigator & Summary all sites data
import { useState, useEffect } from "react";
import { Navbar } from "@/components/home/navbar";
import { SiteSidebar } from "@/components/home/site-sidebar";
import { MapSection } from "@/components/home/map-section";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { PageLoading } from "@/components/ui";
import { SummaryCards } from "@/components/home/summary-cards";
import { SiteId } from "@/types/data-type";
import { useSiteDataStore } from "@/stores/data-store";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [selectedSite, setSelectedSite] = useState<SiteId | null>("neihu");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthorized, isLoading } = useAuthGuard({
    allowedRoles: ["admin"],
  });
  const { setCurrentSite } = useSiteDataStore();

  useEffect(() => {
    if (selectedSite) {
      setCurrentSite(selectedSite);
    }
  }, [selectedSite, setCurrentSite]);

  const handleSiteSelect = (siteId: SiteId) => {
    setSelectedSite(siteId);
    // Close mobile menu after selection
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (isLoading) {
    return <PageLoading text="載入系統中..." className="h-screen" />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Background Map */}
        <MapSection selectedSite={selectedSite} />

        {/* Overlay Layer for UI Components */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Mobile Toggle Button - Fixed Position */}
          <MobileMenuButton
            isOpen={isMobileMenuOpen}
            onToggle={toggleMobileMenu}
          />

          {/* Mobile Layout */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop Overlay */}
              <MobileOverlay onClose={() => setIsMobileMenuOpen(false)} />

              {/* Full Screen Mobile Container */}
              <div className="absolute inset-0 md:hidden pointer-events-auto z-40">
                <div className="h-full w-full flex flex-col p-4 pt-12">
                  <div className="flex-1 min-h-0 mb-4">
                    <SiteSidebar
                      selectedSite={selectedSite}
                      onSiteSelect={handleSiteSelect}
                    />
                  </div>

                  <div className="shrink-0">
                    <SummaryCards />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Desktop Layout */}
          <DesktopSidebar>
            <SiteSidebar
              selectedSite={selectedSite}
              onSiteSelect={handleSiteSelect}
            />
          </DesktopSidebar>

          <DesktopSummary>
            <SummaryCards />
          </DesktopSummary>
        </div>
      </main>
    </div>
  );
}

// Layout Components
function MobileMenuButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="fixed left-4 top-15 md:hidden pointer-events-auto z-50">
      <Button
        variant="default"
        size="icon"
        onClick={onToggle}
        className="bg-white/95 backdrop-blur-lg hover:bg-white text-gray-800 shadow-2xl border border-white/40 rounded-full h-7 w-7 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
      </Button>
    </div>
  );
}

function MobileOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 bg-black/60 md:hidden pointer-events-auto backdrop-blur-sm z-30 animate-in fade-in duration-200"
      onClick={onClose}
      aria-label="Close menu overlay"
    />
  );
}

function DesktopSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-0 top-0 bottom-0 hidden md:block pointer-events-auto">
      {children}
    </div>
  );
}

function DesktopSummary({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-6 left-4 right-4 md:left-90 md:right-8 lg:right-12 hidden md:block pointer-events-auto">
      {children}
    </div>
  );
}

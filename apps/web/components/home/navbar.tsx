"use client";

import { Button } from "@/components/ui/button";
import { Clock, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuthStore } from "@/stores/auth-store";

export function Navbar() {
  const desktopTimeRef = useRef<HTMLSpanElement>(null);
  const tabletTimeRef = useRef<HTMLSpanElement>(null);
  const mobileTimeRef = useRef<HTMLSpanElement>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  // Get page title based on current route
  const getPageTitle = () => {
    // Normalize pathname: strip trailing slash (added by trailingSlash: true in next.config.js)
    const normalizedPath = pathname.replace(/\/$/, "") || "/";

    if (normalizedPath === "/") {
      return {
        desktop: "Virtual Power Plant 總覽",
        tablet: "VPP 總覽",
        mobile: "Virtual Power Plant 總覽",
      };
    }

    // Check if it's a site detail page
    const siteMatch = normalizedPath.match(/^\/sites\/(.+)$/);
    if (siteMatch) {
      const fullPath = siteMatch[1]!;
      const SITE_NAMES: Record<string, string> = {
        neihu: "內湖Evalue旗艦站",
        etai: "億泰電纜儲能站",
      };
      const SUFFIX_LABELS: Record<string, string> = {
        report: "財報",
        history: "歷史數據",
      };

      // Parse: "neihu", "neihu/report", "neihu/history"
      const parts = fullPath.split("/");
      const baseId = parts[0]!;
      const suffix = parts[1] || "";
      const baseName = SITE_NAMES[baseId] || `${baseId}案場`;
      const label = SUFFIX_LABELS[suffix];
      const siteName = label ? `${baseName}${label}` : baseName;

      return {
        desktop: siteName,
        tablet: siteName,
        mobile: siteName,
      };
    }

    // Default fallback
    return {
      desktop: "Virtual Power Plant 總覽",
      tablet: "VPP 總覽",
      mobile: "Virtual Power Plant 總覽",
    };
  };

  const pageTitle = getPageTitle();

  useEffect(() => {
    const format = (date: Date) => {
      return date.toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    };

    const timer = setInterval(() => {
      const now = new Date();
      const timeString = format(now);

      // Update all visible clocks without re-rendering the Navbar
      if (desktopTimeRef.current)
        desktopTimeRef.current.textContent = timeString;
      if (tabletTimeRef.current) tabletTimeRef.current.textContent = timeString;
      if (mobileTimeRef.current) mobileTimeRef.current.textContent = timeString;
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className={`w-full px-4 sm:px-6 py-2 sm:py-4 text-gray-400`}>
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="w-25 xl:w-50 h-6.25 xl:h-12.5 relative">
              <Image
                src={`/ess-logo.png`}
                alt="Logo"
                fill
                sizes="(min-width: 1280px) 200px, 100px"
                className="object-contain"
              />
            </Link>
          </div>

          <div className="text-xl xl:text-2xl font-extrabold">
            {pageTitle.desktop}
          </div>

          <div className="flex items-center space-x-3 xl:space-x-4">
            <div className="flex items-center space-x-1 text-base xl:text-lg">
              <Clock className="h-5 w-5 xl:h-6 xl:w-6" />
              {/* Added tabular-nums to prevent text jumping */}
              <span ref={desktopTimeRef} className="tabular-nums min-w-17.5">
                --:--:--
              </span>
            </div>

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    登入
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">註冊</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tablet Layout */}
        <div className="hidden md:flex lg:hidden items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="w-35 h-8.75 relative">
              <Image
                src={`/ess-logo.png`}
                alt="Logo"
                fill
                sizes="140px"
                className="object-contain"
              />
            </Link>
          </div>

          <div className="text-base font-semibold text-gray-800">
            {pageTitle.tablet}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span ref={tabletTimeRef} className="tabular-nums min-w-15">
                --:--:--
              </span>
            </div>

            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-1">
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm" className="text-xs px-2">
                    登入
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="text-xs px-2">
                    註冊
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="w-25 h-7.5 relative">
              <Image
                src={`/ess-logo.png`}
                alt="Logo"
                fill
                sizes="100px"
                className="object-contain"
              />
            </Link>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="p-2"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 space-y-3">
          <div className="text-base font-semibold text-gray-800 text-center">
            {pageTitle.mobile}
          </div>

          <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span ref={mobileTimeRef} className="tabular-nums">
              --:--:--
            </span>
          </div>

          <div className="flex justify-center">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm" className="text-xs">
                    登入
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="text-xs">
                    註冊
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

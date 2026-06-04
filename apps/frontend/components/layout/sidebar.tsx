"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LayoutDashboard, Bell, LogOut, Binary } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";

const adminNavItems = [
  { icon: Home, label: "首頁", href: "/" },
  { icon: LayoutDashboard, label: "管理", href: "/management" },
  { icon: Bell, label: "通知", href: "/notify" },
  { icon: Binary, label: "維運控制", href: "/controller" },
];

const workerNavItems = [{ icon: Binary, label: "維運控制", href: "/controller" }];

export default function HomeSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.isRead).length);
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  const navItems =
    user?.role === "admin" ? adminNavItems : user?.role === "worker" ? workerNavItems : [];

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/signin");
  };

  const navLinkClass = (href: string) =>
    `w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200
    ${pathname === href
      ? "bg-[#E8883E] text-white shadow-lg shadow-[#E8883E]/30"
      : "text-white/40 hover:text-white hover:bg-[#3A2415]"
    }`;

  const profileClass =
    `w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 text-sm font-bold
    ${pathname === "/profile"
      ? "bg-[#E8883E] text-white shadow-lg shadow-[#E8883E]/30"
      : "bg-[#3A2415] text-white/70 hover:text-white hover:bg-[#4A3020]"
    }`;

  return (
    <>
      {/* ── Desktop vertical sidebar (lg+) ── */}
      <div className="hidden lg:flex w-16 shrink-0 flex-col bg-[#241508] rounded-2xl text-white border border-[#3A2415]">
        {/* Logo */}
        <div className="flex-1 flex items-start justify-center pt-5">
          <Image
            src="/FE_logo.webp"
            alt="Fortune ESS Logo"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>

        {/* Nav icons */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          {navItems.map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href} title={label} className={navLinkClass(href)}>
              {href === "/notify" ? (
                <div className="relative">
                  <Icon size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 bg-[#E05454] rounded-full text-[9px] flex items-center justify-center text-white font-bold px-0.5">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
              ) : (
                <Icon size={18} />
              )}
            </Link>
          ))}

          <Link href="/profile" title="Profile" className={profileClass}>
            {initial}
          </Link>
        </div>

        {/* Logout */}
        <div className="flex-1 flex items-end justify-center pb-6">
          <button
            title="Logout"
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-[#3A2415] transition-all duration-200 cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* ── Mobile / tablet bottom navigation (< lg) ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#241508] border-t border-[#3A2415]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around h-14 px-2">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center w-10 h-10 shrink-0">
            <Image
              src="/FE_logo.webp"
              alt="Fortune ESS"
              width={28}
              height={28}
              className="object-contain"
            />
          </Link>

          {/* Nav items */}
          {navItems.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              title={label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200
                ${pathname === href
                  ? "bg-[#E8883E] text-white shadow-lg shadow-[#E8883E]/30"
                  : "text-white/40 hover:text-white"
                }`}
            >
              <Icon size={20} />
              {href === "/notify" && unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-3.5 h-3.5 bg-[#E05454] rounded-full text-[9px] flex items-center justify-center text-white font-bold px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ))}

          {/* Profile */}
          <Link
            href="/profile"
            title="Profile"
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200
              ${pathname === "/profile"
                ? "bg-[#E8883E] text-white shadow-lg shadow-[#E8883E]/30"
                : "bg-[#3A2415] text-white/70 hover:text-white hover:bg-[#4A3020]"
              }`}
          >
            {initial}
          </Link>

          {/* Logout */}
          <button
            title="Logout"
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-[#3A2415] transition-all duration-200 cursor-pointer"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>
    </>
  );
}

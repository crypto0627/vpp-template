"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types/auth";
import type { SiteId } from "@/types/data-type";

interface RoleGuardOptions {
  allowedRoles?: UserRole[];
  siteId?: SiteId;
  redirectTo?: string;
}

export function useAuthGuard(options: RoleGuardOptions = {}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { allowedRoles, siteId, redirectTo = "/auth/signin" } = options;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.sitePermissions && user.sitePermissions.length > 0) {
        router.push(`/sites/${user.sitePermissions[0]}`);
      } else {
        router.push("/auth/signin");
      }
      return;
    }
    // viewer and worker are both restricted to their assigned sitePermissions
    const needsSiteCheck = user.role === "viewer" || user.role === "worker";
    if (siteId && needsSiteCheck && user.sitePermissions && !user.sitePermissions.includes(siteId)) {
      if (user.sitePermissions.length > 0) {
        router.push(`/sites/${user.sitePermissions[0]}`);
      } else {
        router.push("/auth/signin");
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, allowedRoles, siteId]);

  const isAuthorized = (() => {
    if (isLoading || !isAuthenticated || !user) return false;
    if (allowedRoles && !allowedRoles.includes(user.role)) return false;
    const needsSiteCheck = user.role === "viewer" || user.role === "worker";
    if (siteId && needsSiteCheck && user.sitePermissions && !user.sitePermissions.includes(siteId)) return false;
    return true;
  })();

  return { isAuthenticated, isLoading, isAuthorized, user };
}

export function useGuestGuard(redirectTo: string = "/") {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      if (user.role === "viewer" || user.role === "worker") {
        if (user.sitePermissions && user.sitePermissions.length > 0) {
          router.push(`/sites/${user.sitePermissions[0]}`);
        }
      } else {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

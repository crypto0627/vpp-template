"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/constants/auth-constants";
import type { SiteId } from "@/types/data-type";

interface RoleGuardOptions {
  /** Roles that are allowed to access this page */
  allowedRoles?: UserRole[];
  /** If set, checks if the user has permission for this specific site */
  siteId?: SiteId;
  /** Where to redirect if unauthorized (default: first permitted site or signin) */
  redirectTo?: string;
}

export function useAuthGuard(options: RoleGuardOptions = {}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { allowedRoles, siteId, redirectTo = "/auth/signin" } = options;

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated → go to signin
    if (!isAuthenticated || !user) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to first permitted site if viewer/worker, otherwise signin
      if (
        user.sitePermissions &&
        user.sitePermissions.length > 0
      ) {
        router.push(`/sites/${user.sitePermissions[0]}`);
      } else {
        router.push("/auth/signin");
      }
      return;
    }

    // Check site-level permission for viewer role
    if (
      siteId &&
      user.role === "viewer" &&
      user.sitePermissions &&
      !user.sitePermissions.includes(siteId)
    ) {
      if (user.sitePermissions.length > 0) {
        router.push(`/sites/${user.sitePermissions[0]}`);
      } else {
        router.push("/auth/signin");
      }
      return;
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, allowedRoles, siteId]);

  // Synchronous authorization check — use this to block rendering before redirect
  const isAuthorized = (() => {
    if (isLoading || !isAuthenticated || !user) return false;
    if (allowedRoles && !allowedRoles.includes(user.role)) return false;
    if (
      siteId &&
      user.role === "viewer" &&
      user.sitePermissions &&
      !user.sitePermissions.includes(siteId)
    )
      return false;
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
      // Viewers/workers can't access home, redirect to first permitted site
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

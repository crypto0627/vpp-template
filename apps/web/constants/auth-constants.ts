import type { SiteId } from "@/types/data-type";

export type UserRole = "admin" | "viewer" | "worker";

export interface UserRoleConfig {
  role: UserRole;
  sitePermissions?: SiteId[];
}

export const ALLOWED_EMAILS = [
  "test@test-email.com.tw",
  "jake.kuo@fortune.com.tw",
  "leo.lee@fortune.com.tw",
  "jo.lee@fortune.com.tw",
  "ivy.cheng@fortune.com.tw",
  "alyson.cheng@fortune.com.tw",
  "jacky.wu@fortune.com.tw",
  "sophia.khoo@fortune.com.tw",
  "brad.liu@fortune.com.tw",
  "irene.chien@fortune.com.tw",
  "tyson.dai@fortune.com.tw",
];

/**
 * User role mapping by email.
 * - admin: full access to all pages
 * - viewer: can only access permitted sites (no home page, no engineering page)
 * - worker: can access sites but not home page (no engineering page)
 *
 * Users not listed here default to "viewer" with no site permissions.
 */
export const USER_ROLES: Record<string, UserRoleConfig> = {
  "test@test-email.com.tw": {role: "admin"},
  "jake.kuo@fortune.com.tw": { role: "admin" },
  "leo.lee@fortune.com.tw": { role: "admin" },
  "jo.lee@fortune.com.tw": { role: "admin" },
  "ivy.cheng@fortune.com.tw": { role: "admin" },
  "alyson.cheng@fortune.com.tw": { role: "admin" },
  "jacky.wu@fortune.com.tw": { role: "admin" },
  "sophia.khoo@fortune.com.tw": { role: "worker", sitePermissions: ["etai"] },
  "brad.liu@fortune.com.tw": { role: "admin" },
  "irene.chien@fortune.com.tw": { role: "viewer", sitePermissions: ["neihu"] },
  "tyson.dai@fortune.com.tw": { role: "admin" },
};

export function getUserRoleConfig(email: string): UserRoleConfig {
  return USER_ROLES[email] ?? { role: "viewer" };
}

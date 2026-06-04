export type UserRole = "admin" | "viewer" | "worker";

export interface UserRoleConfig {
  role: UserRole;
  sitePermissions?: string[];
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

export const USER_ROLES: Record<string, UserRoleConfig> = {
  "test@test-email.com.tw": { role: "admin" },
  "jake.kuo@fortune.com.tw": { role: "admin" },
  "leo.lee@fortune.com.tw": { role: "admin" },
  "jo.lee@fortune.com.tw": { role: "admin" },
  "ivy.cheng@fortune.com.tw": { role: "admin" },
  "alyson.cheng@fortune.com.tw": { role: "admin" },
  "sophia.khoo@fortune.com.tw": { role: "worker", sitePermissions: ["etai"] },
  "brad.liu@fortune.com.tw": { role: "viewer", sitePermissions: ["etai"] },
  "irene.chien@fortune.com.tw": { role: "viewer", sitePermissions: ["neihu"] },
};

export function getUserRoleConfig(email: string): UserRoleConfig {
  return USER_ROLES[email] ?? { role: "viewer" };
}

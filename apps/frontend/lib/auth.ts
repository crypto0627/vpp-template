import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "auth-token";

/** JWT lifetime. Keep this in sync with AUTH_COOKIE_MAX_AGE so the cookie and
 *  the token it carries never outlive each other (a longer-lived cookie holding
 *  an expired JWT causes spurious 401s / sign-outs on full page reloads). */
export const JWT_EXPIRES_IN = "7d";
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, in seconds

/** Returns the JWT secret, failing loudly if it is not configured. Never fall
 *  back to a hardcoded default: with multiple replicas an unset secret on one
 *  replica silently invalidates tokens signed by another. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

/** Whether the auth cookie should carry the `Secure` flag. Defaults to true in
 *  production (HTTPS deployments) but can be forced via the COOKIE_SECURE env
 *  var. Set COOKIE_SECURE=false when running the production build over plain
 *  HTTP (e.g. local Docker on http://localhost) — browsers silently drop a
 *  Secure cookie sent over http://, which otherwise breaks auth entirely. */
export function isCookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.COOKIE_SECURE === "true") return true;
  return process.env.NODE_ENV === "production";
}

/** Cookie attributes for the auth token. `secure` is enabled in production so
 *  the cookie is sent over HTTPS, while local HTTP dev still works. */
export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** True when the error is a JWT verification failure (bad/expired token), as
 *  opposed to a server-side error (DB down, missing secret, etc.). Callers use
 *  this to return 401 for the former and 500 for the latter. */
export function isJwtError(error: unknown): boolean {
  return error instanceof jwt.JsonWebTokenError;
}

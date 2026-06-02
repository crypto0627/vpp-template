import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ALLOWED_EMAILS } from "@/constants/auth-constants";
import { BASE_URL } from "../../utils/test-helpers";
import { cleanupTestUsers } from "../../utils/db-test-setup";

describe("Auth API", () => {
  const testEmail = ALLOWED_EMAILS[0];
  const testPassword = "Testuser001";
  const unauthorizedEmail = "unauthorized@example.com";

  afterAll(async () => {
    await cleanupTestUsers();
  });

  describe("ALLOWED_EMAILS Whitelist", () => {
    it("should reject signup with non-whitelisted email", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: unauthorizedEmail,
          password: testPassword,
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should accept signup with whitelisted email", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      // Should succeed (201) or already exist (409)
      expect([200, 201, 409]).toContain(response.status);
    });
  });

  describe("Signup Flow", () => {
    it("should create new user with valid credentials", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // New user created successfully
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(testEmail);
      } else if (response.status === 409) {
        // User already exists - this is also acceptable
        expect(data.error).toBeDefined();
        expect(data.error).toContain("already exists");
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    });

    it("should reject duplicate email", async () => {
      // Try to signup twice with same email
      await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe("Signin Flow", () => {
    beforeAll(async () => {
      // Ensure test user exists
      await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
    });

    it("should authenticate with correct credentials", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail);
    });

    it("should return JWT token as HTTP-only cookie", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const cookies = response.headers.get("set-cookie");
      expect(cookies).toBeDefined();
      expect(cookies).toContain("auth-token");
    });

    it("should reject invalid credentials", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "WrongPassword123!",
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  describe("Auth State Check", () => {
    let authToken: string = "";

    beforeAll(async () => {
      // Sign in to get auth token
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const cookies = response.headers.get("set-cookie");
      if (cookies) {
        const match = cookies.match(/auth-token=([^;]+)/);
        if (match && match[1]) {
          authToken = match[1];
        }
      }
    });

    it("should return user data with valid JWT", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          Cookie: `auth-token=${authToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const user = await response.json();
      expect(user.email).toBe(testEmail);
    });

    it("should reject invalid JWT", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          Cookie: "auth-token=invalid_token_here",
        },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  describe("Signout Flow", () => {
    it("should clear JWT cookie", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signout`, {
        method: "POST",
      });

      expect(response.ok).toBe(true);
      const cookies = response.headers.get("set-cookie");
      expect(cookies).toBeDefined();
      // Cookie should be cleared (empty or expired)
      expect(cookies).toContain("auth-token=");
    });
  });
});

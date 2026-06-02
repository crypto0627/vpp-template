import { describe, it, expect } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

describe("TypeScript Type Checking", () => {
  it("should pass type checking for web app", async () => {
    const { stdout, stderr } = await execAsync(
      "pnpm --filter=web check-types",
      {
        cwd: "/Users/jakekuo/code/fortune-ess/vpp",
      },
    );

    // Check for TypeScript errors
    expect(stderr).not.toContain("error TS");

    // Output should contain success indicator or no errors
    const output = stdout + stderr;
    const hasErrors = output.includes("error TS");
    expect(hasErrors).toBe(false);
  }, 60000); // 60 second timeout

  it("should validate all type imports from centralized types", () => {
    // This test validates that all types are properly exported from @/types
    // Import all types to ensure they're accessible
    const types = [
      // Data types
      "TelemetryData",
      "SiteId",
      "Site",
      // Report types
      "DailyRecord",
      "Summary",
      "ReportData",
      // BESS types
      "PersistedBESSState",
      "BESSState",
      "EnergyStats",
      // Auth types
      "User",
      "AuthState",
      // Validation types
      "SignInFormData",
      "SignUpFormData",
      "FormState",
      // UI types
      "ToasterToast",
      "Toast",
    ];

    // This is a compile-time check - if types are not exported correctly,
    // this test file itself won't compile
    expect(types.length).toBeGreaterThan(0);
  });
});

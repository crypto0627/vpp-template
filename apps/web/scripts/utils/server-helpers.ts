/**
 * Local server testing utilities
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Wait for server to be ready
 */
export async function waitForServer(
  url: string = "http://localhost:3001",
  timeout: number = 30000,
): Promise<void> {
  const startTime = Date.now();
  const interval = 500;

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok || response.status < 500) {
        console.log(`✓ Server is ready at ${url}`);
        return;
      }
    } catch {
      // Server not ready yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

/**
 * Start Next.js dev server for testing
 */
export async function startTestServer(): Promise<{
  stop: () => Promise<void>;
}> {
  console.log("Starting test server...");

  const serverProcess = exec("pnpm dev", {
    cwd: "/Users/jakekuo/code/fortune-ess/vpp/apps/web",
  });

  // Wait for server to be ready
  await waitForServer();

  return {
    stop: async () => {
      if (serverProcess.pid) {
        process.kill(serverProcess.pid);
        console.log("✓ Test server stopped");
      }
    },
  };
}

/**
 * Check if server is running
 */
export async function isServerRunning(
  url: string = "http://localhost:3001",
): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

/**
 * Run a command and return output
 */
export async function runCommand(
  command: string,
  cwd?: string,
): Promise<{ stdout: string; stderr: string }> {
  return execAsync(command, { cwd });
}

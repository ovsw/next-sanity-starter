import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

// Serve on this worktree's own Website port, the one `pnpm dev:worktree` uses,
// so the test server stays inside the Sanity CORS pool and never collides with
// another worktree's server. `pnpm test:smoke` and `pnpm test:e2e` run
// scripts/ensure-worktree-ports.mjs first to assign it. CI uses 3000, and
// PLAYWRIGHT_PORT=<n> overrides both.
function testPort(): number {
  if (process.env.PLAYWRIGHT_PORT) return Number(process.env.PLAYWRIGHT_PORT);
  if (process.env.CI) return 3000;
  const portsFile = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    ".worktree-ports.json",
  );
  if (!existsSync(portsFile)) return 3000;
  let frontendPort: unknown;
  try {
    ({ frontendPort } = JSON.parse(readFileSync(portsFile, "utf8")));
  } catch {
    // Reported below with the file name.
  }
  if (!Number.isInteger(frontendPort)) {
    throw new Error(
      `${portsFile} has no valid frontendPort; remove it and run \`pnpm test:smoke\` again.`,
    );
  }
  return frontendPort as number;
}

const port = testPort();
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    channel: "chrome",
    headless: true,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  webServer: {
    command: process.env.PLAYWRIGHT_REUSE_BUILD
      ? "pnpm start"
      : "pnpm build && pnpm start",
    url: baseURL,
    env: { PORT: String(port) },
    reuseExistingServer:
      !process.env.CI && !process.env.PLAYWRIGHT_REUSE_BUILD,
    timeout: 180_000,
  },
});

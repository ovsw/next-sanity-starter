#!/usr/bin/env node

// Gives this worktree its port slot before Playwright starts, so the smoke and
// e2e tests serve the Website on the same port as `pnpm dev:worktree`, inside
// the Sanity CORS pool, instead of on a port another worktree may hold.
//
// A worktree keeps its saved slot while the Website port is free or held by
// its own dev server. When another worktree or program holds that port, the
// saved slot is dropped and a free one is picked, so Playwright never tests
// another worktree's site.

import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  allocatePorts,
  defaultReservationRoot,
  isPortAvailable,
  RUNTIME_FILE,
} from "./worktree-config.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return undefined;
    throw error;
  }
}

export async function ensureWorktreePorts({
  worktreeRoot,
  runtimeFile = path.join(worktreeRoot, RUNTIME_FILE),
  reservationRoot,
  probe = isPortAvailable,
  allowOwnServer = true,
  log = console.log,
}) {
  const root = path.resolve(worktreeRoot);
  const sharedReservationRoot =
    reservationRoot ?? (await defaultReservationRoot(root));
  const saved = await readJson(runtimeFile);

  if (saved && Number.isInteger(saved.frontendPort)) {
    if (await probe(saved.frontendPort)) return saved;

    const owner = await readJson(
      path.join(sharedReservationRoot, `slot-${saved.slot}`, "owner.json"),
    );
    if (owner?.worktreeRoot === root) {
      if (allowOwnServer) return saved;
      throw new Error(
        `Port ${saved.frontendPort} is held by this worktree's dev server. Stop it with \`pnpm dev:stop\`, then run again.`,
      );
    }

    log(
      `Port ${saved.frontendPort} is held by ${owner?.worktreeRoot ?? "another program"}; picking a new slot.`,
    );
    await rm(runtimeFile, { force: true });
  }

  const ports = await allocatePorts({
    worktreeRoot: root,
    runtimeFile,
    reservationRoot: sharedReservationRoot,
    probe,
  });
  await ports.release();
  log(`Worktree slot ${ports.slot}: Website port ${ports.frontendPort}`);
  return ports;
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  // CI and an explicit PLAYWRIGHT_PORT choose the port themselves.
  if (!process.env.CI && !process.env.PLAYWRIGHT_PORT) {
    ensureWorktreePorts({
      worktreeRoot: repoRoot,
      // `pnpm verify` needs a fresh production server, so Playwright cannot
      // reuse a running dev server there.
      allowOwnServer: !process.env.PLAYWRIGHT_REUSE_BUILD,
    }).catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
  }
}

#!/usr/bin/env node

// Gives this worktree its port slot, then runs Playwright while holding the
// slot's reservation, so the smoke and e2e tests serve the Website on the same
// port as `pnpm dev:worktree`, inside the Sanity CORS pool, instead of on a
// port another worktree may hold.
//
// Usage: node scripts/ensure-worktree-ports.mjs <command> [<argument>...]
//
// A worktree keeps its saved slot while the Website port is free or held by
// its own dev server. When another worktree or program holds that port or the
// slot's reservation, the saved slot is dropped and a free one is picked, so
// Playwright never tests another worktree's site.
//
// The reservation is held until the command exits. Playwright binds the port
// some time after this script picks it; a reservation released in between
// would let another worktree take the same slot.

import { spawn } from "node:child_process";
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

  const slotOwner = (slot) =>
    readJson(path.join(sharedReservationRoot, `slot-${slot}`, "owner.json"));
  const busyWithOwnRun = (slot, cause) =>
    new Error(
      `Port slot ${slot} is reserved by another run in this worktree. Wait for it to finish, or stop it with \`pnpm dev:stop\`, then run again.`,
      { cause },
    );

  if (saved && Number.isInteger(saved.frontendPort)) {
    if (await probe(saved.frontendPort)) {
      try {
        return await allocatePorts({
          worktreeRoot: root,
          runtimeFile,
          reservationRoot: sharedReservationRoot,
          probe,
          purpose: "test",
        });
      } catch (error) {
        // The Website port is free, yet the slot cannot be reserved: another
        // run holds the reservation, or the slot's Studio port is taken.
        if ((await slotOwner(saved.slot))?.worktreeRoot === root) {
          throw busyWithOwnRun(saved.slot, error);
        }
        log(`Port slot ${saved.slot} is taken; picking a new slot.`);
      }
    } else {
      const owner = await slotOwner(saved.slot);
      if (owner?.worktreeRoot === root) {
        // Another test run serves on the port. Its server stops when that run
        // ends, so it cannot be shared the way a dev server can.
        if (owner.purpose === "test") throw busyWithOwnRun(saved.slot);
        // The running dev server holds the reservation already.
        if (allowOwnServer) return withRelease(saved, async () => {});
        throw new Error(
          `Port ${saved.frontendPort} is held by this worktree's dev server. Stop it with \`pnpm dev:stop\`, then run again.`,
        );
      }
      log(
        `Port ${saved.frontendPort} is held by ${owner?.worktreeRoot ?? "another program"}; picking a new slot.`,
      );
    }
    await rm(runtimeFile, { force: true });
  }

  const ports = await allocatePorts({
    worktreeRoot: root,
    runtimeFile,
    reservationRoot: sharedReservationRoot,
    probe,
    purpose: "test",
  });
  log(`Worktree slot ${ports.slot}: Website port ${ports.frontendPort}`);
  return ports;
}

function withRelease(state, release) {
  return Object.defineProperty(state, "release", {
    enumerable: false,
    value: release,
  });
}

/**
 * Run a command and resolve with its exit code. Interrupt and terminate
 * signals go to the command, so this process outlives it and can release the
 * reservation afterwards.
 */
export function runCommand(command, args, { spawnProcess = spawn } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnProcess(command, args, { stdio: "inherit" });
    const forward = (signal) => child.kill(signal);
    const signals = ["SIGINT", "SIGTERM", "SIGHUP"];
    for (const signal of signals) process.on(signal, forward);
    const settle = (finish) => (...values) => {
      for (const signal of signals) process.off(signal, forward);
      finish(...values);
    };
    child.once("error", settle(reject));
    child.once(
      "exit",
      settle((code, signal) => resolve(code ?? (signal ? 1 : 0))),
    );
  });
}

export async function runWithWorktreePorts({
  command,
  args = [],
  environment = process.env,
  ensure = ensureWorktreePorts,
  run = runCommand,
  worktreeRoot = repoRoot,
}) {
  // CI and an explicit PLAYWRIGHT_PORT choose the port themselves.
  const ports =
    environment.CI || environment.PLAYWRIGHT_PORT
      ? undefined
      : await ensure({
          worktreeRoot,
          // `pnpm verify` needs a fresh production server, so Playwright
          // cannot reuse a running dev server there.
          allowOwnServer: !environment.PLAYWRIGHT_REUSE_BUILD,
        });
  try {
    return await run(command, args);
  } finally {
    await ports?.release();
  }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    console.error(
      "Usage: node scripts/ensure-worktree-ports.mjs <command> [<argument>...]",
    );
    process.exit(1);
  }
  runWithWorktreePorts({ command, args }).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}

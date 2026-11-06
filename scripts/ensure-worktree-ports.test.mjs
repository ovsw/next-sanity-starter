import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { ensureWorktreePorts } from "./ensure-worktree-ports.mjs";
import { portsForSlot, RUNTIME_FILE } from "./worktree-config.mjs";

async function setup({ savedSlot, busyPorts = [], slotOwner } = {}) {
  const worktreeRoot = await mkdtemp(path.join(tmpdir(), "starter-ensure-ports-"));
  const reservationRoot = path.join(worktreeRoot, ".test-reservations");
  const runtimeFile = path.join(worktreeRoot, RUNTIME_FILE);
  if (savedSlot !== undefined) {
    await writeFile(runtimeFile, JSON.stringify(portsForSlot(savedSlot)));
    if (slotOwner) {
      const slotDirectory = path.join(reservationRoot, `slot-${savedSlot}`);
      await mkdir(slotDirectory, { recursive: true });
      await writeFile(
        path.join(slotDirectory, "owner.json"),
        JSON.stringify({ worktreeRoot: slotOwner(worktreeRoot) }),
      );
    }
  }
  const busy = new Set(busyPorts);
  return {
    worktreeRoot,
    reservationRoot,
    runtimeFile,
    options: {
      worktreeRoot,
      reservationRoot,
      probe: async (port) => !busy.has(port),
      log: () => {},
    },
  };
}

async function savedState(runtimeFile) {
  return JSON.parse(await readFile(runtimeFile, "utf8"));
}

test("a worktree without a slot gets one saved, with no reservation left behind", async () => {
  const { options, runtimeFile, reservationRoot } = await setup();
  const ports = await ensureWorktreePorts(options);

  assert.deepEqual(await savedState(runtimeFile), portsForSlot(ports.slot));
  assert.deepEqual(await readdir(reservationRoot), []);
});

test("a saved slot with a free Website port is kept", async () => {
  const { options, runtimeFile } = await setup({ savedSlot: 4 });
  const ports = await ensureWorktreePorts(options);

  assert.equal(ports.frontendPort, portsForSlot(4).frontendPort);
  assert.equal((await savedState(runtimeFile)).slot, 4);
});

test("a saved slot held by this worktree's own dev server is kept", async () => {
  const { options, runtimeFile } = await setup({
    savedSlot: 2,
    busyPorts: [portsForSlot(2).frontendPort],
    slotOwner: (root) => root,
  });
  const ports = await ensureWorktreePorts(options);

  assert.equal(ports.slot, 2);
  assert.equal((await savedState(runtimeFile)).slot, 2);
});

test("a fresh production server refuses this worktree's own running dev server", async () => {
  const { options, runtimeFile } = await setup({
    savedSlot: 2,
    busyPorts: [portsForSlot(2).frontendPort],
    slotOwner: (root) => root,
  });

  await assert.rejects(
    ensureWorktreePorts({ ...options, allowOwnServer: false }),
    /pnpm dev:stop/,
  );
  assert.equal((await savedState(runtimeFile)).slot, 2);
});

for (const [label, slotOwner] of [
  ["another worktree", () => "/work/some/other-worktree"],
  ["a program outside the worktrees", undefined],
]) {
  test(`a saved slot held by ${label} is replaced by a free slot`, async () => {
    const { options, runtimeFile } = await setup({
      savedSlot: 0,
      busyPorts: [portsForSlot(0).frontendPort],
      slotOwner,
    });
    const ports = await ensureWorktreePorts(options);

    assert.notEqual(ports.slot, 0);
    assert.deepEqual(await savedState(runtimeFile), portsForSlot(ports.slot));
  });
}

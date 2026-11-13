import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { ensureWorktreePorts, runWithWorktreePorts } from "./ensure-worktree-ports.mjs";
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

async function writeSlot(worktreeRoot, slot) {
  const runtimeFile = path.join(worktreeRoot, RUNTIME_FILE);
  await writeFile(runtimeFile, JSON.stringify(portsForSlot(slot)));
  return runtimeFile;
}

async function savedState(runtimeFile) {
  return JSON.parse(await readFile(runtimeFile, "utf8"));
}

test("a worktree without a slot gets one saved and reserved until released", async () => {
  const { options, runtimeFile, reservationRoot } = await setup();
  const ports = await ensureWorktreePorts(options);

  assert.deepEqual(await savedState(runtimeFile), portsForSlot(ports.slot));
  assert.deepEqual(await readdir(reservationRoot), [`slot-${ports.slot}`]);
  await ports.release();
  assert.deepEqual(await readdir(reservationRoot), []);
});

test("a saved slot with a free Website port is kept and reserved", async () => {
  const { options, runtimeFile, reservationRoot } = await setup({ savedSlot: 4 });
  const ports = await ensureWorktreePorts(options);

  assert.equal(ports.frontendPort, portsForSlot(4).frontendPort);
  assert.equal((await savedState(runtimeFile)).slot, 4);
  assert.deepEqual(await readdir(reservationRoot), ["slot-4"]);
  await ports.release();
});

test("a saved slot reserved by another worktree's run is replaced, though its port is still free", async () => {
  const { options, runtimeFile } = await setup({ savedSlot: 4 });
  // Another worktree's run reserved slot 4 and has not bound the port yet.
  const other = await setup();
  const blocker = await ensureWorktreePorts({
    worktreeRoot: other.worktreeRoot,
    reservationRoot: options.reservationRoot,
    runtimeFile: await writeSlot(other.worktreeRoot, 4),
    probe: async () => true,
    log: () => {},
  });
  assert.equal(blocker.slot, 4);

  const ports = await ensureWorktreePorts(options);
  assert.notEqual(ports.slot, 4);
  assert.deepEqual(await savedState(runtimeFile), portsForSlot(ports.slot));
  await ports.release();
  await blocker.release();
});

test("a second run in the same worktree is refused while the first holds the slot", async () => {
  const { options } = await setup({ savedSlot: 4 });
  const first = await ensureWorktreePorts(options);

  await assert.rejects(ensureWorktreePorts(options), /another run in this worktree/);
  await first.release();
});

test("a second run is refused after the first has bound the Website port", async () => {
  const { options } = await setup({ savedSlot: 4 });
  const first = await ensureWorktreePorts(options);

  await assert.rejects(
    ensureWorktreePorts({
      ...options,
      probe: async (port) => port !== portsForSlot(4).frontendPort,
    }),
    /another run in this worktree/,
  );
  await first.release();
});

test("the reservation is held while the command runs and released after it", async () => {
  const { options, reservationRoot } = await setup();
  let reservedDuringRun;
  const code = await runWithWorktreePorts({
    command: "playwright",
    args: ["test"],
    environment: {},
    ensure: () => ensureWorktreePorts(options),
    run: async () => {
      reservedDuringRun = await readdir(reservationRoot);
      return 3;
    },
  });

  assert.equal(code, 3);
  assert.equal(reservedDuringRun.length, 1);
  assert.deepEqual(await readdir(reservationRoot), []);
});

test("the reservation is released when the command fails to start", async () => {
  const { options, reservationRoot } = await setup();
  await assert.rejects(
    runWithWorktreePorts({
      command: "missing",
      environment: {},
      ensure: () => ensureWorktreePorts(options),
      run: async () => {
        throw new Error("spawn missing ENOENT");
      },
    }),
    /ENOENT/,
  );
  assert.deepEqual(await readdir(reservationRoot), []);
});

test("CI and an explicit port run the command without a slot", async () => {
  for (const environment of [{ CI: "1" }, { PLAYWRIGHT_PORT: "4000" }]) {
    const code = await runWithWorktreePorts({
      command: "playwright",
      environment,
      ensure: () => assert.fail("no slot is assigned"),
      run: async () => 0,
    });
    assert.equal(code, 0);
  }
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

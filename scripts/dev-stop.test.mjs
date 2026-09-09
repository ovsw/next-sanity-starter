import assert from "node:assert/strict";
import test from "node:test";
import { findServers, isDevCommand, parseArgs, selectServers, signalIfSameProcess } from "./dev-stop.mjs";

test("shells that mention dev commands are not server launchers", () => {
  assert.equal(isDevCommand("bash -c node next dev"), false);
  assert.equal(isDevCommand("/usr/bin/node /repo/node_modules/.bin/next dev --port 3000"), true);
  assert.equal(isDevCommand("pnpm --dir studio exec sanity dev"), true);
});

test("all and port selection stay within registered worktrees", async () => {
  const processes = new Map([1, 2, 3, 4].map((pid) => [pid, {
    pid, ppid: 0, args: "node next dev --port 3000", rssKb: 0,
  }]));
  const cwd = { 1: "/repo/frontend", 2: "/other/frontend", 3: "/repo-copy/frontend", 4: "/linked/studio" };
  const servers = await findServers(processes, new Set(["/repo", "/linked"]), async (pid) => cwd[pid]);
  assert.deepEqual(servers.map((s) => s.root.pid), [1, 4]);
  assert.equal(selectServers(servers, parseArgs(["--all"])).length, 2);
  assert.equal(selectServers(servers, parseArgs(["--port", "3000"])).length, 2);
  assert.deepEqual(selectServers(servers, parseArgs(["--here"]), "/repo").map((s) => s.root.pid), [1]);
});

test("unknown cwd fails closed and listing selects nothing", async () => {
  const processes = new Map([[12, { pid: 12, ppid: 0, args: "next dev", rssKb: 0 }]]);
  assert.deepEqual(await findServers(processes, new Set(["/repo"]), async () => undefined), []);
  assert.deepEqual(selectServers([{ port: 3000 }], parseArgs([])), []);
  for (const port of ["0", "65536", "NaN"]) assert.throws(() => parseArgs(["--port", port]));
});

test("PID reuse and unreadable identity prevent signals", async () => {
  const calls = [];
  const send = (...args) => calls.push(args);
  await signalIfSameProcess(12, "old", "SIGKILL", async () => "new", send);
  await signalIfSameProcess(12, undefined, "SIGTERM", async () => undefined, send);
  assert.deepEqual(calls, []);
  await signalIfSameProcess(12, "same", "SIGTERM", async () => "same", send);
  assert.deepEqual(calls, [[12, "SIGTERM"]]);
});

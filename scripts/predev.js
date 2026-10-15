#!/usr/bin/env node
/*
 * predev hook for `npm run dev`.
 *
 * History: the previous "fix" for the homepage SVG alignment regression
 * (large SVGs because Tailwind classes weren't loading) was a `predev`
 * script that cleared `.next/`. That alone was not durable: when a
 * previous `next dev` was still running on port 3000, the new dev
 * silently fell back to a different port, and the OLD dev server kept
 * serving stale assets from a now-cleared `.next/`. The browser hit
 * 404s for /_next/static/css/.../layout.css, Tailwind utilities never
 * resolved, and every SVG that relied on Tailwind `h-X w-X` classes
 * (instead of intrinsic width/height attributes) rendered at the
 * container's full width.
 *
 * The fix is two layers, both run here:
 *
 *   1. Kill any orphan `next dev` / `next-server` process listening on
 *      the port we want (default 3000). We do NOT kill arbitrary
 *      processes — we only target processes that are clearly Next.js.
 *      This guarantees the new `next dev` can bind the port and serve
 *      from a fresh `.next/`.
 *
 *   2. Clear `.next/`. With no orphan server holding the port, this
 *      leaves the new `next dev` to start from a clean slate.
 *
 * This script is intentionally OS-portable: it works on Windows
 * (taskkill + netstat), macOS (lsof), and Linux (lsof / fuser / ss).
 *
 * Exit codes:
 *   0 — clean; `next dev` should now start successfully.
 *   non-zero — something failed; we do NOT block `next dev` from
 *   starting. A warning is printed to stderr and the script returns 0
 *   so the dev server can still start (the orphan-kill is best-effort).
 */

"use strict";

const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const PRIMARY_PORT = Number(process.env.PORT || 3000);
// `next dev` cascades to 3001, 3002, ... when its preferred port is
// in use. Each prior run leaves an orphan on a different port. Scan a
// reasonable range so the new dev can pick up the first available
// port, not necessarily PRIMARY_PORT.
const PORT_SCAN_RANGE = Number(process.env.PREDEV_PORT_SCAN_RANGE || 20);
const PROJECT_ROOT = process.cwd();
const IS_WINDOWS = os.platform() === "win32";

function log(msg) {
  process.stderr.write(`[predev] ${msg}\n`);
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      ...opts,
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

/**
 * Find PIDs listening on the given TCP port. Returns an array of
 * numeric PIDs (as strings), or [] on failure.
 */
function findPidsOnPort(port) {
  if (IS_WINDOWS) {
    // `netstat -ano` lists every TCP socket, one per line. We match
    // lines that look like `... :<port> ... LISTENING <pid>`.
    const out = run("netstat -ano -p TCP");
    if (!out) return [];
    const want = `:${port} `;
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes(want)) continue;
      if (!/LISTENING/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
    }
    return Array.from(pids);
  }

  // macOS / Linux: prefer `lsof -nP -iTCP:<port> -sTCP:LISTEN -t`.
  // Returns PIDs one per line. If `lsof` is missing, fall back to `ss`.
  let out = run(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null`);
  if (out) {
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s));
  }
  out = run(`ss -lntp 'sport = :${port}' 2>/dev/null`);
  if (out) {
    const pids = new Set();
    for (const m of out.matchAll(/pid=(\d+)/g)) pids.add(m[1]);
    return Array.from(pids);
  }
  return [];
}

/**
 * Is the given PID a Next.js process? We use a short, conservative
 * check: on Windows we read the process command line via PowerShell
 * (CIM); on Linux we read `/proc/<pid>/cmdline`. We look for the
 * substring `next` as a path segment (followed by `\`, `/`, or end
 * of string) so we match `node_modules\next\dist\...` but not, e.g.,
 * `Microsoft VS Code`.
 *
 * Note: wmic is deprecated on modern Windows; PowerShell's
 * Get-CimInstance works on every supported Windows version.
 */
function isNextProcess(pid) {
  let cmdline = "";
  if (IS_WINDOWS) {
    const out = run(
      `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\" | Select-Object -ExpandProperty CommandLine"`
    );
    cmdline = out;
  } else {
    try {
      cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
    } catch {
      cmdline = "";
    }
  }
  if (!cmdline) return false;
  // Match `next` as a path segment or as the `next-server` helper.
  // Tolerate either Windows (`\`) or POSIX (`/`) separators.
  return /(^|[\\/])next([\\/]|-|$)/i.test(cmdline) || /next-server/i.test(cmdline);
}

function killPid(pid) {
  if (IS_WINDOWS) {
    // /T = also kill child processes (next-server is a child of next).
    spawnSync("taskkill", ["/F", "/T", "/PID", pid], { stdio: "ignore" });
  } else {
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {
      /* already gone */
    }
  }
}

function killOrphans() {
  // Scan PRIMARY_PORT and a few subsequent ports (where cascade
  // orphans usually live). We dedupe PIDs across ports — a single
  // process is only killed once.
  const seenPids = new Set();
  let totalKilled = 0;

  for (let offset = 0; offset < PORT_SCAN_RANGE; offset += 1) {
    const port = PRIMARY_PORT + offset;
    const pids = findPidsOnPort(port);
    for (const pid of pids) {
      if (seenPids.has(pid)) continue;
      seenPids.add(pid);
      let isNext = false;
      try {
        isNext = isNextProcess(pid);
      } catch {
        isNext = false;
      }
      if (!isNext) {
        log(`pid ${pid} is listening on :${port} but is not a Next process; leaving alone.`);
        continue;
      }
      log(`killing orphan next dev (pid ${pid}) on :${port}`);
      killPid(pid);
      totalKilled += 1;
    }
  }
  if (totalKilled === 0) {
    log(
      `no orphan Next dev servers found in :${PRIMARY_PORT}–:${PRIMARY_PORT + PORT_SCAN_RANGE - 1}.`
    );
  } else {
    // Give the OS a moment to release the ports. 500ms is enough on
    // every platform we test on; we cap at 3s.
    const waitMs = Math.min(3000, 250 * totalKilled);
    const deadline = Date.now() + waitMs;
    while (Date.now() < deadline) {
      if (findPidsOnPort(PRIMARY_PORT).length === 0) break;
    }
  }
}

/**
 * Are there any Next-related processes still alive that we did NOT kill?
 * Killing is restricted to processes listening on :3000-3019 (the dev
 * port cascade). If a `next start` is running on another port (e.g.
 * :4000), or a `next build` worker is still alive, they hold `.next/`
 * files open and we MUST NOT delete them out from under those
 * processes. This function enumerates every process whose command line
 * is clearly a `next` invocation and returns their PIDs.
 */
function findStrayNextProcesses() {
  let out = "";
  if (IS_WINDOWS) {
    out = run(
      'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -match \'next[\\\\/]\' -or $_.CommandLine -match \'next-server\') } | Select-Object -ExpandProperty ProcessId"'
    );
  } else {
    out = run("ps -eo pid,args");
    if (out) {
      const stray = [];
      for (const line of out.split(/\r?\n/)) {
        if (!/(^|[\\/])next([\\/]|-|$)/i.test(line)) continue;
        if (/next-server/i.test(line)) {
          stray.push(line.trim().split(/\s+/)[0]);
        } else if (/^\s*\d+\s+(node\s+)?.*next\b/i.test(line)) {
          stray.push(line.trim().split(/\s+/)[0]);
        }
      }
      return stray;
    }
  }
  if (!out) return [];
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s));
}

function clearNext() {
  const target = path.join(PROJECT_ROOT, ".next");
  try {
    fs.rmSync(target, { recursive: true, force: true });
    log("cleared .next/");
  } catch (err) {
    log(`failed to clear .next/: ${err.message}`);
  }
}

function main() {
  killOrphans();
  // After killing port-bound orphans, check for any other Next-related
  // process (e.g. `next start` on a non-default port, or a build
  // worker). We MUST NOT delete `.next/` while those are running,
  // because they hold build artifacts open. The predev hook is only
  // meant to clean up before `next dev`; if anything else is still
  // touching `.next/`, surface a clear warning and skip the clear.
  const strays = findStrayNextProcesses();
  if (strays.length > 0) {
    log(
      `refusing to clear .next/: ${strays.length} other Next process(es) still running ` +
        `(pids: ${strays.join(", ")}). These may hold .next/ files open. ` +
        `Stop them manually if you want a clean dev start.`
    );
    return;
  }
  clearNext();
}

main();

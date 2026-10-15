#!/usr/bin/env node
/*
 * prebuild hook for `npm run build`.
 *
 * `next build` writes its output to `.next/`. If a `next dev` server
 * is currently running, it has `.next/` open in memory and on disk.
 * The build will overwrite those files partway through. The dev server
 * then serves HTML whose asset URLs reference filenames that no longer
 * match the on-disk dev bundles, and the browser sees 404s for
 * `layout.css`, `main-app.js`, etc. This is the exact symptom the user
 * reported on 2026-10-15 and which locked in via
 * `tests/unit/homepage-regression.test.ts`.
 *
 * To prevent that footgun, this script:
 *   - scans :3000-3019 for any `next`-related process,
 *   - and if one is running, REFUSES to start `next build` until the
 *     user explicitly stops the dev server. We do not kill it because
 *     the user may be actively using it.
 *
 * Exit codes:
 *   0 — clear, proceed with `next build`.
 *   non-zero — abort `npm run build` (npm will halt with an error).
 *
 * The script never modifies `.next/` itself. It is read-only.
 */

"use strict";

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");

const PRIMARY_PORT = Number(process.env.PORT || 3000);
const PORT_SCAN_RANGE = Number(process.env.PREBUILD_PORT_SCAN_RANGE || 20);
const IS_WINDOWS = os.platform() === "win32";

function log(msg) {
  process.stderr.write(`[prebuild] ${msg}\n`);
}

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function findPidsOnPort(port) {
  if (IS_WINDOWS) {
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

function isNextProcess(pid) {
  let cmdline = "";
  if (IS_WINDOWS) {
    cmdline = run(
      `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\" | Select-Object -ExpandProperty CommandLine"`
    );
  } else {
    try {
      cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
    } catch {
      return false;
    }
  }
  if (!cmdline) return false;
  return /(^|[\\/])next([\\/]|-|$)/i.test(cmdline) || /next-server/i.test(cmdline);
}

function main() {
  const blocking = [];
  for (let offset = 0; offset < PORT_SCAN_RANGE; offset += 1) {
    const port = PRIMARY_PORT + offset;
    for (const pid of findPidsOnPort(port)) {
      if (isNextProcess(pid)) {
        blocking.push({ pid, port });
      }
    }
  }
  if (blocking.length === 0) {
    return;
  }
  const detail = blocking.map((b) => `(pid ${b.pid} on :${b.port})`).join(", ");
  log(`refusing to run \`next build\`: a dev/start server is still running ${detail}.`);
  log(
    `Stop it with \`taskkill /F /T /PID <pid>\` (Windows) or \`kill <pid>\` (POSIX), ` +
      `or via the process that launched it, then re-run \`npm run build\`.`
  );
  process.exit(1);
}

main();

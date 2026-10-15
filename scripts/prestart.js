#!/usr/bin/env node
/*
 * prestart hook for `npm start`.
 *
 * Production-mode entry point. We DO NOT clear `.next/` here: the
 * build output in `.next/` is what `next start` serves. Clearing it
 * would force a rebuild or break the start. The historical
 * `prestart` one-liner that did clear `.next/` was a leftover from
 * a pre-build workflow and has been removed.
 *
 * If the build is missing or incomplete, surface a clear, actionable
 * error here rather than letting `next start` produce a confusing
 * "page not found" or "ENOENT" message.
 *
 * This script is read-only. It never modifies `.next/`.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const NEXT_DIR = path.join(process.cwd(), ".next");
const BUILD_ID = path.join(NEXT_DIR, "BUILD_ID");

function fail(msg) {
  process.stderr.write(`[prestart] ${msg}\n`);
  process.exit(1);
}

if (!fs.existsSync(NEXT_DIR)) {
  fail(
    ".next/ is missing. `npm start` requires a prior `npm run build`. " +
      "Run `npm run build` first, then re-run `npm start`."
  );
}
if (!fs.existsSync(BUILD_ID)) {
  fail(
    ".next/BUILD_ID is missing. The build appears to be incomplete or " +
      "was cleared. Run `npm run build` to produce a complete build, " +
      "then re-run `npm start`."
  );
}

// Build is present. Let `next start` take over.
process.exit(0);

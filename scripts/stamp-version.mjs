#!/usr/bin/env node
// Write a release tag into every element marked data-version / data-version-bare.
//
// The deploy workflow runs this with the latest stokaro/ptah release before the
// pages are uploaded, so the HTML a visitor receives already carries the current
// version. In the browser, assets/site.js still asks the GitHub API for the
// latest release; when that request fails (offline, rate limit), the value
// stamped here is what stays on the page.
//
// Usage: node scripts/stamp-version.mjs v1.2.3 [--check]
//   --check  verify that the files carry the given tag; change nothing.

import { readFileSync, writeFileSync } from "node:fs";

const PAGES = ["index.html", "install/index.html", "404.html", "sessions/index.html"];
const TAG_RE = /^v\d+\.\d+\.\d+$/;

const args = process.argv.slice(2);
const check = args.includes("--check");
const tag = args.find((a) => !a.startsWith("--"));

if (!tag || !TAG_RE.test(tag)) {
  console.error(`stamp-version: expected a tag like v1.2.3, got ${JSON.stringify(tag ?? "")}`);
  process.exit(2);
}
const bare = tag.slice(1);

// data-version holds "vX.Y.Z"; data-version-bare holds "X.Y.Z". The lookahead
// keeps the first pattern from matching the start of the second attribute.
const FULL = /(<[^>]*\bdata-version(?![\w-])[^>]*>)v\d+\.\d+\.\d+(?=<\/)/g;
const BARE = /(<[^>]*\bdata-version-bare\b[^>]*>)\d+\.\d+\.\d+(?=<\/)/g;

let failed = false;
for (const page of PAGES) {
  const before = readFileSync(page, "utf8");
  let full = 0;
  let bareCount = 0;
  const after = before
    .replace(FULL, (_, open) => (full++, `${open}${tag}`))
    .replace(BARE, (_, open) => (bareCount++, `${open}${bare}`));
  if (full === 0) {
    console.error(`stamp-version: ${page} has no data-version element`);
    failed = true;
    continue;
  }
  if (check) {
    if (after !== before) {
      console.error(`stamp-version: ${page} does not carry ${tag}`);
      failed = true;
    }
    continue;
  }
  if (after !== before) writeFileSync(page, after);
  console.log(`stamp-version: ${page}: ${full} version, ${bareCount} bare -> ${tag}`);
}
process.exit(failed ? 1 : 0);

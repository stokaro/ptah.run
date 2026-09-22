#!/usr/bin/env node
/* What the deploy publishes: every local href and src on a built page names a
 * file that exists in dist/, no page carries a github.io address, and CNAME
 * still names the production domain. Run `npm run build` first. */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const pages = readdirSync(dist, { recursive: true }).filter((p) => p.endsWith(".html"));
const problems = [];
let references = 0;
for (const page of pages) {
  const html = readFileSync(join(dist, page), "utf8");
  for (const [, path] of html.matchAll(/(?:href|src)="\/([^"#?]*)/g)) {
    references++;
    const target = join(dist, path);
    const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, "index.html")));
    if (!ok) problems.push(`dist/${page}: references /${path}, which does not exist`);
  }
  if (/github\.io/.test(html)) problems.push(`dist/${page}: carries a github.io address; the pages use ptah.run addresses`);
}
const cname = readFileSync(join(dist, "CNAME"), "utf8").trim();
if (cname !== "ptah.run") problems.push(`dist/CNAME names ${cname}, not ptah.run`);
// Floors, so a build that wrote nothing is not a clean result.
if (pages.length < 18) problems.push(`only ${pages.length} pages in dist/`);
if (references < 300) problems.push(`only ${references} local references across the pages`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`check-links: ${pages.length} pages, ${references} local references, all present`);

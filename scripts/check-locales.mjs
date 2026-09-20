#!/usr/bin/env node
/* Hold the English and Japanese trees to the same shape.
 *
 * A translated page goes stale quietly. Nothing about a hand-edited copy says
 * that the page it was copied from has gained a tab, changed an install
 * command, moved a link or dropped a version stamp -- the copy still renders,
 * still passes every other check here, and is wrong. So the parts that must
 * not differ are compared rather than trusted:
 *
 *   - every page is in a pair, or is named below with the reason it is not;
 *   - a page says which language it is in and where its counterpart is, and
 *     the counterpart says the same back;
 *   - both halves carry the same commands, the same links, the same controls
 *     and the same number of version stamps;
 *   - the release stamp reaches every page that asks for one;
 *   - the sitemap lists what exists and nothing else;
 *   - a Japanese page gives the reading プタハ once and then uses Ptah.
 *
 * The transcripts are not compared here: scripts/build-runs.mjs writes both
 * in-practice pages and both home transcripts out of assets/runs.js, so there
 * is nothing on that side to drift.
 *
 *   node scripts/check-locales.mjs
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Ask git, not the filesystem: a walk would descend into any checkout parked
// under the repository and report another branch's pages as this one's.
function trackedPages() {
  const out = execFileSync("git", ["ls-files", "*.html"], { cwd: root, encoding: "utf8" });
  return out.split("\n").filter(Boolean).sort();
}

// A page that is deliberately not in a pair, and why. Anything else that is
// not in a pair is a page somebody forgot.
const UNPAIRED = {
  "404.html":
    "GitHub Pages answers every unknown address on the domain with this one document, /ja/ included, so a copy under /ja/ would never be served to anybody. The page carries both languages instead.",
  "testkit/index.html":
    "A go-import vanity page for `go get ptah.run/testkit`, read by the go tool and then redirected past. It has no prose and no reader to translate for."
};

const PREFIX = "ja/";
const problems = [];
const fail = (page, message) => problems.push(`${page}: ${message}`);

// A page git knows about but the working tree does not is a half-finished
// delete. Report it rather than dying on the read: the message that says which
// file is gone is the whole value of running this.
const source = new Map();
const missing = [];
for (const page of trackedPages()) {
  try {
    source.set(page, readFileSync(join(root, page), "utf8"));
  } catch {
    missing.push(page);
  }
}
for (const page of missing) {
  problems.push(`${page}: git tracks this page but it is not in the working tree`);
}
const pages = [...source.keys()];

const has = (p) => source.has(p);
const isJapanese = (p) => p.startsWith(PREFIX);
const counterpart = (p) => (isJapanese(p) ? p.slice(PREFIX.length) : PREFIX + p);

// index.html -> /, install/index.html -> /install/, ja/index.html -> /ja/
const urlPath = (p) => "/" + p.replace(/index\.html$/, "");

/* ---------- Reading a page ---------- */

const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const count = (html, re) => all(html, re).length;

// Links, with the fragment and the query dropped: what matters is that both
// halves point at the same places, not that they spell an anchor alike.
function links(html) {
  return new Set(
    all(html, /(?:href|src)="([^"]+)"/g)
      .map((href) => href.split("#")[0].split("?")[0])
      .filter(Boolean)
  );
}

// The one file a Japanese page loads that its counterpart does not: the run
// narration. It is checked on its own below, because it is the one asymmetry
// between the trees that is meant to be there.
const NARRATION = "/assets/runs.ja.js";

// The same set, with the Japanese tree's own prefix taken off, so a pair's
// links can be compared as the one set of destinations they should be.
function destinations(html) {
  return new Set(
    [...links(html)]
      .filter((href) => href !== NARRATION)
      .map((href) => (href.startsWith("/ja/") ? href.slice(3) : href))
  );
}

const copyable = (html) => new Set(all(html, /data-copy-text="([^"]*)"/g));
const tabs = (html) => new Set(all(html, /data-tab="([^"]+)"/g));
const scenarios = (html) => new Set(all(html, /data-demo-scenario="([^"]+)"/g));
const anchors = (html) => new Set(all(html, /\sid="([^"]+)"/g));

function differ(what, a, b, sides) {
  const [inA, inB] = sides || ["only in the English page", "only in the Japanese page"];
  const onlyA = [...a].filter((x) => !b.has(x));
  const onlyB = [...b].filter((x) => !a.has(x));
  if (!onlyA.length && !onlyB.length) return null;
  const parts = [];
  if (onlyA.length) parts.push(`${inA}: ${onlyA.join(", ")}`);
  if (onlyB.length) parts.push(`${inB}: ${onlyB.join(", ")}`);
  return `${what} -- ${parts.join("; ")}`;
}

/* ---------- Every page is in a pair, or says why not ---------- */

for (const page of pages) {
  if (UNPAIRED[page]) continue;
  const other = counterpart(page);
  if (!has(other)) {
    fail(
      page,
      `has no counterpart at ${other}. Write it, or name the page in UNPAIRED in this script with the reason it stands alone.`
    );
  }
}

/* ---------- What a page says about itself ---------- */

for (const page of pages) {
  const html = source.get(page);
  const want = isJapanese(page) ? "ja" : "en";
  const declared = /<html lang="([^"]+)"/.exec(html);
  if (!declared) fail(page, "has no lang attribute on <html>");
  else if (declared[1] !== want) {
    fail(page, `says lang="${declared[1]}" but sits in the ${want} tree`);
  }
}

/* ---------- The pair points both ways ---------- */

for (const page of pages) {
  if (UNPAIRED[page]) continue;
  const other = counterpart(page);
  if (!has(other)) continue;
  const html = source.get(page);
  const english = isJapanese(page) ? other : page;
  const japanese = isJapanese(page) ? page : other;
  const wanted = {
    en: `https://ptah.run${urlPath(english)}`,
    ja: `https://ptah.run${urlPath(japanese)}`,
    "x-default": `https://ptah.run${urlPath(english)}`
  };
  for (const [tag, href] of Object.entries(wanted)) {
    const re = new RegExp(`<link rel="alternate" hreflang="${tag}" href="([^"]+)">`);
    const found = re.exec(html);
    if (!found) fail(page, `has no hreflang="${tag}" alternate`);
    else if (found[1] !== href) {
      fail(page, `hreflang="${tag}" points at ${found[1]}, expected ${href}`);
    }
  }
  const canonical = /<link rel="canonical" href="([^"]+)">/.exec(html);
  const ownURL = `https://ptah.run${urlPath(page)}`;
  if (!canonical) fail(page, "has no canonical link");
  else if (canonical[1] !== ownURL) {
    fail(page, `is canonical to ${canonical[1]}, expected ${ownURL}`);
  }
}

/* ---------- The switch is on every page, and goes to the same page ---------- */

for (const page of pages) {
  const html = source.get(page);
  // A page with no site header has no switch to carry. Only a page that is
  // already excused from pairing may be in that state, so losing the header
  // from a real page is still a finding rather than a skipped check.
  if (!html.includes('<header class="site-header">')) {
    if (!UNPAIRED[page]) {
      fail(page, "carries no site header, so a reader cannot reach the other language from it");
    }
    continue;
  }
  const found = /<a class="icon-btn lang-btn" href="([^"]+)"/.exec(html);
  if (!found) {
    fail(page, "has no language switch in the header");
    continue;
  }
  // The 404 has no counterpart to point at, so it offers the other tree's
  // home; every other page owes the reader their own page in the other
  // language, because a switch that lands on the front door loses their place.
  const wanted = UNPAIRED[page] ? "/ja/" : urlPath(counterpart(page));
  if (found[1] !== wanted) {
    fail(page, `the language switch goes to ${found[1]}, expected ${wanted}`);
  }
}

/* ---------- Neither half may lose what the other one carries ---------- */

for (const page of pages) {
  if (isJapanese(page) || UNPAIRED[page]) continue;
  const other = counterpart(page);
  if (!has(other)) continue;
  const en = source.get(page);
  const ja = source.get(other);
  const seen = [
    differ("the commands offered for copying differ", copyable(en), copyable(ja)),
    differ("the destinations linked to differ", destinations(en), destinations(ja)),
    differ("the install tabs differ", tabs(en), tabs(ja)),
    differ("the recorded runs on the page differ", scenarios(en), scenarios(ja)),
    differ(
      "the element ids the stylesheet and the script address differ",
      anchors(en),
      anchors(ja)
    )
  ].filter(Boolean);
  for (const message of seen) fail(`${page} / ${other}`, message);

  for (const attribute of ["data-version", "data-version-bare"]) {
    const re = new RegExp(`\\b${attribute}(?![\\w-])`, "g");
    const inEnglish = count(en, re);
    const inJapanese = count(ja, re);
    if (inEnglish !== inJapanese) {
      fail(
        `${page} / ${other}`,
        `${attribute} appears ${inEnglish} time(s) in the English page and ${inJapanese} in the Japanese one; the release stamp would land in different places`
      );
    }
  }
}

/* ---------- A Japanese page that plays a run carries the narration ---------- */

// Without assets/runs.ja.js the player still runs: the sessions are in
// assets/runs.js and would simply be narrated in English, on a page that is
// otherwise Japanese. That is exactly the kind of half-translated page nothing
// else here would notice.
for (const page of pages) {
  if (!isJapanese(page)) continue;
  const html = source.get(page);
  if (!links(html).has("/assets/runs.js")) continue;
  if (!links(html).has(NARRATION)) {
    fail(page, `loads the recorded runs but not ${NARRATION}, so the demo would narrate in English`);
  }
}

/* ---------- The release stamp reaches every page that asks for one ---------- */

const stamper = readFileSync(join(root, "scripts", "stamp-version.mjs"), "utf8");
const declared = /const PAGES = \[([\s\S]*?)\];/.exec(stamper);
if (!declared) {
  problems.push("scripts/stamp-version.mjs: cannot find its PAGES list");
} else {
  const listed = new Set(all(declared[1], /"([^"]+)"/g));
  const wants = new Set(pages.filter((p) => /\bdata-version(?![\w-])/.test(source.get(p))));
  for (const p of wants) {
    if (!listed.has(p)) {
      fail("scripts/stamp-version.mjs", `does not list ${p}, which carries a data-version element`);
    }
  }
  for (const p of listed) {
    if (!has(p)) fail("scripts/stamp-version.mjs", `lists ${p}, which is not a tracked page`);
    else if (!wants.has(p)) {
      fail("scripts/stamp-version.mjs", `lists ${p}, which has no data-version element to stamp`);
    }
  }
}

/* ---------- The sitemap lists what exists ---------- */

const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
const listed = new Set(all(sitemap, /<loc>([^<]+)<\/loc>/g));
const indexable = new Set(
  pages
    .filter((p) => !/<meta name="robots" content="noindex">/.test(source.get(p)))
    .map((p) => `https://ptah.run${urlPath(p)}`)
);
const sitemapDiff = differ("does not match the pages that exist", indexable, listed, [
  "a page nothing lists",
  "a listing with no page"
]);
if (sitemapDiff) problems.push(`sitemap.xml: ${sitemapDiff}`);

/* ---------- The reading is given once ---------- */

const READING = "Ptah（プタハ）";
const KANA = /プタハ/g;

for (const page of pages) {
  const html = source.get(page);
  const occurrences = (html.match(KANA) || []).length;
  const japanese = isJapanese(page) || occurrences > 0;
  if (!japanese) continue;
  if (occurrences === 0) {
    fail(page, `never gives the reading: write ${READING} at the first mention`);
  } else if (occurrences > 1) {
    fail(
      page,
      `gives the reading ${occurrences} times: ${READING} belongs at the first mention only, and every mention after it is the Latin Ptah`
    );
  } else if (!html.includes(READING)) {
    fail(page, `spells the reading some other way; it is written ${READING}`);
  }
}

/* ---------- Report ---------- */

if (problems.length) {
  console.error("the two language trees have drifted apart:");
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(
  `${pages.length} pages checked: ${pages.length - Object.keys(UNPAIRED).length} in pairs, ${Object.keys(UNPAIRED).length} standing alone with a reason`
);

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
 *   - the switch between them says what pressing it does, in the language of
 *     the page it sits on;
 *   - both halves carry the same commands -- the ones a button hands over and
 *     the ones only written down -- the same controls, and the same number of
 *     version stamps;
 *   - both halves reach the same places, each inside its own tree, so a
 *     Japanese page cannot quietly send its reader into the English one;
 *   - the release stamp reaches every page that asks for one;
 *   - the sitemap lists what exists and nothing else;
 *   - a Japanese page gives the reading プタハ once, in prose, before the
 *     first place it writes Ptah.
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

// The links that cross the trees on purpose: the canonical, the hreflang
// alternates, and the language switch. Every one of them is asserted exactly,
// by value, in its own section above. Left in, they would make each pair
// differ by the two halves of its own switch -- and paying for that with a
// rule that flattened /ja/ off both sides is what let a Japanese page link
// into the English tree and still compare equal.
const CROSSING = /<link rel="(?:canonical|alternate)"[^>]*>|<a class="icon-btn lang-btn"[^>]*>/g;

// Where a page sends its reader, the crossing links removed. The Japanese
// spelling is kept: /ja/install/ is not /install/, and a comparison that
// cannot tell them apart cannot see the defect it exists for. The English
// side is moved into the Japanese tree before the two are compared, by the
// localized map below.
function destinations(html) {
  return new Set(
    all(html.replace(CROSSING, ""), /(?:href|src)="([^"]+)"/g)
      .map((href) => href.split("#")[0].split("?")[0])
      .filter((href) => href && href !== NARRATION)
  );
}

const copyable = (html) => new Set(all(html, /data-copy-text="([^"]*)"/g));
const tabs = (html) => new Set(all(html, /data-tab="([^"]+)"/g));
const scenarios = (html) => new Set(all(html, /data-demo-scenario="([^"]+)"/g));
const anchors = (html) => new Set(all(html, /\sid="([^"]+)"/g));

const CODE_BLOCK = /<(code|pre)\b([^>]*)>([\s\S]*?)<\/\1>/g;

// Written by scripts/build-runs.mjs out of assets/runs.js and
// assets/runs.ja.js. Both trees come out of one run and `build-runs.mjs
// --check` fails when it has not been made, so the generator owns these and a
// second comparison here would only report its translated narration.
const GENERATED = /\bdata-demo-transcript\b|\bdata-demo-screen\b|\btile-transcript\b/;

// Element text, tags dropped and the entities a page actually writes decoded.
// &amp; goes last: decoding it first would turn &amp;lt; into a `<`.
const textOf = (markup) =>
  markup
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");

// Every command, flag, path, file name and environment variable a page writes
// in a <code> or a <pre>, one entry per line.
//
// data-copy-text is the handful a button hands over -- the install page
// offers three that way and writes forty more that a reader retypes. Those
// forty are the prose that has to be updated by hand when install.sh changes
// upstream, which makes them the ones most likely to be updated in one tree
// only.
//
// A line whose first character is `#` is dropped. On these pages a shell
// comment is the demo's own narration rather than anything Ptah reads, so it
// is prose and is translated; a comment after a command stays, and takes its
// command with it. `read` counts the blocks this looked inside, held to a
// floor at the end so an extraction that stopped matching cannot pass as a
// page with nothing to say.
function literals(html) {
  const lines = new Set();
  let read = 0;
  for (const block of html.matchAll(CODE_BLOCK)) {
    if (GENERATED.test(block[2])) continue;
    read += 1;
    for (const raw of textOf(block[3]).split("\n")) {
      const line = raw.trim();
      if (line && !line.startsWith("#")) lines.add(line);
    }
  }
  return { lines, read };
}

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

// Kana or a CJK ideograph: enough to tell which language a short label was
// written in, and it stays true of a label somebody rewords.
const JAPANESE_TEXT = /[぀-ヿ一-鿿]/;

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
  // The switch wears the name of the other language, and a name is not an
  // action: with nothing else to go on, a screen reader announces "English"
  // on a Japanese page, which reads as a link to English documentation rather
  // than as this page in English. So the switch carries a label that says
  // what pressing it does -- written in the language of the page it sits on,
  // because that is the voice the reader has turned on. Every other control in
  // the header is labelled; this one was the exception.
  const labelled = /<a class="icon-btn lang-btn"[^>]*\saria-label="([^"]*)"/.exec(html);
  if (!labelled || !labelled[1].trim()) {
    fail(
      page,
      "the language switch has no aria-label, so all a screen reader can announce is the name of the other language"
    );
  } else if (JAPANESE_TEXT.test(labelled[1]) !== isJapanese(page)) {
    fail(
      page,
      `the language switch is labelled "${labelled[1]}", which is not the language of this page: the label is read out by the reader's own voice, so it is written in the language the page is in`
    );
  }
}

/* ---------- Neither half may lose what the other one carries ---------- */

// Every address that has a page of its own in each tree: / -> /ja/,
// /install/ -> /ja/install/. Derived from the pairs rather than written out,
// so a page added to both trees joins it by existing.
const localized = new Map(
  pages
    .filter((p) => !isJapanese(p) && !UNPAIRED[p] && has(counterpart(p)))
    .map((p) => [urlPath(p), urlPath(counterpart(p))])
);
// A destination as the Japanese page should spell it. An address with no page
// of its own -- an asset, the docs, GitHub -- is the same string in both.
const inJapaneseTree = (href) => localized.get(href) ?? href;

// What the whole run looked at, held to a floor below. A comparison whose
// corpus emptied out finds no differences and reads exactly like a clean one.
let blocksRead = 0;
let linesCompared = 0;

for (const page of pages) {
  if (isJapanese(page) || UNPAIRED[page]) continue;
  const other = counterpart(page);
  if (!has(other)) continue;
  const en = source.get(page);
  const ja = source.get(other);
  const written = literals(en);
  blocksRead += written.read;
  linesCompared += written.lines.size;
  const seen = [
    differ("the commands offered for copying differ", copyable(en), copyable(ja)),
    differ(
      "the commands, flags and paths written on the page differ",
      written.lines,
      literals(ja).lines
    ),
    differ(
      "the destinations linked to differ",
      new Set([...destinations(en)].map(inJapaneseTree)),
      destinations(ja),
      [
        "reached from the English page, and the Japanese one does not reach it (Japanese spelling shown)",
        "reached from the Japanese page, and the English one does not"
      ]
    ),
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

// The floors are what the pairs hold today, with room to rewrite a page: 69
// blocks and 97 lines on the English side. A markup change that puts the code
// blocks out of reach of CODE_BLOCK, or a GENERATED that starts matching
// everything, lands under them instead of reporting a clean run over nothing.
const BLOCK_FLOOR = 55;
const LINE_FLOOR = 80;
if (blocksRead < BLOCK_FLOOR) {
  problems.push(
    `scripts/check-locales.mjs: read ${blocksRead} code blocks off the paired pages, fewer than the ${BLOCK_FLOOR} expected; the extraction is broken, not the pages`
  );
}
if (linesCompared < LINE_FLOOR) {
  problems.push(
    `scripts/check-locales.mjs: compared ${linesCompared} written command lines, fewer than the ${LINE_FLOOR} expected; the extraction is broken, not the pages`
  );
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

/* ---------- The reading is given once, where a reader meets the name ---------- */

const READING = "Ptah（プタハ）";
const KANA = /プタハ/g;
const LATIN = "Ptah";

/* The rule below is not this repository's to change. It is section 17 of
 * docs/STYLE_GUIDE.md in stokaro/ptah, where check-translations.mjs holds
 * README.ja.md to it: one gloss, at the first place the name stands on its
 * own in prose. The two repositories share no module, so the rule is copied
 * rather than imported -- amend the style guide first, then both readers.
 *
 * What differs is the document. A README gives its title as `# Ptah`, which
 * that reader masks; a page here gives it as <a class="brand">Ptah</a> in the
 * header, and its <h1> is a sentence -- 「Ptah（プタハ）のインストール」 -- which
 * is where two of these pages correctly place the gloss. So the wordmark is
 * read past and the heading is not: the same rule about the same kind of
 * region, applied to the markup that carries it here.
 */

// The page with everything that is not prose replaced by spaces of its own
// length. Offsets survive, so a position found here is a position in the page
// and lineOf can name the line somebody edits.
//
// Four regions are read past, each for its own reason. <head> is metadata a
// reader is shown elsewhere -- a <title>, a <meta content>, the JSON-LD name
// -- never a sentence read in order. The header wordmark names the product
// instead of saying anything about it, and stands above the prose on every
// page. <code> and <pre> hold a command, not the name. An attribute value
// describes a control and an HTML comment addresses the next maintainer;
// neither is read as the page.
function proseOnly(html) {
  const blank = (text) => text.replace(/[^\n]/g, " ");
  const mask = (text, re) => text.replace(re, blank);
  let text = html;
  text = mask(text, /<head\b[\s\S]*?<\/head>/i);
  text = mask(text, /<!--[\s\S]*?-->/g);
  text = mask(text, /<(code|pre)\b[^>]*>[\s\S]*?<\/\1>/gi);
  text = mask(text, /<a class="brand"[^>]*>[\s\S]*?<\/a>/gi);
  return text.replace(/<[^>]*>/g, (tag) =>
    tag.replace(/[A-Za-z-]+\s*=\s*("[^"]*"|'[^']*')/g, blank)
  );
}

// Where `name` first stands on its own in `text`, or -1. A match with a
// letter or a digit against it belongs to a longer word.
function standaloneMention(text, name) {
  const wordCharacter = /[0-9A-Za-z]/;
  let at = text.indexOf(name);
  while (at !== -1) {
    const before = at === 0 ? "" : text[at - 1];
    const after = text[at + name.length] ?? "";
    if (!wordCharacter.test(before) && !wordCharacter.test(after)) return at;
    at = text.indexOf(name, at + name.length);
  }
  return -1;
}

/** The 1-based line an offset falls on. */
const lineOf = (text, at) => text.slice(0, at).split("\n").length;

for (const page of pages) {
  const html = source.get(page);
  const occurrences = (html.match(KANA) || []).length;
  const japanese = isJapanese(page) || occurrences > 0;
  if (!japanese) continue;
  if (occurrences === 0) {
    fail(page, `never gives the reading: write ${READING} at the first mention`);
    continue;
  }
  if (occurrences > 1) {
    fail(
      page,
      `gives the reading ${occurrences} times: ${READING} belongs at the first mention only, and every mention after it is the Latin Ptah`
    );
    continue;
  }
  if (!html.includes(READING)) {
    fail(page, `spells the reading some other way; it is written ${READING}`);
    continue;
  }

  // Counting is not ordering. A page that writes Ptah and only later
  // Ptah（プタハ）satisfies the count above while handing the reader the
  // reading after they needed it, so where the gloss sits is compared too.
  const glossAt = html.indexOf(READING);
  const mentionAt = standaloneMention(proseOnly(html), LATIN);
  if (mentionAt === glossAt) continue;
  fail(
    page,
    mentionAt !== -1 && mentionAt < glossAt
      ? `writes ${LATIN} on line ${lineOf(html, mentionAt)} before ${READING} on line ${lineOf(html, glossAt)}; the reading is given at the first mention, so the gloss comes first and the Latin spelling follows it`
      : `writes ${READING} on line ${lineOf(html, glossAt)}, where a reader does not meet it: the head, the header wordmark, a code block and an attribute value are not the first mention, so the gloss belongs in the first sentence that names the product`
  );
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

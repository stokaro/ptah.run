#!/usr/bin/env node
/* Hold the Japanese to TRANSLATING.md.
 *
 * scripts/check-locales.mjs compares an English page with its Japanese
 * counterpart, so it sees a page that lost a command or a link. It cannot see
 * two Japanese pages, written months apart, calling the same thing by two
 * names -- both halves of that split are correct against their own English,
 * and the reader is the only one who notices it. Nor can it see a rule of
 * Japanese typography broken by carrying English punctuation across.
 *
 * The glossary is read out of TRANSLATING.md rather than restated here, so a
 * row added to the document is enforced on the next run and every rendering
 * this refuses is one the reader can look up. The typography rules are in
 * code, and TRANSLATING.md states them for a translator who is reading rather
 * than running anything.
 *
 *   node scripts/check-japanese.mjs
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const GLOSSARY = "TRANSLATING.md";

// Kana. Every file in the corpus has to carry some, which is what catches a
// named file that stopped being the Japanese it is named here for.
const KANA = /[぀-ヿ]/;

// The Japanese pages are discovered; git, never the filesystem, so a walk
// cannot descend into a checkout parked under the repository. The rest are
// named, each with the reason it carries Japanese without living under ja/.
const NAMED = {
  "404.html":
    "one document for the whole domain, carrying a Japanese block rather than having a counterpart of its own",
  "assets/runs.ja.js": "the Japanese narration for every recorded run",
  "scripts/build-runs.mjs": "the Japanese interface text the in-practice page is generated from"
};

// A tree that stopped matching would find nothing and read as success.
const PAGE_FLOOR = 4;
const ROW_FLOOR = 6;

function japanesePages() {
  const out = execFileSync("git", ["ls-files", "ja/*.html"], { cwd: root, encoding: "utf8" });
  return out.split("\n").filter(Boolean).sort();
}

/* ---------- The table ---------- */

// | English | Japanese | Never |, the header and its rule dropped. A cell in
// the Never column holds a comma-separated list; none of the renderings has a
// comma in it, which is what lets the document stay a document.
//
// The header is looked for rather than skipped by position. A table reshaped
// under this parser -- a column renamed, a fourth one added -- would otherwise
// leave the header itself standing as a row, and a count that went up reads
// exactly like a table that grew.
const HEADER = ["English", "Japanese", "Never"];

function glossary(markdown) {
  const rows = [];
  let sawHeader = false;
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length !== HEADER.length) continue;
    if (HEADER.every((name, i) => cells[i] === name)) {
      sawHeader = true;
      continue;
    }
    if (cells.every((c) => /^-+$/.test(c))) continue;
    rows.push({
      english: cells[0],
      use: cells[1].split(",").map((s) => s.trim()).filter(Boolean),
      never: cells[2].split(",").map((s) => s.trim()).filter(Boolean)
    });
  }
  return { rows, sawHeader };
}

/* ---------- Report ---------- */

const problems = [];

const pages = japanesePages();
if (pages.length < PAGE_FLOOR) {
  problems.push(
    `found only ${pages.length} Japanese page(s) under ja/; the discovery is broken, and a corpus of nothing passes every rule in it`
  );
}

const corpus = new Map();
for (const path of [...pages, ...Object.keys(NAMED)]) {
  let text;
  try {
    text = readFileSync(join(root, path), "utf8");
  } catch {
    problems.push(`${path}: named in ${GLOSSARY}'s corpus but not in the working tree`);
    continue;
  }
  if (!KANA.test(text)) {
    problems.push(`${path}: carries no Japanese, so it is not the file this check was pointed at`);
    continue;
  }
  corpus.set(path, text);
}

const { rows, sawHeader } = glossary(readFileSync(join(root, GLOSSARY), "utf8"));
if (!sawHeader) {
  problems.push(
    `${GLOSSARY}: found no glossary table headed | ${HEADER.join(" | ")} |; whatever rows were read below are not the ones this was written for`
  );
}
if (rows.length < ROW_FLOOR) {
  problems.push(
    `${GLOSSARY}: read ${rows.length} glossary row(s), fewer than the ${ROW_FLOOR} it carries; the table was reshaped and this stopped reading it`
  );
}

for (const row of rows) {
  for (const rejected of row.never) {
    for (const [path, text] of corpus) {
      const seen = text.split(rejected).length - 1;
      if (seen) {
        problems.push(
          `${path}: writes ${rejected} ${seen} time(s) for "${row.english}"; ${GLOSSARY} says ${row.use.join(" / ")}`
        );
      }
    }
  }
  const used = row.use.filter((rendering) => [...corpus.values()].some((t) => t.includes(rendering)));
  if (!used.length) {
    problems.push(
      `${GLOSSARY}: nothing writes ${row.use.join(" / ")} for "${row.english}" any more; drop the row or restore the term`
    );
  }
}

/* ---------- Typography ----------
 *
 * These read the pages rather than the sources they are generated from: what
 * the rules are about is the text a reader meets, and a page is where the
 * generator's strings and the hand-written prose finally sit side by side.
 */

const HEADING = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g;
const JAPANESE = /[぀-ヿ一-鿿]/;
const STRIP = /<[^>]+>/g;

// Kana or a CJK ideograph with a Latin letter against it. The site sets a
// space between the two scripts everywhere -- `Ptah をインストール` -- and the
// places it did not were a term and a link label dropped into a sentence
// without one.
const TOUCHING = /[぀-ヿ一-鿿][A-Za-z]|[A-Za-z][぀-ヿ一-鿿]/g;

// A reader sees no gap where a link ends, so `<a>AGENTS.md</a>に` renders as
// `AGENTS.mdに` -- the defect this rule is for, and the one a naive tag strip
// hides by leaving a space behind in place of the tag. Only the two elements
// this site always sets inline close up. The rest become a space: `strong`
// and `span` are grid items inside .tip and .tile-head, so closing them up
// would report two lines of a layout as two scripts touching, and a rule that
// cries wolf on a correct page is one somebody switches off.
const INLINE = /<\/?(?:a|code)\b[^>]*>/gi;

function rendered(html) {
  return html.replace(INLINE, "").replace(STRIP, " ");
}

// The convention that marked some links to English pages and not others. It
// said nothing about the links it was missing from, and one page alone links
// to more than thirty English destinations; the Japanese footer says it once
// instead, for all of them.
const MARKER = "（英語）";

for (const [path, text] of corpus) {
  if (!path.endsWith(".html")) continue;

  for (const found of text.matchAll(HEADING)) {
    const heading = found[2].replace(STRIP, "").trim();
    if (!JAPANESE.test(heading)) continue;
    if (/。$/.test(heading)) {
      problems.push(
        `${path}: the heading 「${heading}」 ends in 。 -- Japanese omits 句点 at the end of a heading, and one there is the English full stop carried across`
      );
    }
  }

  const seen = text.split(MARKER).length - 1;
  if (seen) {
    problems.push(
      `${path}: writes ${MARKER} ${seen} time(s); the footer says once that everything outside the Japanese pages is in English, so a per-link marker only says less`
    );
  }

  for (const found of rendered(text).matchAll(TOUCHING)) {
    problems.push(
      `${path}: writes ${found[0]} with no space between the Japanese and the Latin script`
    );
  }
}

if (problems.length) {
  console.error(`the Japanese does not follow ${GLOSSARY}:`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(
  `${rows.length} glossary terms and the typography rules checked over ${corpus.size} files carrying Japanese`
);

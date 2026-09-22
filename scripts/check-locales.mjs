#!/usr/bin/env node
/* Hold every translated tree to the English structure and URL contract.
 * Compare commands, destinations, controls and version stamps; require complete
 * metadata, reciprocal alternatives, navigation and sitemap coverage.
 *
 * It reads the built site, dist/, because that is what is published: a page
 * is whatever Astro wrote, whichever component or fragment it came from. Run
 * `npm run build` first.
 *
 *   node scripts/check-locales.mjs
 *   node scripts/check-locales.mjs --selftest
 */

import assert from "node:assert/strict";
import { LOCALES, localizedPath } from "./locales.mjs";

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// The pages the build wrote. dist/ is the build's own output directory, so a
// walk sees nothing but this build; a glob that stopped matching would read
// as a clean site, which is what the floor is for: four pages in four
// languages, the 404 and the testkit import page.
const PAGE_FLOOR = 18;
function builtPages() {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".html")) found.push(relative(dist, path).split("\\").join("/"));
    }
  };
  walk(dist);
  return found.sort();
}

// The release every page names: what the deploy passed in PTAH_VERSION, or
// the committed value a local build uses.
const expectedVersion =
  process.env.PTAH_VERSION || JSON.parse(readFileSync(join(root, "src/data/release.json"), "utf8")).version;

// A page that is deliberately not in a language group, and why. Anything else that is
// not in a language group is a page somebody forgot.
const UNPAIRED = {
  "404.html":
    "GitHub Pages answers every unknown address on the domain with this one document, /ja/ included, so a copy under /ja/ would never be served to anybody. The page carries both languages instead.",
  "testkit/index.html":
    "A go-import vanity page for `go get ptah.run/testkit`, read by the go tool and then redirected past. It has no prose and no reader to translate for."
};


// index.html -> /, install/index.html -> /install/, ja/index.html -> /ja/
const urlPath = (p) => "/" + p.replace(/index\.html$/, "");
const language = (p) => Object.keys(LOCALES).find((lang) => p.startsWith(lang + "/")) || "en";
const englishPage = (p) => language(p) === "en" ? p : p.slice(3);
const inLocale = (p, lang) => (lang === "en" ? "" : lang + "/") + englishPage(p);

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

// The extra file a translated page loads: the run
// narration. It is checked on its own below, because it is the one asymmetry
// between the trees that is meant to be there.
const narration = (lang) => `/assets/runs.${lang}.js`;

// Cross-language metadata and the picker have their own exact checks. Other
// links must stay in the selected language whenever an equivalent page exists.
const CROSSING = /<link rel="(?:canonical|alternate)"[^>]*>|<details class="lang-picker">[\s\S]*?<\/details>/g;
function destinations(html) {
  return new Set(
    [...links(html.replace(CROSSING, ""))]
      .filter((href) => !Object.keys(LOCALES).some((lang) => href === narration(lang)))
  );
}

const copyable = (html) => new Set(all(html, /data-copy-text="([^"]*)"/g));
const tabs = (html) => new Set(all(html, /data-tab="([^"]+)"/g));
const scenarios = (html) => new Set(all(html, /data-demo-scenario="([^"]+)"/g));
const anchors = (html) => new Set(all(html, /\sid="([^"]+)"/g));

const CODE_BLOCK = /<(code|pre)\b([^>]*)>([\s\S]*?)<\/\1>/g;

// Written by src/lib/runs.mjs out of assets/runs.js and the narration
// dictionaries, which stops the build on a missing or orphaned key. The
// generator owns these, so a second comparison here would only report its
// translated narration.
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
// command with it. Occurrence counts catch a missing repeated literal without
// requiring translations to keep the English sentence order.
function literals(html) {
  const lines = new Map();
  for (const block of html.matchAll(CODE_BLOCK)) {
    if (GENERATED.test(block[2])) continue;
    // The flow diagram contains translated prose, not executable examples.
    // Its accessibility label is checked below.
    if (/\bclass="diagram"/.test(block[2]) && /\brole="img"/.test(block[2])) continue;
    for (const raw of textOf(block[3]).split("\n")) {
      const line = raw.trim();
      if (line && !line.startsWith("#")) lines.set(line, (lines.get(line) || 0) + 1);
    }
  }
  return lines;
}

function literalDifference(a, b) {
  const changes = [...new Set([...a.keys(), ...b.keys()])]
    .filter((line) => (a.get(line) || 0) !== (b.get(line) || 0))
    .map((line) => `${JSON.stringify(line)}: English ${a.get(line) || 0}, translation ${b.get(line) || 0}`);
  return changes.length ? `the commands, flags and paths written on the page differ -- ${changes.join('; ')}` : null;
}

function differ(what, a, b, sides) {
  const [inA, inB] = sides || ["only in the English page", "only in the translation"];
  const onlyA = [...a].filter((x) => !b.has(x));
  const onlyB = [...b].filter((x) => !a.has(x));
  if (!onlyA.length && !onlyB.length) return null;
  const parts = [];
  if (onlyA.length) parts.push(`${inA}: ${onlyA.join(", ")}`);
  if (onlyB.length) parts.push(`${inB}: ${onlyB.join(", ")}`);
  return `${what} -- ${parts.join("; ")}`;
}

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


export function audit({ source, version, sitemap, robots }) {
  const problems = [];
  const fail = (page, message) => problems.push(`${page}: ${message}`);
  const pages = [...source.keys()];
  const has = (p) => source.has(p);

  for (const page of pages) {
    if (UNPAIRED[page]) continue;
    for (const lang of Object.keys(LOCALES)) {
      const other = inLocale(page, lang);
      if (!has(other)) fail(page, `has no counterpart at ${other}`);
    }
  }

  /* ---------- What a page says about itself ---------- */

  for (const page of pages) {
    const html = source.get(page);
    const want = language(page);
    const declared = /<html lang="([^"]+)"/.exec(html);
    if (!declared) fail(page, "has no lang attribute on <html>");
    else if (declared[1] !== want) {
      fail(page, `says lang="${declared[1]}" but sits in the ${want} tree`);
    }
  }

  /* ---------- Alternatives connect every equivalent page ---------- */

  for (const page of pages) {
    if (UNPAIRED[page]) continue;
    const html = source.get(page);
    const english = englishPage(page);
    const wanted = Object.fromEntries(Object.keys(LOCALES).map((lang) =>
      [lang, `https://ptah.run${urlPath(inLocale(page, lang))}`]));
    wanted["x-default"] = `https://ptah.run${urlPath(english)}`;
    for (const [tag, href] of Object.entries(wanted)) {
      const re = new RegExp(`<link rel="alternate" hreflang="${tag}" href="([^"]+)">`);
      const found = re.exec(html);
      if (!found) fail(page, `has no hreflang="${tag}" alternate`);
      else if (found[1] !== href) {
        fail(page, `hreflang="${tag}" points at ${found[1]}, expected ${href}`);
      }
    }
    if (count(html, /<link rel="alternate" hreflang="([^"]+)"/g) !== Object.keys(wanted).length) {
      fail(page, "unexpected or duplicate language alternatives");
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
    const switchHTML = /<details class="lang-picker">([\s\S]*?)<\/details>/.exec(html)?.[1];
    if (!switchHTML) {
      fail(page, "has no language switch in the header");
      continue;
    }
    const label = /<summary[^>]*\saria-label="([^"]*)"/.exec(switchHTML)?.[1];
    if (label !== LOCALES[language(page)].switchLabel) {
      fail(page, "language switch must have an accessible label in the page language");
    }
    for (const [lang, locale] of Object.entries(LOCALES)) {
      const path = UNPAIRED[page] ? "/" : urlPath(englishPage(page));
      const wanted = localizedPath(lang, path);
      const opening = `<a href="${wanted}" hreflang="${lang}" lang="${lang}"`;
      if (!switchHTML.includes(opening) || !switchHTML.includes(`>${locale.name}</a>`)) {
        fail(page, `language switch must link to ${wanted} as ${locale.name}`);
      }
    }
  }

  /* ---------- Translations preserve source commands, destinations and controls ---------- */

  const localized = new Set(pages.filter((p) => language(p) === "en" && !UNPAIRED[p]).map(urlPath));

  for (const page of pages) {
    if (language(page) !== "en" || UNPAIRED[page]) continue;
    const en = source.get(page);
    const written = literals(en);
    for (const lang of Object.keys(LOCALES).filter((lang) => lang !== "en")) {
      const other = inLocale(page, lang);
      if (!has(other)) continue;
      const translated = source.get(other);
      const seen = [
        differ("the commands offered for copying differ", copyable(en), copyable(translated)),
        literalDifference(written, literals(translated)),
        differ(
          "the destinations linked to differ",
          new Set([...destinations(en)].map((href) => localized.has(href) ? localizedPath(lang, href) : href)),
          destinations(translated)
        ),
        differ("the install tabs differ", tabs(en), tabs(translated)),
        differ("the recorded runs on the page differ", scenarios(en), scenarios(translated)),
        differ(
          "the element ids the stylesheet and the script address differ",
          anchors(en),
          anchors(translated)
        )
      ].filter(Boolean);
      for (const message of seen) fail(`${page} / ${other}`, message);

      for (const attribute of ["data-version", "data-version-bare"]) {
        const re = new RegExp(`\\b${attribute}(?![\\w-])`, "g");
        const inEnglish = count(en, re);
        const inTranslation = count(translated, re);
        if (inEnglish !== inTranslation) {
          fail(
            `${page} / ${other}`,
            `${attribute} appears ${inEnglish} time(s) in the English page and ${inTranslation} in the translated one; the release stamp would land in different places`
          );
        }
      }
    }
  }

  /* ---------- Every translated player carries its narration ---------- */

  // Every translated player needs its complete dictionary; it refuses to run
  // without one, leaving the localized static transcript available.
  for (const page of pages) {
    if (language(page) === "en") continue;
    const NARRATION = narration(language(page));
    const html = source.get(page);
    if (!links(html).has("/assets/runs.js")) continue;
    if (!links(html).has(NARRATION)) {
      fail(page, `loads the recorded runs but not ${NARRATION}, so the player cannot load its localized narration`);
    }
  }

  /* ---------- Every page names the same release ---------- */

  // The build writes the version into every data-version element, so two
  // different values mean part of the site came from somewhere else -- a
  // fragment with a number typed into it, or a page the build did not write.
  for (const page of pages) {
    const html = source.get(page);
    for (const found of all(html, /\bdata-version(?![\w-])[^>]*>([^<]*)</g)) {
      if (found !== version) fail(page, `names release ${found}, expected ${version}`);
    }
    for (const found of all(html, /\bdata-version-bare\b[^>]*>([^<]*)</g)) {
      if (found !== version.slice(1)) fail(page, `names release ${found}, expected ${version.slice(1)}`);
    }
  }

  /* ---------- The sitemap lists what exists ---------- */


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
    const japanese = language(page) === "ja" || occurrences > 0;
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

  /* ---------- Static metadata and indexability ---------- */
  for (const page of pages) {
    if (UNPAIRED[page]) continue;
    const html = source.get(page);
    const lang = language(page);
    const en = source.get(englishPage(page));
    if (!en) continue;
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
    if (!title?.trim()) fail(page, "missing title");
    const required = ['description', 'og:title', 'og:description', 'og:image:alt'];
    for (const key of required) {
      const pattern = new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)">`);
      const value = pattern.exec(html)?.[1];
      if (!value?.trim()) fail(page, `missing metadata: ${key}`);
      if (['de', 'fr'].includes(lang) && value === pattern.exec(en)?.[1]) {
        fail(page, `untranslated metadata: ${key}`);
      }
    }
    if (/<meta[^>]+(?:name|http-equiv)="(?:robots|googlebot|X-Robots-Tag)"[^>]*content="[^"]*(?:noindex|none)/i.test(html)) {
      fail(page, "localized page blocks indexing");
    }
    const ogURL = /<meta property="og:url" content="([^"]+)"/.exec(html)?.[1];
    if (ogURL !== `https://ptah.run${urlPath(page)}`) fail(page, "og:url must name its own canonical URL");
    if (/http-equiv="refresh"/i.test(html)) fail(page, "landing redirects instead of rendering content");
    if (['de', 'fr'].includes(lang)) {
      if (title === /<title>([^<]+)<\/title>/.exec(en)?.[1]) fail(page, "untranslated title");
      for (const tag of ['h1', 'h2', 'h3', 'p', 'dd', 'a', 'button']) {
        const pattern = new RegExp(`<${tag}(?: [^>]*)?>([\\s\\S]*?)<\/${tag}>`, 'g');
        const originals = [...en.matchAll(pattern)];
        const translated = [...html.matchAll(pattern)];
        if (originals.length !== translated.length) fail(page, `missing ${tag} content`);
        for (const [index, block] of translated.entries()) {
          const sourceHasText = originals[index]?.[1].replace(/<[^>]*>/g, '').trim();
          if (sourceHasText && !block[1].replace(/<[^>]*>/g, '').trim()) fail(page, `empty ${tag} content`);
        }
      }
      for (const attribute of ['aria-label', 'alt', 'data-copy-name', 'title']) {
        const pattern = new RegExp(`\\s${attribute}="([^"]*)"`, 'g');
        const originals = all(en, pattern);
        const translated = all(html, pattern);
        if (originals.length !== translated.length) fail(page, `missing ${attribute} labels`);
        translated.forEach((label, index) => {
          if (originals[index]?.trim() && !label.trim()) fail(page, `empty ${attribute} label`);
          if (label.split(/\s+/).length >= 4 && label === originals[index]) {
            fail(page, `untranslated ${attribute} label: ${label}`);
          }
        });
      }
      const originalProse = prose(en);
      for (const text of prose(html)) {
        if (text.split(/\s+/).length >= 4 && !UNTRANSLATED.has(text) && originalProse.has(text)) {
          fail(page, `untranslated prose: ${text}`);
        }
      }
      const docsLabel = lang === 'de' ? 'Dokumentation' : 'Documentation';
      if (!html.includes(`>${docsLabel}</a>`)) fail(page, "documentation link label is not localized");
      for (const href of links(html)) {
        if (/https:\/\/(?:docs|operator)\.ptah\.run\/(?:edge\/)?(?:de|fr)\//.test(href)) {
          fail(page, `invented localized documentation URL: ${href}`);
        }
      }
    }
  }
  // Pages is deployed directly: there is no application or proxy that sets
  // response headers. Refuse crawler exclusions in the checked-in policy.
  if (/^\s*Disallow:\s*\S/m.test(robots)) problems.push("robots.txt blocks crawling");
  return problems;
}

// Text that reads like a sentence but is the same in every language: the
// footer's brand line, a list of format names, the answers ptah assist offers
// in the terminal (its own interface, in English), and the names of MCP
// clients.
const UNTRANSLATED = new Set([
  '· pre-GA · MIT',
  '· pre-GA · MIT · © 2026 Stokaro',
  'SQL, YAML, HCL, DBML',
  'Allow once · for this session · No',
  'Claude · Cursor · VS Code · Zed',
]);

// Read rendered prose only. Recorded output, code and language names retain
// their source spelling and cannot be mistaken for missing prose translations.
function prose(html) {
  const cleaned = html.replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/<span class="tile-cmd">[\s\S]*?<\/span>[^<]*<\/span>/g, '').replace(/<(script|style|pre|code)\b[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/<details class="lang-picker">[\s\S]*?<\/details>/g, '');
  return new Set([...cleaned.matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter(Boolean));
}

const source = new Map();
const missing = [];
for (const page of builtPages()) source.set(page, readFileSync(join(dist, page), "utf8"));
if (source.size < PAGE_FLOOR) {
  missing.push(`dist/: ${source.size} pages built, expected at least ${PAGE_FLOOR}; run npm run build`);
}
const input = {
  source,
  version: expectedVersion,
  sitemap: readFileSync(join(dist, "sitemap.xml"), "utf8"),
  robots: readFileSync(join(dist, "robots.txt"), "utf8")
};
const problems = [...missing, ...audit(input)];
if (process.argv.includes('--selftest')) {
  assert.deepEqual(problems, [], 'the clean tree must pass before mutation checks');
  let assertions = 0;
  const refuse = (label, mutate, expected) => {
    const test = { ...input, source: new Map(source) };
    mutate(test);
    assert(audit(test).some((problem) => problem.includes(expected)), label);
    assertions++;
  };
  refuse('empty page discovery', (test) => test.source.clear(), 'a listing with no page');
  for (const lang of ['de', 'fr']) {
    const page = `${lang}/index.html`;
    const change = (test, before, after) => test.source.set(page, test.source.get(page).replace(before, after));
    refuse('missing locale', (test) => test.source.delete(page), 'has no counterpart');
    refuse('wrong language', (test) => change(test, `lang="${lang}"`, 'lang="en"'), 'says lang=');
    refuse('English canonical', (test) => change(test, `rel="canonical" href="https://ptah.run/${lang}/"`, 'rel="canonical" href="https://ptah.run/"'), 'is canonical');
    refuse('missing reciprocal alternate', (test) => test.source.set('index.html', test.source.get('index.html').replace(new RegExp(`<link rel="alternate" hreflang="${lang}"[^>]+>`), '')), `has no hreflang="${lang}"`);
    refuse('broken language switch', (test) => change(test, 'href="/ja/" hreflang="ja"', 'href="/" hreflang="ja"'), 'language switch');
    refuse('missing narration', (test) => change(test, `<script src="/assets/runs.${lang}.js" defer></script>`, ''), 'loads the recorded runs but not');
    refuse('empty description', (test) => test.source.set(page, test.source.get(page).replace(/name="description" content="[^"]*"/, 'name="description" content=""')), 'missing metadata');
    refuse('missing accessibility label', (test) => test.source.set(page, test.source.get(page).replace(/ aria-label="[^"]+"/, '')), 'missing aria-label labels');
    refuse('empty accessibility label', (test) => test.source.set(page, test.source.get(page).replace(/aria-label="[^"]+"/, 'aria-label=""')), 'empty aria-label label');
    refuse('English accessibility label', (test) => test.source.set(`${lang}/in-practice/index.html`, test.source.get(`${lang}/in-practice/index.html`).replace(/aria-label="(?:Wiedergabegeschwindigkeit|Vitesse de lecture)[^"]*"/, /aria-label="Playback speed[^"]*"/.exec(source.get('in-practice/index.html'))[0])), 'untranslated aria-label label');
    refuse('English paragraph', (test) => test.source.set(page, test.source.get(page).replace(/<p class="lede">[^<]+<\/p>/, /<p class="lede">[^<]+<\/p>/.exec(source.get('index.html'))[0])), 'untranslated prose');
    refuse('missing body', (test) => test.source.set(page, test.source.get(page).replace(/<p class="lede">[^<]+<\/p>/, '')), 'missing p content');
    refuse('noindex', (test) => change(test, '</head>', '<meta name="robots" content="noindex"></head>'), 'blocks indexing');
    refuse('missing sitemap entry', (test) => { test.sitemap = test.sitemap.replace(`<url><loc>https://ptah.run/${lang}/</loc></url>`, ''); }, 'a page nothing lists');
    refuse('invented docs URL', (test) => change(test, 'https://docs.ptah.run/edge/start/quick-start/', `https://docs.ptah.run/${lang}/edge/start/quick-start/`), 'invented localized documentation URL');
  }
  for (const lang of ['ja', 'de', 'fr']) {
    const home = `${lang}/index.html`;
    const install = `${lang}/install/index.html`;
    refuse(`${lang}: written command drift`, (test) => {
      test.source.set(install, test.source.get(install).replace('<code>ptah-compat</code>', '<code>ptah-kompat</code>'));
    }, 'the commands, flags and paths written on the page differ');
    const community = `${lang}/community/index.html`;
    for (const [label, replacement] of [['missing', ''], ['extra', '<code>ptah</code><code>ptah</code>']]) {
      refuse(`${lang}: ${label} occurrence of a repeated literal`, (test) => {
        test.source.set(community, test.source.get(community).replace('<code>ptah</code>', replacement));
      }, 'the commands, flags and paths written on the page differ');
    }
    refuse(`${lang}: navigation enters English tree`, (test) => {
      test.source.set(home, test.source.get(home).replace(`href="/${lang}/install/"`, 'href="/install/"'));
    }, 'the destinations linked to differ');
    refuse(`${lang}: language picker loses its accessible label`, (test) => {
      test.source.set(home, test.source.get(home).replace(/(<summary[^>]*?) aria-label="[^"]*"/, '$1'));
    }, 'language switch must have an accessible label');
    refuse(`${lang}: language picker uses an English label`, (test) => {
      test.source.set(home, test.source.get(home).replace(/(<summary[^>]*?) aria-label="[^"]*"/, '$1 aria-label="Language"'));
    }, 'language switch must have an accessible label');
  }
  refuse('Japanese gloss follows a bare mention', (test) => {
    const page = 'ja/index.html';
    test.source.set(page, test.source.get(page).replace(/(<main\b[^>]*>)/, '$1<p>Ptah を試す</p>'));
  }, 'the reading is given at the first mention');
  refuse('Japanese gloss hidden in metadata', (test) => {
    const page = 'ja/index.html';
    test.source.set(page, test.source.get(page).replace('Ptah（プタハ）', 'Ptah')
      .replace('</head>', '<meta name="test" content="Ptah（プタハ）"></head>'));
  }, 'where a reader does not meet it');
  // Fixtures exercise the extractor itself, independently of today's page size.
  const fixture = `<code>ptah</code><code>ptah</code>
    <pre><code># translated narration\nptah schema apply --url &quot;db&quot;\nptah # retained</code></pre>
    <pre class="diagram" role="img">translated diagram</pre>
    <pre data-demo-transcript>generated</pre><pre data-demo-screen>generated</pre>
    <pre class="tile-transcript">generated</pre><code>&lt;x&gt; &amp; &#65;</code>`;
  const expected = new Map([['ptah', 2], ['ptah schema apply --url "db"', 1], ['ptah # retained', 1], ['<x> & A', 1]]);
  assert.deepEqual(literals(fixture), expected, 'extract nested blocks, decode entities, keep counts, exclude narration');
  assert.deepEqual(literals('<p>No commands on this page.</p>'), new Map(), 'empty prose is valid');
  assert.equal(literalDifference(expected, new Map([...expected].reverse())), null, 'sentence order may differ');
  assert.match(literalDifference(expected, new Map([['ptah', 1]])), /English 2, translation 1/);
  console.log('check-locales: command extraction fixtures passed');
  refuse('robots exclusion', (test) => { test.robots += '\nDisallow: /de/\n'; }, 'blocks crawling');
  refuse('a page naming another release', (test) => test.source.set('install/index.html', test.source.get('install/index.html').replace(/(data-version>)v\d+\.\d+\.\d+/, '$1v0.0.1')), 'names release v0.0.1');
  console.log(`check-locales: ${assertions} refusal checks passed`);
} else if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${source.size} pages checked across ${Object.keys(LOCALES).length} locales`);
}

#!/usr/bin/env node
/* Hold every translated tree to the English structure and URL contract.
 * Compare commands, destinations, controls and version stamps; require complete
 * metadata, reciprocal alternatives, navigation and sitemap coverage.
 * Generated transcripts are checked by build-runs.mjs against assets/runs.js.
 *
 *   node scripts/check-locales.mjs
 *   node scripts/check-locales.mjs --selftest
 */

import assert from "node:assert/strict";
import { LOCALES, localizedPath } from "./locales.mjs";

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

// The same set, with each translated tree's prefix taken off, so its
// links can be compared as the one set of destinations they should be.
function destinations(html) {
  return new Set(
    [...links(html)]
      .filter((href) => !Object.keys(LOCALES).some((lang) => href === narration(lang)))
      .map((href) => href.replace(/^\/(ja|de|fr)\//, "/"))
  );
}

const copyable = (html) => new Set(all(html, /data-copy-text="([^"]*)"/g));
const tabs = (html) => new Set(all(html, /data-tab="([^"]+)"/g));
const scenarios = (html) => new Set(all(html, /data-demo-scenario="([^"]+)"/g));
const anchors = (html) => new Set(all(html, /\sid="([^"]+)"/g));

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

export function audit({ source, stamper, sitemap, robots }) {
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

  for (const page of pages) {
    if (language(page) !== "en" || UNPAIRED[page]) continue;
    for (const lang of Object.keys(LOCALES).filter((lang) => lang !== "en")) {
      const other = inLocale(page, lang);
      if (!has(other)) continue;
      const en = source.get(page);
      const translated = source.get(other);
      const seen = [
        differ("the commands offered for copying differ", copyable(en), copyable(translated)),
        differ("the destinations linked to differ", destinations(en), destinations(translated)),
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

  /* ---------- The release stamp reaches every page that asks for one ---------- */


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
    } else if (occurrences > 1) {
      fail(
        page,
        `gives the reading ${occurrences} times: ${READING} belongs at the first mention only, and every mention after it is the Latin Ptah`
      );
    } else if (!html.includes(READING)) {
      fail(page, `spells the reading some other way; it is written ${READING}`);
    }
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
        if (text.split(/\s+/).length >= 4 && !['· pre-GA · MIT', 'SQL, YAML, HCL, DBML'].includes(text) && originalProse.has(text)) {
          fail(page, `untranslated prose: ${text}`);
        }
      }
      const docsLabel = lang === 'de' ? 'Dokumentation (Englisch)' : 'Documentation (en anglais)';
      if (!html.includes(`>${docsLabel}</a>`)) fail(page, "documentation language is not labeled");
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

// Read rendered prose only. Recorded output, code and language names retain
// their source spelling and cannot be mistaken for missing prose translations.
function prose(html) {
  const cleaned = html.replace(/<span class="tile-cmd">[\s\S]*?<\/span>[^<]*<\/span>/g, '').replace(/<(script|style|pre|code)\b[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/<details class="lang-picker">[\s\S]*?<\/details>/g, '');
  return new Set([...cleaned.matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter(Boolean));
}

const source = new Map();
const missing = [];
for (const page of trackedPages()) {
  try { source.set(page, readFileSync(join(root, page), "utf8")); }
  catch { missing.push(`${page}: tracked page missing from working tree`); }
}
const input = {
  source,
  stamper: readFileSync(join(root, "scripts/stamp-version.mjs"), "utf8"),
  sitemap: readFileSync(join(root, "sitemap.xml"), "utf8"),
  robots: readFileSync(join(root, "robots.txt"), "utf8")
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
    refuse('English accessibility label', (test) => test.source.set(page, test.source.get(page).replace(/aria-label="(?:Wiedergabegeschwindigkeit|Vitesse de lecture)[^"]*"/, /aria-label="Playback speed[^"]*"/.exec(source.get('index.html'))[0])), 'untranslated aria-label label');
    refuse('English paragraph', (test) => test.source.set(page, test.source.get(page).replace(/<p class="lede">[^<]+<\/p>/, /<p class="lede">[^<]+<\/p>/.exec(source.get('index.html'))[0])), 'untranslated prose');
    refuse('missing body', (test) => test.source.set(page, test.source.get(page).replace(/<p class="lede">[^<]+<\/p>/, '')), 'missing p content');
    refuse('noindex', (test) => change(test, '</head>', '<meta name="robots" content="noindex"></head>'), 'blocks indexing');
    refuse('missing sitemap entry', (test) => { test.sitemap = test.sitemap.replace(`<url><loc>https://ptah.run/${lang}/</loc></url>`, ''); }, 'a page nothing lists');
    refuse('invented docs URL', (test) => change(test, 'https://docs.ptah.run/edge/start/quick-start/', `https://docs.ptah.run/${lang}/edge/start/quick-start/`), 'invented localized documentation URL');
  }
  refuse('robots exclusion', (test) => { test.robots += '\nDisallow: /de/\n'; }, 'blocks crawling');
  console.log(`check-locales: ${assertions} refusal checks passed`);
} else if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${source.size} pages checked across ${Object.keys(LOCALES).length} locales`);
}

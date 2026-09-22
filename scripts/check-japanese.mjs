#!/usr/bin/env node
// Check the bounded project conventions documented in TRANSLATING.md.
// Terminology is reviewed in context; there is no global word blacklist.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const JAPANESE = /[぀-ヿ一-鿿]/;
const TOUCHING = /[぀-ヿ一-鿿][A-Za-z]|[A-Za-z][぀-ヿ一-鿿]/g;
const HEADING = /<(h[1-6]|title)\b[^>]*>([\s\S]*?)<\/\1>/gi;
const MARKER = "（英語）";
const strip = (html) => html.replace(/<[^>]+>/g, "");
const decode = (text) => text.replace(/&#(x[\da-f]+|\d+);/gi, (_, n) =>
  String.fromCodePoint(n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

function spacing(text) {
  return [...decode(text).matchAll(TOUCHING)].map((m) =>
    `writes ${m[0]} without the space used by this project's typography convention`);
}

function htmlProblems(html) {
  const problems = [];
  for (const match of html.matchAll(HEADING)) {
    const text = decode(strip(match[2])).trim();
    if (JAPANESE.test(text) && text.endsWith("。")) {
      problems.push(`${match[1]} ends in 。; this project's headings and titles omit it`);
    }
  }
  for (const match of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    if (decode(strip(match[1])).includes(MARKER)) problems.push('link label contains a parenthetical language notice');
  }
  // Preserve adjacency across inline links/code; separate layout blocks. Code
  // bodies, generated transcripts and non-prose metadata are not spacing input.
  const prose = html.replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(head|script|style|pre)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, (block) => /[A-Za-z]$/.test(strip(block)) ? "Code" : " ")
    .replace(/<\/?a\b[^>]*>/gi, "").replace(/<[^>]+>/g, " ");
  return [...problems, ...spacing(prose)];
}

function runtimeStrings(source) {
  // Evaluate only the existing dictionary, without running DOM enhancements.
  // An unrecognized declaration or function must fail rather than skip strings.
  const match = /var TEXT = (\{[\s\S]*?\n  \});\n  var T =/.exec(source);
  if (!match) throw new Error('cannot extract TEXT from assets/site.js');
  return runInNewContext(`(() => {
    const text = (${match[1]}).ja;
    if (!text || !Object.keys(text).length) throw new Error('missing TEXT.ja');
    const samples = { copiedStatus: ['コマンド', 'Ptah'], detected: ['Linux', 'Windows', 'macOS'], speed: [1, 2] };
    return Object.entries(text).flatMap(([key, value]) => {
      if (typeof value === 'string') return [[key, value]];
      if (typeof value !== 'function' || !samples[key]) throw new Error('add runtime samples for TEXT.ja.' + key);
      return samples[key].map((arg) => [key + '(' + arg + ')', value(arg)]);
    });
  })()`, {}, { timeout: 1000 });
}

function runtimeProblems(source) {
  const problems = [];
  for (const [key, value] of runtimeStrings(source)) {
    if (typeof value !== 'string' || !value.trim()) {
      problems.push(`${key}: missing runtime text`);
      continue;
    }
    problems.push(...spacing(value).map((problem) => `${key}: ${problem}`));
    if (value.includes(MARKER)) problems.push(`${key}: parenthetical language notice`);
  }
  return problems;
}

if (process.argv.includes('--selftest')) {
  let cases = 0;
  const check = (text, expected) => {
    const problems = htmlProblems(text);
    if (expected) assert(problems.some((p) => p.includes(expected)), text);
    else assert.deepEqual(problems, [], text);
    cases++;
  };
  check('<title>インストール。</title>', 'title ends in');
  check('<h2>スキーマの変更。</h2>', 'h2 ends in');
  check('<title>インストール</title><h2>スキーマの変更</h2>');
  check('<p>Ptahを使う</p>', 'without the space');
  check('<p><a href="/">Ptah</a>を使う</p>', 'without the space');
  check('<p><code>ptah</code>を使う</p>', 'without the space');
  check('<p><code>ptah</code> を使う</p>');
  check('<p>Ptah を使う。課題を整理する。成果物を保存する。表面を調べる。</p>');
  check('<a href="https://docs.ptah.run/">ドキュメント（英語）</a>', 'language notice');
  check('<pre># Ptahを使う\nptah apply</pre>');
  const fixture = (body) => `var TEXT = { ja: { ${body} }\n  };\n  var T = TEXT.ja;`;
  assert.deepEqual(runtimeProblems(fixture('label: "課題、成果物、表面"')), []); cases++;
  assert(runtimeProblems(fixture('label: "Ptahを使う"')).some((p) => p.includes('without the space'))); cases++;
  assert(runtimeProblems(fixture('copiedStatus: function (name) { return name + "をコピー"; }')).some((p) => p.includes('copiedStatus(Ptah)'))); cases++;
  assert.deepEqual(runtimeProblems(fixture('label: "Ptah を使う"')), []); cases++;
  assert.throws(() => runtimeStrings('var renamed = {};'), /cannot extract/); cases++;
  assert.throws(() => runtimeStrings(fixture('newLabel: function () { return "再生"; }')), /add runtime samples/); cases++;
  console.log(`check-japanese: ${cases} style and runtime fixtures passed`);
}

// The built Japanese tree, and the 404 that carries a Japanese paragraph. Run
// `npm run build` first; four pages is the floor, so an empty or unbuilt
// dist/ fails instead of passing on nothing.
const dist = join(root, 'dist');
const pages = ['404.html', ...readdirSync(join(dist, 'ja'), { recursive: true })
  .filter((path) => path.endsWith('.html')).map((path) => `ja/${path.split('\\').join('/')}`)];
assert(pages.filter((path) => path.startsWith('ja/')).length >= 4, 'fewer than four built Japanese pages; run npm run build');
const problems = pages.flatMap((path) => htmlProblems(readFileSync(join(dist, path), 'utf8'))
  .map((problem) => `dist/${path}: ${problem}`));
problems.push(...runtimeProblems(readFileSync(join(root, 'public/assets/site.js'), 'utf8'))
  .map((problem) => `public/assets/site.js: ${problem}`));
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${pages.length} HTML pages and Japanese runtime samples follow the project typography conventions`);
}

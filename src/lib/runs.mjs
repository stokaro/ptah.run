/* The recorded runs, as the build reads them.
 *
 * public/assets/runs.js is the one copy of every session: the browser loads
 * it to play them, and this module loads the same file to write the printed
 * transcripts, so neither can drift from the other. Only narration is
 * translated (public/assets/runs.{ja,de,fr}.js); a missing, empty or orphaned
 * translation stops the build rather than publishing a page that carries
 * English its reader was told had been translated.
 *
 * transcript() mirrors settle() in public/assets/site.js line for line. When
 * one changes, change the other.
 */

import { createRequire } from "node:module";
import { join } from "node:path";

// Resolved from the project root: this module is bundled before it runs, so
// its own location says nothing about where public/ is.
const require = createRequire(join(process.cwd(), "package.json"));
const load = (name) => require(join(process.cwd(), "public", "assets", name));

export const RUNS = load("runs.js");
export const NARRATIONS = {
  ja: load("runs.ja.js"),
  de: load("runs.de.js"),
  fr: load("runs.fr.js"),
};

// The same mapping the player uses. A kind missing here renders unwrapped,
// which is what an ordinary line of output is.
const CLASS = { mute: "m", sql: "a", new: "n", err: "e", note: "c" };

export const esc = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// A flag wraps whole wherever a session names it, as shown() in the player
// does it.
const FLAG = /(^|\s)(--?[a-z][\w-]*)/g;
const shown = (text) => esc(text).replace(FLAG, '$1<span class="nw">$2</span>');

/* ---------- Narration coverage ----------
 *
 * Every table in a narration dictionary is keyed by the English it replaces,
 * so a hole and an orphan are both findable: a session or a line added to
 * runs.js with no translation beside it, and a line edited in English whose
 * old key is still sitting in the translation.
 */

function sourceStrings() {
  const notes = new Set();
  const sync = new Set();
  for (const key of Object.keys(RUNS.scenarios)) {
    for (const [kind, text] of RUNS.scenarios[key].script) {
      if (kind === "note") notes.add(text);
      if (kind === "sync") sync.add(text);
    }
  }
  return { notes, sync, scenarios: new Set(Object.keys(RUNS.scenarios)) };
}

function compare(lang, what, source, translated) {
  const problems = [];
  for (const k of source) if (!translated.has(k)) problems.push(`${what}: no ${lang} translation for ${JSON.stringify(k)}`);
  for (const k of translated) {
    if (!source.has(k)) problems.push(`${what}: ${JSON.stringify(k)} is translated but no longer in runs.js`);
  }
  return problems;
}

export function narrationProblems(lang, narration) {
  const src = sourceStrings();
  const problems = [
    ...compare(lang, "scenario", src.scenarios, new Set(Object.keys(narration.scenarios))),
    ...compare(lang, "note", src.notes, new Set(Object.keys(narration.notes))),
    ...compare(lang, "sync", src.sync, new Set(Object.keys(narration.sync))),
  ];
  for (const key of Object.keys(narration.scenarios)) {
    for (const field of ["tag", "label", "caption"]) {
      const value = narration.scenarios[key][field];
      if (typeof value !== "string" || !value.trim()) problems.push(`scenario: ${key} has no ${field}`);
    }
  }
  for (const group of ["notes", "sync"]) {
    for (const [key, value] of Object.entries(narration[group])) {
      if (typeof value !== "string" || !value.trim()) problems.push(`${group}: ${key} is empty`);
    }
  }
  return problems;
}

for (const [lang, narration] of Object.entries(NARRATIONS)) {
  const problems = narrationProblems(lang, narration);
  if (problems.length) throw new Error(`public/assets/runs.${lang}.js:\n  ${problems.join("\n  ")}`);
}

// What a session is called, and what is said about it, in one language.
export function about(lang, key) {
  return lang === "en" ? RUNS.scenarios[key] : NARRATIONS[lang].scenarios[key];
}

// Narration inside a transcript. Everything else in a script is what the
// program printed and is the same text in every language.
function line(lang, kind, text) {
  if (lang !== "en" && kind === "note") return NARRATIONS[lang].notes[text];
  return text;
}

// The session at rest, every event committed in order. `wait` is a beat and
// `sync` moves the pill, so neither leaves a line behind.
export function transcript(script, lang) {
  const rows = [];
  for (const [kind, text] of script) {
    if (kind === "wait" || kind === "sync") continue;
    if (kind === "blank") {
      rows.push("");
      continue;
    }
    // A note opens a step, and the typed run puts a blank row in front of it.
    // Printing it without one makes the printed session a different text.
    if (kind === "note" && rows.length && rows[rows.length - 1] !== "") rows.push("");
    let body = shown(line(lang, kind, text));
    if (kind === "cmd") body = `<span class="p">$</span> ${body}`;
    const cls = CLASS[kind];
    rows.push(cls ? `<span class="${cls}">${body}</span>` : body);
  }
  // One line, one block, exactly as paint() builds the live screen: a printed
  // session and a played one have to wrap the same way.
  const wide = wideRuns(rows);
  return rows.map((inner, i) => `<span class="${wide[i] ? "l l-wide" : "l"}">${inner || " "}</span>`).join("");
}

const COLUMNS = /[^\s] {2,}\S/;
const TABLE_RULE = /^[-+=|\s]{8,}$/;

// A line whose meaning is its alignment: runs of spaces holding columns apart,
// or the rule that underlines them.
function tabular(html) {
  const text = html.replace(/<[^>]*>/g, "");
  return COLUMNS.test(text) || TABLE_RULE.test(text);
}

// Alignment is a property of a block, not of a line: a run of output lines is
// wide if any line in it is, and a note, a command or a blank ends the run.
function wideRuns(rows) {
  const breaks = (html) => html === "" || /<span class="c">/.test(html) || /<span class="p">/.test(html);
  const wide = [];
  let i = 0;
  while (i < rows.length) {
    if (breaks(rows[i])) {
      wide[i] = false;
      i++;
      continue;
    }
    let end = i;
    let any = false;
    while (end < rows.length && !breaks(rows[end])) {
      if (tabular(rows[end])) any = true;
      end++;
    }
    for (; i < end; i++) wide[i] = any;
  }
  return wide;
}

// How many lines the printed session has. The hero's counter reads "line of
// lines" off the same events settle() commits, so the two agree.
export function lineCount(script) {
  let rows = 0;
  let last = null;
  for (const [kind] of script) {
    if (kind === "wait" || kind === "sync") continue;
    if (kind === "note" && rows && last !== "blank") rows++;
    rows++;
    last = kind;
  }
  return rows;
}

// What the tile says about a session before you open it: the first command it
// runs, and how much there is. Both are read off the script, so neither can go
// stale.
export function preview(script) {
  const cmd = script.find(([kind]) => kind === "cmd");
  return cmd ? cmd[1].replace(/\s*\\$/, "") : "";
}

export function commandCount(script) {
  return script.filter(([kind]) => kind === "cmd").length;
}

export function eventLineCount(script) {
  return script.filter(([kind]) => kind !== "wait" && kind !== "sync").length;
}

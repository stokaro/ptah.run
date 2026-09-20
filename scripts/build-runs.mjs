#!/usr/bin/env node
/* Write each language's in-practice page and homepage transcript from the
 * same commands and output in assets/runs.js. Only narration is translated;
 * missing, empty or orphaned translations stop generation.
 *
 *   node scripts/build-runs.mjs           write the pages
 *   node scripts/build-runs.mjs --check   fail when they are out of date
 *   node scripts/build-runs.mjs --selftest exercise narration refusals
 */

import assert from "node:assert/strict";
import { LOCALES, alternates, langSwitch } from "./locales.mjs";

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const require = createRequire(import.meta.url);
const RUNS = require(join(root, "assets", "runs.js"));
const NARRATIONS = Object.fromEntries(Object.keys(LOCALES).filter((lang) => lang !== "en")
  .map((lang) => [lang, require(join(root, "assets", `runs.${lang}.js`))]));

// The same mapping the player uses. A kind missing here renders unwrapped,
// which is what an ordinary line of output is.
const CLASS = { mute: "m", sql: "a", new: "n", err: "e", note: "c" };

const esc = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- Narration coverage ----------
 *
 * Every table in a narration dictionary is keyed by the English it replaces, so a
 * hole and an orphan are both findable: a session or a line added to
 * assets/runs.js with no translation beside it, and a line edited in English
 * whose old key is still sitting in the translation. Both stop the build,
 * because either one would publish a translated page carrying English the reader
 * was told had been translated -- or, worse, narration for a run that no
 * longer exists.
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
  const missing = [...source].filter((k) => !translated.has(k));
  const orphaned = [...translated].filter((k) => !source.has(k));
  const problems = [];
  for (const k of missing) problems.push(`  ${what}: no ${lang} translation for ${JSON.stringify(k)}`);
  for (const k of orphaned) {
    problems.push(`  ${what}: ${JSON.stringify(k)} is translated but no longer in assets/runs.js`);
  }
  return problems;
}

function narrationProblems(lang, narration) {
  const src = sourceStrings();
  const problems = [
    ...compare(lang, "scenario", src.scenarios, new Set(Object.keys(narration.scenarios))),
    ...compare(lang, "note", src.notes, new Set(Object.keys(narration.notes))),
    ...compare(lang, "sync", src.sync, new Set(Object.keys(narration.sync)))
  ];
  for (const key of Object.keys(narration.scenarios)) {
    for (const field of ["tag", "label", "caption"]) {
      if (typeof narration.scenarios[key][field] !== "string" || !narration.scenarios[key][field].trim()) problems.push(`  scenario: ${key} has no ${field}`);
    }
  }
  for (const group of ["notes", "sync"]) {
    for (const [key, value] of Object.entries(narration[group])) {
      if (typeof value !== "string" || !value.trim()) problems.push(`  ${group}: ${key} is empty`);
    }
  }
  return problems;
}

for (const [lang, narration] of Object.entries(NARRATIONS)) {
  const problems = narrationProblems(lang, narration);
  if (problems.length) throw new Error(`assets/runs.${lang}.js: ${problems.join("; ")}`);
}
if (process.argv.includes("--selftest")) {
  let checks = 0;
  for (const lang of ["ja", "de", "fr"]) {
    const valid = NARRATIONS[lang];
    assert.deepEqual(narrationProblems(lang, valid), []);
    const mutations = [
      (n) => { delete n.scenarios.change; },
      (n) => { n.scenarios.change.caption = ""; },
      (n) => { n.scenarios.change.label = "   "; },
      (n) => { delete n.notes[Object.keys(n.notes)[0]]; },
      (n) => { n.notes[Object.keys(n.notes)[0]] = ""; },
      (n) => { n.notes["# Removed source line"] = "Orphan"; },
      (n) => { delete n.sync["no drift"]; },
      (n) => { n.sync["no drift"] = ""; }
    ];
    for (const mutate of mutations) {
      const broken = structuredClone(valid);
      mutate(broken);
      assert(narrationProblems(lang, broken).length > 0, `${lang}: missing or orphaned narration must fail`);
      checks++;
    }
  }
  console.log(`build-runs: ${checks} narration refusal checks passed`);
  process.exit(0);
}

// What a session is called, and what is said about it, in one language.
function about(lang, key) {
  return lang === "en" ? RUNS.scenarios[key] : NARRATIONS[lang].scenarios[key];
}

// Narration inside a transcript. Everything else in a script is what the
// program printed and is the same text in every language.
function line(lang, kind, text) {
  if (lang !== "en" && kind === "note") return NARRATIONS[lang].notes[text];
  return text;
}

// Mirrors settle() in assets/site.js: the session at rest, every event
// committed in order. `wait` is a beat and `sync` moves the pill, so neither
// leaves a line behind.
function transcript(script, lang) {
  const rows = [];
  for (const [kind, text] of script) {
    if (kind === "wait" || kind === "sync") continue;
    if (kind === "blank") {
      rows.push("");
      continue;
    }
    // A note opens a step, and the typed run puts a blank row in front of it.
    // Printing it without one makes the printed session a different text.
    if (kind === "note" && rows.length && rows[rows.length - 1] !== "") {
      rows.push("");
    }
    let body = esc(line(lang, kind, text));
    if (kind === "cmd") body = `<span class="p">$</span> ${body}`;
    const cls = CLASS[kind];
    rows.push(cls ? `<span class="${cls}">${body}</span>` : body);
  }
  // One line, one block, exactly as paint() builds the live screen: a printed
  // session and a played one have to wrap the same way, or the page shows the
  // same transcript two shapes. That includes which lines refuse to wrap --
  // wideRuns() below is the same rule, and lives in assets/site.js too.
  const wide = wideRuns(rows);
  return rows
    .map((inner, i) => `<span class="${wide[i] ? "l l-wide" : "l"}">${inner || " "}</span>`)
    .join("");
}

const COLUMNS = /[^\s] {2,}\S/;
const TABLE_RULE = /^[-+=|\s]{8,}$/;

// A line whose meaning is its alignment: runs of spaces holding columns apart,
// or the rule that underlines them.
function tabular(html) {
  const text = html.replace(/<[^>]*>/g, "");
  return COLUMNS.test(text) || TABLE_RULE.test(text);
}

// Alignment is a property of a block, not of a line. `Artifact type:` is
// followed by one space because it is the widest label in its table, so on its
// own it looks like prose and wrapped away from the column it sets. A run of
// output lines is therefore wide if any line in it is, and a note, a command
// or a blank ends the run.
function wideRuns(rows) {
  const breaks = (html) =>
    html === "" || /<span class="c">/.test(html) || /<span class="p">/.test(html);
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

/* ---------- Interface dictionaries ----------
 *
 * Only the interface text lives here. Addresses are computed from `prefix` so
 * a link can be wrong in one place rather than in each language, and the pages
 * always point at each other.
 */

const LANGS = {
  en: {
    imageAlt: "The Ptah ASCII wordmark above the line: Database migrations without surprises.",
    code: "en",
    prefix: "",
    skip: "Skip to content",
    navLabel: "Site",
    docs: "Docs",
    install: "Install",
    inPractice: "In practice",
    playground: "Playground",
    operator: "Operator",
    theme: "Dark theme",
    menu: "Menu",
    footIssues: "Issues",
    footCommunity: "Community",
    footChangelog: "Changelog",
    footLicense: "License",
    title: "Ptah in practice",
    description:
      "Twenty-four recorded runs of Ptah: schema drift, versioned migrations, embedding cutover, OCI artifacts, format conversion and the Atlas-compatible surface. Read one, or watch it typed.",
    ogDescription: "Twenty-four recorded runs of Ptah. Read one, or watch it typed.",
    h1: "Ptah in practice",
    lede: `${RUNS.order.length} runs of Ptah, recorded at the terminal. Nothing here was written for the page. Open one to read it; Play types it out.`,
    quickStart: "Next: Quick start →",
    installPtah: "Install Ptah",
    speedLabel: "Playback speed, 1×. Press to change.",
    speedTitle: "Speed",
    play: "Play",
    playAria: "Play the demo",
    pause: "Pause",
    replay: "Replay",
    replayAria: "Replay the demo",
    expand: "Expand",
    expandAria: "Expand the demo",
    close: "Close",
    counts: (commands, lines) =>
      `${commands} command${commands === 1 ? "" : "s"} · ${lines} lines`,
    transcriptLabel: (label) => `${label} transcript`
  },
  ja: {
    imageAlt: "Ptah の ASCII ロゴと、データベースのマイグレーションについての英語の見出し。",
    code: "ja",
    prefix: "/ja",
    skip: "本文へスキップ",
    navLabel: "サイト",
    docs: "ドキュメント",
    install: "インストール",
    inPractice: "実践例",
    playground: "プレイグラウンド",
    operator: "オペレーター",
    theme: "ダークテーマ",
    menu: "メニュー",
    footIssues: "Issue",
    footCommunity: "コミュニティ",
    footChangelog: "変更履歴",
    footLicense: "ライセンス",
    title: "Ptah 実践例",
    description:
      "端末で記録した Ptah の実行 24 件。スキーマのドリフト、バージョン付きマイグレーション、埋め込みの切り替え、OCI アーティファクト、フォーマット変換、Atlas 互換のコマンド体系。読むこともできるし、打ち込まれる様子を見ることもできる。",
    ogDescription: "端末で記録した Ptah の実行 24 件。読んでもよいし、打ち込まれる様子を見てもよい。",
    // The one place プタハ appears on this page. Everywhere after it, Ptah.
    h1: "Ptah（プタハ）の実践例",
    // 再生 is what the button in the player says; naming it Play here would
    // send the reader looking for a control that is not on the page.
    lede: `端末で記録した Ptah の実行 ${RUNS.order.length} 件。ページのために書かれたものは一つもない。開けば読めるし、再生を押せば打ち込まれていく。`,
    quickStart: "次はクイックスタート →",
    installPtah: "Ptah をインストール",
    speedLabel: "再生速度 1×。押すと変わります。",
    speedTitle: "速度",
    play: "再生",
    playAria: "デモを再生",
    pause: "一時停止",
    replay: "最初から",
    replayAria: "デモを最初から再生",
    expand: "拡大",
    expandAria: "デモを拡大",
    close: "閉じる",
    counts: (commands, lines) => `コマンド ${commands} 件 · ${lines} 行`,
    // A run's name is a verb phrase -- スキーマを変更する -- so joining it to
    // のトランスクリプト across a space left a fragment with a space Japanese
    // does not write. 鉤括弧 close the name instead, which is what marks off a
    // title in Japanese and needs no space to do it.
    transcriptLabel: (label) => `「${label}」のトランスクリプト`
  },
  de: {
    code: "de", prefix: "/de", skip: "Zum Inhalt springen", navLabel: "Website",
    docs: "Dokumentation", install: "Installation", inPractice: "Praxisbeispiele",
    playground: "Testumgebung", operator: "Operator", theme: "Dunkles Design", menu: "Menü",
    footIssues: "Fehlerberichte", footCommunity: "Community", footChangelog: "Änderungsprotokoll", footLicense: "Lizenz",
    title: "Ptah in der Praxis",
    description: "24 aufgezeichnete Ptah-Abläufe: Schema-Drift, versionierte Migrationen, Embedding-Umschaltung, OCI-Artefakte, Formatkonvertierung und Atlas-kompatible Befehle. Als Text oder Wiedergabe.",
    ogDescription: "24 aufgezeichnete Ptah-Abläufe. Als Text lesen oder im Terminal abspielen.",
    imageAlt: "Der Ptah-Schriftzug in ASCII über einer englischen Überschrift zu Datenbankmigrationen.",
    h1: "Ptah in der Praxis",
    lede: `${RUNS.order.length} im Terminal aufgezeichnete Ptah-Abläufe. Die Ausgaben stammen aus echten Ausführungen. Öffnen Sie ein Beispiel zum Lesen oder wählen Sie Abspielen für die Wiedergabe.`,
    quickStart: "Weiter zum Schnellstart →", installPtah: "Ptah installieren",
    speedLabel: "Wiedergabegeschwindigkeit: 1×. Zum Ändern drücken.", speedTitle: "Geschwindigkeit",
    play: "Abspielen", playAria: "Demo abspielen", pause: "Pause", replay: "Erneut abspielen", replayAria: "Demo erneut abspielen",
    expand: "Vergrößern", expandAria: "Demo vergrößern", close: "Schließen",
    counts: (commands, lines) => `${commands} ${commands === 1 ? "Befehl" : "Befehle"} · ${lines} Zeilen`,
    transcriptLabel: (label) => `Transkript: ${label}`
  },
  fr: {
    code: "fr", prefix: "/fr", skip: "Aller au contenu", navLabel: "Navigation du site",
    docs: "Documentation", install: "Installation", inPractice: "En pratique",
    playground: "Bac à sable", operator: "Operator", theme: "Thème sombre", menu: "Menu",
    footIssues: "Signalements", footCommunity: "Communauté", footChangelog: "Historique des versions", footLicense: "Licence",
    title: "Ptah en pratique",
    description: "24 exécutions enregistrées de Ptah : dérive de schéma, migrations versionnées, bascule d’embeddings, artefacts OCI, conversion de formats et commandes compatibles Atlas. À lire ou à regarder.",
    ogDescription: "24 exécutions enregistrées de Ptah. Lisez-les ou regardez-les dans le terminal.",
    imageAlt: "Le nom Ptah en ASCII au-dessus d’un titre en anglais sur les migrations de bases de données.",
    h1: "Ptah en pratique",
    lede: `${RUNS.order.length} exécutions de Ptah enregistrées dans le terminal. Les sorties proviennent d’exécutions réelles. Ouvrez un exemple pour le lire ou appuyez sur Lire pour le regarder.`,
    quickStart: "Suite : démarrage rapide →", installPtah: "Installer Ptah",
    speedLabel: "Vitesse de lecture : 1×. Appuyez pour changer.", speedTitle: "Vitesse",
    play: "Lire", playAria: "Lire la démonstration", pause: "Pause", replay: "Relancer", replayAria: "Relancer la démonstration",
    expand: "Agrandir", expandAria: "Agrandir la démonstration", close: "Fermer",
    counts: (commands, lines) => `${commands} commande${commands === 1 ? "" : "s"} · ${lines} lignes`,
    transcriptLabel: (label) => `Transcription : ${label}`
  }
};

for (const code of Object.keys(LOCALES)) {
  for (const key of Object.keys(LANGS.en)) {
    if (typeof LANGS[code]?.[key] !== typeof LANGS.en[key] || LANGS[code][key] === "") {
      // The root prefix is intentionally empty only in English.
      if (key === "prefix" && code === "en") continue;
      throw new Error(`${code}: missing interface translation ${key}`);
    }
  }
}

function header(L, path) {
  return `<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${L.prefix}/"><img src="/assets/logo.svg" alt="" width="22" height="22">Ptah</a>
    <nav class="nav" aria-label="${L.navLabel}">
      <ul class="nav-links" id="nav-links">
        <li><a href="https://docs.ptah.run/">${L.docs}</a></li>
        <li><a href="${L.prefix}/install/">${L.install}</a></li>
        <li><a href="${L.prefix}/in-practice/" aria-current="page">${L.inPractice}</a></li>
        <li><a href="https://play.ptah.run/">${L.playground}</a></li>
        <li><a href="https://operator.ptah.run/">${L.operator}</a></li>
        <li><a href="https://github.com/stokaro/ptah">GitHub&nbsp;↗</a></li>
      </ul>
${langSwitch(L.code, path)}
      <button class="icon-btn theme-btn" type="button" aria-label="${L.theme}" aria-pressed="false">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.75a6.25 6.25 0 0 0 0 12.5z" fill="currentColor"/></svg>
      </button>
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="${L.menu}">
        <svg class="icon-menu" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 4h12M2 8h12M2 12h12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <svg class="icon-close" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </nav>
  </div>
</header>`;
}

function footer(L) {
  const note = L.code === "ja"
    ? '\n    <p class="foot-note">ドキュメント、プレイグラウンド、リポジトリへのリンクは、英語のページに続く。</p>'
    : "";
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="foot-brand"><img src="/assets/logo.svg" alt="" width="18" height="18"><span>ptah.run · <span class="v" data-version>v0.4.0</span> · pre-GA · MIT</span></div>
    <ul class="foot-links">
      <li><a href="https://github.com/stokaro/ptah">GitHub</a></li>
      <li><a href="https://github.com/stokaro/ptah/issues">${L.footIssues}</a></li>
      <li><a href="${L.prefix}/community/">${L.footCommunity}</a></li>
      <li><a href="https://github.com/stokaro/ptah/releases">${L.footChangelog}</a></li>
      <li><a href="https://github.com/stokaro/ptah/blob/master/LICENSE">${L.footLicense}</a></li>
    </ul>${note}
  </div>
</footer>`;
}

function controls(L) {
  return `        <span class="demo-controls" data-demo-controls hidden>
          <button class="demo-btn demo-btn-speed" type="button" data-demo-speed aria-label="${L.speedLabel}" title="${L.speedTitle}"><span data-demo-speed-label>1×</span></button>
          <button class="demo-btn" type="button" data-demo-toggle aria-label="${L.playAria}" title="${L.play}">
            <svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5.25 3.5h1.9v9h-1.9zM8.85 3.5h1.9v9h-1.9z" fill="currentColor"/></svg>
            <svg class="i-play" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5.5 3.4l7 4.6-7 4.6z" fill="currentColor"/></svg>
            <span class="i-pause">${L.pause}</span><span class="i-play">${L.play}</span>
          </button>
          <button class="demo-btn" type="button" data-demo-replay aria-label="${L.replayAria}" title="${L.replay}" hidden>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M13.2 8a5.2 5.2 0 1 1-1.75-3.9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12.4 1.9v2.9H9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>${L.replay}</span>
          </button>
          <button class="demo-btn" type="button" data-demo-expand aria-expanded="false" aria-label="${L.expandAria}" title="${L.expand}">
            <svg class="i-expand" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6.2 2.6H2.6v3.6M9.8 13.4h3.6V9.8M13.4 6.2V2.6H9.8M2.6 9.8v3.6h3.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <svg class="i-close" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span class="i-expand">${L.expand}</span><span class="i-close">${L.close}</span>
          </button>
        </span>`;
}

// What the tile says about a session before you open it: the first command it
// runs, and how much there is. Both are read off the script rather than typed
// out beside it, so neither can go stale.
function preview(script) {
  const cmd = script.find(([kind]) => kind === "cmd");
  return cmd ? cmd[1].replace(/\s*\\$/, "") : "";
}

function counts(L, script) {
  const commands = script.filter(([kind]) => kind === "cmd").length;
  const lines = script.filter(([kind]) => kind !== "wait" && kind !== "sync").length;
  return L.counts(commands, lines);
}

function tile(L, key) {
  const s = RUNS.scenarios[key];
  const t = about(L.code, key);
  return `        <li class="tile-slot">
          <button class="tile" type="button" data-demo-tile data-demo-scenario="${key}">
            <span class="tile-head">
              <span class="tile-name">${esc(t.label)}</span><span class="tile-tag">${esc(t.tag)}</span>
            </span>
            <span class="tile-note">${esc(t.caption)}</span>
            <span class="tile-cmd"><span class="tile-prompt">$</span> ${esc(preview(s.script))}</span>
            <span class="tile-meta">${counts(L, s.script)}</span>
          </button>
          <pre class="tile-transcript" aria-label="${esc(L.transcriptLabel(t.label))}">${transcript(s.script, L.code)}</pre>
        </li>`;
}

// Translated pages load the narration beside the sessions. The order matters
// only in that both are read by assets/site.js, which runs after them.
function runScripts(L) {
  const ja = L.code !== "en" ? `\n<script src="/assets/runs.${L.code}.js" defer></script>` : "";
  return `<script src="/assets/runs.js" defer></script>${ja}
<script src="/assets/site.js" defer></script>`;
}

function inPracticePage(L) {
  return `<!doctype html>
<html lang="${L.code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${L.title}</title>
<meta name="description" content="${L.description}">
<link rel="canonical" href="https://ptah.run${L.prefix}/in-practice/">
${alternates("/in-practice/")}
<meta name="go-import" content="ptah.run git https://github.com/stokaro/ptah">
<meta name="go-source" content="ptah.run https://github.com/stokaro/ptah https://github.com/stokaro/ptah/tree/master{/dir} https://github.com/stokaro/ptah/blob/master{/dir}/{file}#L{line}">
<meta name="theme-color" content="#fbfbfa" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#161311" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ptah">
<meta property="og:title" content="${L.title}">
<meta property="og:description" content="${L.ogDescription}">
<meta property="og:url" content="https://ptah.run${L.prefix}/in-practice/">
<meta property="og:image" content="https://ptah.run/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${L.imageAlt}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/instrument-sans-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/ibm-plex-mono-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<script>(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem("ptah-theme")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.setAttribute("data-theme",t);d.classList.add("js")})();</script>
</head>
<body>
<a class="skip" href="#main">${L.skip}</a>

${header(L, "/in-practice/")}

<main id="main" class="page">
  <div class="wrap">

    <div class="page-head">
      <h1>${L.h1}</h1>
      <p class="lede">${L.lede}</p>
    </div>

    <ul class="tiles">
${RUNS.order.map((key) => tile(L, key)).join("\n")}
    </ul>

    <div class="actions">
      <a class="btn" href="https://docs.ptah.run/edge/start/quick-start/">${L.quickStart}</a>
      <a class="btn btn-ghost" href="${L.prefix}/install/">${L.installPtah}</a>
    </div>

  </div>
</main>

<div class="term demo" data-demo data-demo-scenario="${RUNS.pinned[0]}" hidden>
  <div class="term-bar">
    <span class="demo-where">${esc(RUNS.scenarios[RUNS.pinned[0]].where)}</span>
    <span class="demo-sync" data-demo-sync hidden></span>
${controls(L)}
  </div>
  <pre class="demo-screen" data-demo-screen aria-hidden="true" hidden></pre>
  <pre class="demo-transcript" data-demo-transcript></pre>
  <div class="demo-progress" data-demo-progress hidden aria-hidden="true"><span></span></div>
</div>

<dialog class="demo-modal" data-demo-modal aria-labelledby="run-title">
  <div class="demo-modal-head">
    <h2 id="run-title" data-demo-title></h2>
    <p data-demo-caption></p>
  </div>
</dialog>

${footer(L)}

<div class="sr-only" role="status" id="copy-status"></div>
${runScripts(L)}
</body>
</html>
`;
}

/* ---------- Writing ---------- */

// The home page of each tree carries one session as its no-JS transcript.
// Written from the same data, between markers, so the two cannot drift.
const OPEN = "<!--session:transcript-->";
const CLOSE = "<!--/session:transcript-->";
const homeKey = RUNS.pinned[0];

function withHomeTranscript(html, path, lang) {
  const from = html.indexOf(OPEN);
  const to = html.indexOf(CLOSE);
  if (from < 0 || to < 0) {
    console.error(`${path} is missing the ${OPEN} … ${CLOSE} markers`);
    process.exit(1);
  }
  return (
    html.slice(0, from + OPEN.length) +
    transcript(RUNS.scenarios[homeKey].script, lang) +
    html.slice(to)
  );
}

// Every file this script owns, in every language: the generated page, and the
// home page whose transcript it writes between markers.
const targets = [];
for (const code of Object.keys(LOCALES)) {
  const L = LANGS[code];
  const dir = join(root, ...(L.prefix ? [code] : []));
  const homePath = join(dir, "index.html");
  const home = readFileSync(homePath, "utf8");
  targets.push(
    {
      path: join(dir, "in-practice", "index.html"),
      name: `${L.prefix}/in-practice/index.html`.replace(/^\//, ""),
      want: inPracticePage(L)
    },
    {
      path: homePath,
      name: `${L.prefix}/index.html`.replace(/^\//, ""),
      want: withHomeTranscript(home, homePath, code),
      transcriptOnly: true
    }
  );
}

if (process.argv.includes("--check")) {
  let failed = false;
  for (const t of targets) {
    let current = "";
    try {
      current = readFileSync(t.path, "utf8");
    } catch {
      console.error(`${t.name} does not exist; run scripts/build-runs.mjs`);
      failed = true;
      continue;
    }
    if (current !== t.want) {
      const what = t.transcriptOnly ? "transcript is" : "is";
      console.error(`${t.name}'s ${what} out of date; run scripts/build-runs.mjs`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log(`all in-practice pages and home transcripts are current`);
} else {
  for (const t of targets) {
    mkdirSync(dirname(t.path), { recursive: true });
    writeFileSync(t.path, t.want);
  }
  console.log(
    `wrote ${Object.keys(LOCALES).length} in-practice pages (${RUNS.order.length} runs each) and home transcripts`
  );
}

#!/usr/bin/env node
/* Write sessions/index.html from assets/demos.js.
 *
 * The page prints every session as a transcript, which is what a reader
 * without JavaScript gets and what a reader who does not want to wait for a
 * typewriter reads. The player takes over one block at a time from the same
 * data. Both come from one file so neither can drift from the other.
 *
 *   node scripts/build-sessions.mjs           write the page
 *   node scripts/build-sessions.mjs --check   fail when it is out of date
 */

import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(root, "sessions", "index.html");
const require = createRequire(import.meta.url);
const SESSIONS = require(join(root, "assets", "demos.js"));

// The same mapping the player uses. A kind missing here renders unwrapped,
// which is what an ordinary line of output is.
const CLASS = { mute: "m", sql: "a", new: "n", err: "e", note: "c" };

const esc = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Mirrors settle() in assets/site.js: the session at rest, every event
// committed in order. `wait` is a beat and `sync` moves the pill, so neither
// leaves a line behind.
function transcript(script) {
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
    let body = esc(text);
    if (kind === "cmd") body = `<span class="p">$</span> ${body}`;
    const cls = CLASS[kind];
    rows.push(cls ? `<span class="${cls}">${body}</span>` : body);
  }
  // One line, one block, exactly as paint() builds the live screen: a printed
  // session and a played one have to wrap the same way, or the page shows the
  // same transcript two shapes.
  return rows.map((inner) => `<span class="l">${inner || " "}</span>`).join("");
}

const controls = `        <span class="demo-controls" data-demo-controls hidden>
          <button class="demo-btn demo-btn-speed" type="button" data-demo-speed aria-label="Playback speed, 1×. Press to change." title="Speed"><span data-demo-speed-label>1×</span></button>
          <button class="demo-btn" type="button" data-demo-toggle aria-label="Play the demo" title="Play">
            <svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5.25 3.5h1.9v9h-1.9zM8.85 3.5h1.9v9h-1.9z" fill="currentColor"/></svg>
            <svg class="i-play" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5.5 3.4l7 4.6-7 4.6z" fill="currentColor"/></svg>
            <span class="i-pause">Pause</span><span class="i-play">Play</span>
          </button>
          <button class="demo-btn" type="button" data-demo-replay aria-label="Replay the demo" title="Replay" hidden>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M13.2 8a5.2 5.2 0 1 1-1.75-3.9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12.4 1.9v2.9H9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Replay</span>
          </button>
          <button class="demo-btn" type="button" data-demo-expand aria-expanded="false" aria-label="Expand the demo" title="Expand">
            <svg class="i-expand" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6.2 2.6H2.6v3.6M9.8 13.4h3.6V9.8M13.4 6.2V2.6H9.8M2.6 9.8v3.6h3.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <svg class="i-close" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span class="i-expand">Expand</span><span class="i-close">Close</span>
          </button>
        </span>`;

// What the tile says about a session before you open it: the first command it
// runs, and how much there is. Both are read off the script rather than typed
// out beside it, so neither can go stale.
function preview(script) {
  const cmd = script.find(([kind]) => kind === "cmd");
  return cmd ? cmd[1].replace(/\s*\\$/, "") : "";
}

function counts(script) {
  const commands = script.filter(([kind]) => kind === "cmd").length;
  const lines = script.filter(([kind]) => kind !== "wait" && kind !== "sync").length;
  return `${commands} command${commands === 1 ? "" : "s"} · ${lines} lines`;
}

function tile(key) {
  const s = SESSIONS.scenarios[key];
  const pinned = SESSIONS.pinned.includes(key);
  return `        <li class="tile-slot">
          <button class="tile" type="button" data-demo-tile data-demo-scenario="${key}">
            <span class="tile-head">
              <span class="tile-name">${esc(s.label)}</span>${
                pinned ? '<span class="tile-tag">Home page</span>' : ""
              }
            </span>
            <span class="tile-note">${esc(s.caption)}</span>
            <span class="tile-cmd"><span class="tile-prompt">$</span> ${esc(preview(s.script))}</span>
            <span class="tile-meta">${counts(s.script)}</span>
          </button>
          <pre class="tile-transcript" aria-label="${esc(s.label)} transcript">${transcript(s.script)}</pre>
        </li>`;
}

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ptah sessions</title>
<meta name="description" content="Every Ptah demo session in full: schema drift, versioned migrations, embedding cutover, OCI artifacts, format conversion and the Atlas-compatible surface. Read the transcript or watch it typed.">
<link rel="canonical" href="https://ptah.run/sessions/">
<meta name="go-import" content="ptah.run git https://github.com/stokaro/ptah">
<meta name="go-source" content="ptah.run https://github.com/stokaro/ptah https://github.com/stokaro/ptah/tree/master{/dir} https://github.com/stokaro/ptah/blob/master{/dir}/{file}#L{line}">
<meta name="theme-color" content="#fbfbfa" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#161311" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ptah">
<meta property="og:title" content="Ptah sessions">
<meta property="og:description" content="Every Ptah demo session in full. Read the transcript or watch it typed.">
<meta property="og:url" content="https://ptah.run/sessions/">
<meta property="og:image" content="https://ptah.run/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Ptah ASCII wordmark above the line: Database migrations without surprises.">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/instrument-sans-var-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/ibm-plex-mono-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<script>(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem("ptah-theme")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.setAttribute("data-theme",t);d.classList.add("js")})();</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/"><img src="/assets/logo.svg" alt="" width="22" height="22">Ptah</a>
    <nav class="nav" aria-label="Site">
      <ul class="nav-links" id="nav-links">
        <li><a href="/sessions/" aria-current="page">Sessions</a></li>
        <li><a href="https://docs.ptah.run/">Docs</a></li>
        <li><a href="/install/">Install</a></li>
        <li><a href="https://github.com/stokaro/ptah">GitHub&nbsp;↗</a></li>
      </ul>
      <button class="icon-btn theme-btn" type="button" aria-label="Dark theme" aria-pressed="false">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.75a6.25 6.25 0 0 0 0 12.5z" fill="currentColor"/></svg>
      </button>
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Menu">
        <svg class="icon-menu" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 4h12M2 8h12M2 12h12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <svg class="icon-close" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </nav>
  </div>
</header>

<main id="main" class="page">
  <div class="wrap">

    <div class="page-head">
      <h1>Sessions</h1>
      <p class="lede">${SESSIONS.order.length} recorded sessions. Every command and every line of output was captured by running Ptah; nothing here is executed and nothing is invented. Open one to read the whole transcript at once, or press Play to watch it typed.</p>
      <p class="meta"><span>Two of them are always on the home page; the rest take turns there, two per visit.</span></p>
    </div>

    <ul class="tiles">
${SESSIONS.order.map(tile).join("\n")}
    </ul>

    <div class="actions">
      <a class="btn" href="https://docs.ptah.run/edge/start/quick-start/">Next: Quick start →</a>
      <a class="btn btn-ghost" href="/install/">Install Ptah</a>
    </div>

  </div>
</main>

<div class="term demo" data-demo data-demo-scenario="${SESSIONS.pinned[0]}" hidden>
  <div class="term-bar">
    <span class="demo-where">${esc(SESSIONS.scenarios[SESSIONS.pinned[0]].where)}</span>
    <span class="demo-sync" data-demo-sync hidden></span>
${controls}
  </div>
  <pre class="demo-screen" data-demo-screen aria-hidden="true" hidden></pre>
  <pre class="demo-transcript" data-demo-transcript></pre>
  <div class="demo-progress" data-demo-progress hidden aria-hidden="true"><span></span></div>
</div>

<dialog class="demo-modal" data-demo-modal aria-labelledby="session-title">
  <div class="demo-modal-head">
    <h2 id="session-title" data-demo-title></h2>
    <p data-demo-caption></p>
  </div>
</dialog>

<footer class="site-footer">
  <div class="wrap">
    <div class="foot-brand"><img src="/assets/logo.svg" alt="" width="18" height="18"><span>ptah.run · <span class="v" data-version>v0.4.0</span> · pre-GA · MIT</span></div>
    <ul class="foot-links">
      <li><a href="https://github.com/stokaro/ptah">GitHub</a></li>
      <li><a href="https://github.com/stokaro/ptah/issues">Issues</a></li>
      <li><a href="https://github.com/stokaro/ptah/releases">Changelog</a></li>
      <li><a href="https://github.com/stokaro/ptah/blob/master/LICENSE">License</a></li>
    </ul>
  </div>
</footer>

<div class="sr-only" role="status" id="copy-status"></div>
<script src="/assets/demos.js" defer></script>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;

// The home page carries one session as its no-JS transcript. Written from the
// same data, between markers, so the two cannot drift.
const homePath = join(root, "index.html");
const homeKey = SESSIONS.pinned[0];
const OPEN = "<!--session:transcript-->";
const CLOSE = "<!--/session:transcript-->";

function withHomeTranscript(html) {
  const from = html.indexOf(OPEN);
  const to = html.indexOf(CLOSE);
  if (from < 0 || to < 0) {
    console.error(`index.html is missing the ${OPEN} … ${CLOSE} markers`);
    process.exit(1);
  }
  return (
    html.slice(0, from + OPEN.length) +
    transcript(SESSIONS.scenarios[homeKey].script) +
    html.slice(to)
  );
}

const home = readFileSync(homePath, "utf8");
const homeNext = withHomeTranscript(home);

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(out, "utf8");
  } catch {
    console.error("sessions/index.html does not exist; run scripts/build-sessions.mjs");
    process.exit(1);
  }
  if (current !== page) {
    console.error("sessions/index.html is out of date; run scripts/build-sessions.mjs");
    process.exit(1);
  }
  if (home !== homeNext) {
    console.error(`index.html's transcript is out of date; run scripts/build-sessions.mjs`);
    process.exit(1);
  }
  console.log("sessions/index.html and the home transcript are current");
} else {
  writeFileSync(out, page);
  writeFileSync(homePath, homeNext);
  console.log(`wrote sessions/index.html (${SESSIONS.order.length} sessions) and the ${homeKey} transcript in index.html`);
}

# ptah.run

The website for [Ptah](https://github.com/stokaro/ptah), served at
<https://ptah.run> from GitHub Pages.

The site is built with [Astro](https://astro.build), the engine and the
release docs.ptah.run is built with, and published as static files. The
documentation is a separate site, <https://docs.ptah.run>, built from
`docs/site` in the `stokaro/ptah` repository; this repository only holds the
pages served at `ptah.run` itself.

## Layout

| Path | What it is |
| --- | --- |
| `src/pages/` | The routes: `/`, `/install/`, `/in-practice/`, `/community/` and the 404, and the same four under `[lang]/` for Japanese, German and French |
| `src/components/pages/` | One component per page, rendered once per language |
| `src/components/home/` | The homepage sections, after the 5a design; the three diagrams are the design's SVG with the labels made translatable |
| `src/layouts/Base.astro` | Every page's head, header and footer: canonical and alternate links, the Go import tags, the theme bootstrap |
| `src/i18n/home.{en,ja,de,fr}.mjs` | The homepage copy; English is the source, and a translation with a missing or extra key stops the build |
| `src/i18n/ui.mjs` | Interface text shared by every page (navigation, footer, player, in-practice page) |
| `src/fragments/<lang>/{install,community}.html`, `src/fragments/404.html` | The authored install, community and 404 pages, as HTML |
| `src/data/captures/*.json` | Every command and output the homepage shows, as Ptah printed it (see "Content rules") |
| `src/data/captures.mjs` | Selects and arranges the captures for the page; it never writes output of its own |
| `src/data/release.json` | The release named on the pages when the build is not given one |
| `src/lib/runs.mjs` | Reads the recorded runs and writes their printed transcripts |
| `src/lib/site.mjs` | Languages, addresses, the release version, the Go import tags |
| `src/styles/site.css`, `src/styles/home.css` | Tokens, layout and both themes; the homepage's sections |
| `src/scripts/widgets.js` | The homepage's switchers: every state is rendered at build time and this picks the one that shows |
| `public/assets/site.js` | Theme toggle, mobile menu, copy buttons, install tabs, release-version refresh, the player |
| `public/assets/runs.js` | Every recorded session: the commands, the output and the demo's narration |
| `public/assets/runs.{ja,de,fr}.js` | Localized narration, keyed by the English it replaces |
| `public/assets/fonts/` | Self-hosted font subsets and their licenses |
| `public/assets/logo.svg`, `public/favicon.svg` | The Ptah mark, copied from `stokaro/ptah` (`docs/site/src/assets/logo.svg`) |
| `public/og.png`, `public/apple-touch-icon.png`, `public/favicon.ico` | Generated from the mark and the ASCII wordmark |
| `public/testkit/index.html` | The go-import page for `ptah.run/testkit` (see "Go vanity import path") |
| `public/CNAME` | The custom domain, as a record (see "Deployment settings") |
| `public/robots.txt`, `public/sitemap.xml` | Crawl policy and the indexable URLs; add a row to the sitemap when a page is added |
| `install.sh`, `install.ps1` | Not in git: the deploy fetches them into `dist/` from `docs/site/public/` on the master branch of `stokaro/ptah` (see "Installers") |
| `scripts/check-runs.mjs` | Proves that incomplete run narration is refused |
| `scripts/check-links.mjs` | Every local link on a built page names a file that exists; no `github.io` address |
| `scripts/check-locales.mjs` | Locale coverage, links, metadata, indexability and the release on every page |
| `scripts/check-japanese.mjs` | Bounded typography checks for Japanese HTML and runtime labels |
| `scripts/check-browser.mjs` | Responsive and interaction checks; saves screenshots and layout readings |
| `scripts/locales.mjs` | The language list for the checks, re-exported from `src/lib/site.mjs` |
| `TRANSLATING.md` | Translation guidance, contextual Japanese terminology and project typography conventions |
| `.github/workflows/deploy.yml` | Builds, checks, builds again with the latest release and deploys `dist/` to GitHub Pages |
| `LICENSE` | MIT, for the site's own code |

## Working on it

```sh
npm ci
npm run dev        # http://localhost:4321/
npm run build      # writes dist/
npm run check      # reads dist/: runs, links, languages, Japanese typography
npx playwright install chromium
npm run check:browser
```

Every check reads the built site in `dist/`, because that is what is
published. Build first. The checks discover the pages there and hold a floor on
how many they find, so an empty build fails rather than passing on nothing.

Every push to `main` deploys. A new page needs a route in `src/pages/` and in
`src/pages/[lang]/`, and a row in `public/sitemap.xml`;
`scripts/check-locales.mjs` fails until the page exists in every language and
the sitemap lists it.

## Languages

The site is served in English at `/`, Japanese at `/ja/`, German at `/de/`
and French at `/fr/`. Each tree has a homepage, installation page, recorded
examples and community page. The existing English and Japanese URLs stay fixed.
The English pages are the content source for every translation.

Each page carries its own absolute canonical URL and alternate links for all
four languages, including itself. `x-default` names the equivalent English
page. The sitemap lists each canonical URL once; alternates live in HTML.
The language picker uses native `details` and ordinary links to the equivalent
page, so it works without JavaScript. No browser language or location redirects
select a language for the reader.

Two pages stand alone, with reasons in `scripts/check-locales.mjs`: `404.html`
is the domain-wide English/Japanese error page, and `testkit/index.html` is a
Go vanity import endpoint. Neither is a localized landing page.

Documentation, quick starts and the playground stay in English. Translated
links use concise labels without parenthetical language notices and keep the
existing destination URLs. No localized documentation routes are created here.

**Recorded output is not translated.** Commands, flags, SQL, file names and
anything Ptah printed are what the program did; a transcript that changed them
would be a different recording. What is translated is the narration: the
page's own prose, the name a session goes by and the sentence under it, the
state pill in the terminal bar, and the `#` comments the demo types to say what
is about to happen. Those comments were always the demo speaking rather than
Ptah, which is why they translate and the lines around them do not.

**In Japanese, the product's name is written `Ptah（プタハ）` once**, at the first mention in
a page's own prose, and `Ptah` everywhere after it. Not the kana again, and not
a mix. `scripts/check-locales.mjs` holds the count and the position: a page that
gives the reading twice, spells it some other way, or never gives it at all
fails, and so does one that writes a bare `Ptah` in prose above the gloss, which
hands the reader the reading after they needed it. The `<head>`, the header
wordmark, code and attribute values are read past, because none of them is a
sentence somebody reads in order. The `<h1>` is one, and is where two of these
pages correctly place the gloss.

That rule is not this repository's. It is section 17 of `docs/STYLE_GUIDE.md` in
`stokaro/ptah`, where `check-translations.mjs` holds `README.ja.md` to the same
thing. The two repositories share no module, so the rule is copied rather than
imported: change the style guide first, then both readers.

Japanese is not subset and self-hosted the way the Latin faces are -- a usable
Japanese face is megabytes, and every platform this site is read on ships one.
`--sans-jp` and `--mono-jp` keep Instrument Sans and IBM Plex Mono at the front
of the stack, so a sentence with a command in it still sets the command in the
same face and only the kana and kanji fall through to the system.

### Keeping translations complete

`src/lib/runs.mjs` writes every in-practice page and the homepage transcript
from the same commands and output in `public/assets/runs.js`. Narration lives
in `public/assets/runs.{ja,de,fr}.js`; missing, empty or orphaned entries stop
the build, and `scripts/check-runs.mjs` proves that they still do. The browser
also refuses incomplete dictionaries instead of substituting English. The
static localized transcript remains readable.

The homepage copy is `src/i18n/home.{en,ja,de,fr}.mjs`. A translation carries
every key the English has, with the same kind of value, and the same inline
code, links and exit codes in each sentence; anything else stops the build.

`scripts/check-locales.mjs` compares commands, link destinations, controls,
anchors and version stamps across languages. Written commands in `code` and
`pre` elements are compared with occurrence counts, as well as copy-button
payloads; generated transcripts are checked separately, and translated flow
diagrams are excluded.
Internal links must lead to the equivalent page in the selected language.
Canonical links, language alternatives and the picker are checked separately
by exact value.
Fixture tests exercise command extraction, including repeated literals, without
pinning the amount of page content. The gate checks complete switches, self
canonicals, reciprocal alternatives, metadata, translated descriptions,
accessibility labels, sitemap coverage and indexability. Its refusal tests
remove required content and break links to show that the gate catches them.
It also holds every page to one release version.

Browser checks require Node.js and the pinned development dependency;
they do not change the site's static deployment:

```sh
npm ci
npx playwright install chromium
npm run check
npm run check:browser
```

The browser check measures all four page types at mobile, tablet and desktop
widths, in both themes, with and without JavaScript. It follows all language
switches and exercises mobile navigation, installation tabs, copy status and
the transcript player. Screenshots of the Japanese, German and French homepages and
layout readings go to `artifacts/locales/`, or `SCREENSHOT_DIR`. CI uploads
them as `localization-browser-checks`.

`TRANSLATING.md` records Japanese terminology as editorial guidance. The style
check covers heading and title punctuation, Japanese/Latin spacing in prose,
link notices and sampled runtime labels from `public/assets/site.js`. Its fixtures
exercise refusals and valid ordinary words; it does not enforce a glossary or
claim to measure translation quality. `npm run check` includes this check.

These checks detect missing content and structural drift. Translation meaning
still needs review against the current English page when that page changes.

## Deployment settings

GitHub Pages for this repository is configured once, outside the files here:
the source is **GitHub Actions** (not "deploy from a branch"), and the custom
domain `ptah.run` is set under Settings → Pages. With an Actions deploy the
`CNAME` file in the repository does not configure the domain by itself; it is
kept so the repository states the domain it is meant to serve, and the deploy
workflow checks it still says `ptah.run`. "Enforce HTTPS" can be turned on once
GitHub has issued the certificate for the domain.

## Installers

`https://ptah.run/install.sh` and `https://ptah.run/install.ps1` are the
installers from the master branch of `stokaro/ptah` (`docs/site/public/`).
The deploy workflow fetches both with the Actions token, checks that they are
non-trivial and that the shell script parses, and uploads them with the pages.
Nothing is committed here, so the site cannot serve a stale copy; a fetch that
fails stops the deploy and the previous deployment stays live. Because the
workflow also runs every six hours, a change on master reaches ptah.run within
that window, or at once through the `installers-updated` dispatch that
`stokaro/ptah` sends when either script changes on master.

## Content rules

Addresses on the pages are `ptah.run` addresses: the installers, the docs at
`docs.ptah.run`, the repository on `github.com`. No `github.io` address appears
on any page; the deploy workflow refuses one.

Every command, output line, database name and claim on these pages comes from
the `stokaro/ptah` repository and its documentation site. When a command or its
output changes there, change it here. Do not invent output.

Each command in the demo is introduced by a `#` comment saying what is about to
happen. The comment and the command under it are one thought, so the reader is
not held at the end of the comment while the command it announces waits: half of
what that comment was worth to read is owed forward and spent on the beat before
the next step is announced. A page that opens on a comment otherwise holds you
there before anything has happened. Those lines are the demo's own narration, not Ptah's output, and the
shell's comment syntax is what makes the difference legible; they are set dimmer
than Ptah's muted lines for the same reason. Write them as intent -- what the
reader is about to see and why -- and never as a claim about what a command
prints, which is the transcript's job.

The hero demo is held to that rule hardest, because it moves. Every session in
`public/assets/runs.js` was captured by running Ptah, not written. The schema one is
the documented direct quick start
(`docs/site/src/content/docs/start/quick-start-direct.mdx`) executed against a
real `app.db`; the rest were run on Linux against a throwaway sqlite database in
`/tmp/app`, which is why absolute paths in the transcripts read the way they do.
Output shown is stdout: the scanning, dependency-order and progress lines these
commands write go to stderr and are not what a reader sees in a pipeline.
Trimming a long block to its telling lines is what a transcript does and is
allowed; reordering it, or writing a line Ptah did not print, is not.
Re-capture rather than edit when a diagnostic changes wording.

Every run lives in `public/assets/runs.js`, which the homepage and every
in-practice page load and `src/lib/runs.mjs` reads. Adding one is an entry in
`SCENARIOS` plus its key in `order`, and its narration in every
`public/assets/runs.{ja,de,fr}.js` dictionary. The build refuses to finish
while a translation has a hole in it, so the order those edits happen in does
not matter.

Each run carries one tag, and `order` groups the grid by it. The vocabulary is
eight words -- Schema change, Inference, Safety, Go annotations, Inspection,
Exports, Registry, Atlas -- and it exists to be scanned, so a ninth needs a
reason better than "this one does not fit the eight". A tag scattered over a
grid is decoration; the same tag three cards running is a section, which is why
the order is grouped rather than being the order the runs were written in.

The homepage plays the schema cycle in its hero and links five more by their
own titles; `/in-practice/#run-<key>` opens a run directly.

`/in-practice/` is the whole set as a grid. A tile carries the run's name, its
tag, one sentence, the first command it runs and how much there is; pressing one opens the
overlay, which grows out of the tile it came from and shrinks back into it. The
overlay opens settled -- the whole transcript at once, because a reader who came
to read should not have to wait for a typewriter -- with Play beside it for one
who would rather watch.

Twenty-four transcripts stacked down a column was the first shape and the wrong
one: nobody reaches the bottom of a fifteen-thousand-pixel page. The transcripts
are still in the markup behind each tile and are what the page is without
JavaScript, where the tiles do nothing and are hidden. With it they are
`display: none`, because twenty-four transcripts in the tab order would be
twenty-four detours around the thing the tile is for.

The in-practice pages and the homepage transcript are written by the build,
so a run edited in `public/assets/runs.js` cannot ship a page that disagrees
with the player. `transcript()` in `src/lib/runs.mjs` mirrors `settle()` in
`public/assets/site.js` line for line; when one changes, change the other.

The terminal scrolls and expands. Scrolling follows the newest line only while
the reader is already at the bottom, so scrolling back to re-read a finding is
not undone by the next one. Expanding moves the same node into a `<dialog>` --
the same session, still playing -- because the hero column is half a page wide
and Ptah's diagnostics are sentences. The frame travels between the two places
rather than one panel vanishing and another appearing: the move is measured
before and after and played back as a transform. Leaving is not entering in
reverse -- arriving is a reveal and can take its time, dismissing should get out
of the way -- so the dim and the overlay's head go in about a sixth of a second
while the frame is still travelling. They arrive together too: the head fades up
with the dim rather than landing on the page at full strength, a beat behind the
frame that is already moving. `[open]` is still on the dialog through all
of that, and outranks a bare `.is-leaving`, which is why the leaving rule has to
carry it too. The page underneath is locked while the overlay is up; the
terminal inside it keeps its own scroll. Expanded it runs
once and stops on its last frame, because opening it is a choice to watch; in
the hero it comes round again, because a reader arriving mid-session should not
have to guess what the first half said.

Playback speed cycles 0.5x, 1x, 2x, 3x. The scripts, the beat lengths and the
progress rule are all in planned milliseconds; the rate turns those into real
milliseconds in `after()` and in the progress transition, and nowhere else, so
the bar and the keyboard cannot disagree about where in the session they are.
A speed change re-times the beat already in flight, or the control reads as
broken during a four-second pause.

Each line on screen is its own block, so a line too long for the frame wraps
under its own indent rather than restarting at column zero. A Go annotation or
a lint diagnostic broken the other way reads as a new top-level line, which is
the one thing the shape of a transcript is supposed to tell you.

Lines whose meaning is their alignment are the exception: they scroll sideways
instead, because a column header wrapped over three lines is not a narrow table.
Alignment is judged per block, not per line -- `Artifact type:` is followed by
one space because it is the widest label in its table, and on its own it looks
like prose -- so a run of output lines is wide when any line in it is, and a
note, a command or a blank ends the run. `wideRuns()` says it in both
`public/assets/site.js` and `src/lib/runs.mjs`; when one changes, change the
other.

The hero's session is also in each language's homepage as a transcript. That
is the page without JavaScript, and it is what a crawler and a screen reader
read; the player hides it from sight and replays it. The build writes it from
the same run, so the two cannot drift.

Everything else the homepage shows as a command or as output -- the "Try it"
matrix, the three scenarios, the five source formats, the ORM loader, the seven
export targets, the agent session and the inference plan -- is in
`src/data/captures/*.json`: the files a run used, the command, its stdout,
stderr and exit code, and the Ptah release and machine it ran on. Every one of
them ran on Ptah v0.7.0. `src/data/captures.mjs` selects and arranges them and
never writes output of its own; a command it splits over two lines for the
width of a frame is checked against the command that ran. Re-capture rather
than edit when Ptah's output changes.

The release version on the pages has three layers. `src/data/release.json`
holds the last release known when it was committed, and a local build names
it. The deploy workflow asks the GitHub API for the latest `stokaro/ptah`
release and builds with it in `PTAH_VERSION`, which reaches every element
marked `data-version` or `data-version-bare`; the workflow also runs on a
schedule every six hours and on the `ptah-release` and `installers-updated`
repository dispatches that `stokaro/ptah` sends, so the served value stays
recent. In the browser, `public/assets/site.js` asks the same API once per
session and rewrites the elements again; when that request fails (offline,
anonymous rate limit), the deploy-time value stands. Bump the committed value
occasionally so a local build is not far off.

The ASCII wordmark in the hero and in `og.png` is the one the binaries print
on their entry screen: copy it verbatim from `cmd/internal/banner/banner.go` in
`stokaro/ptah` (the design handoff carried an older, narrower variant).

Documentation links point at the `edge` build of the docs site
(`https://docs.ptah.run/edge/...`), the same choice the Ptah README makes: it
always exists and always documents the current command tree, and the docs site
has a version switcher. Do not "fix" them to a release path without changing
this rule.

Design source: the "Ptah website" design project (5a for the homepage at 1280,
5b at 390 and 5c at 1024; 1d for install, 1g for dark mode). Type is Instrument Sans for
prose and interface chrome and IBM Plex Mono for anything that can be pasted
into a terminal; the ASCII wordmark is set in the system monospace stack
(`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
"Courier New", monospace`), the way a terminal would show it. Two-pixel radii,
one-pixel rules, no shadows; the primary button is black, blue is reserved for
links.

## Go vanity import path

Every page, the 404 page included, carries

```html
<meta name="go-import" content="ptah.run git https://github.com/stokaro/ptah">
```

so `go get ptah.run/...` resolves to the repository: the `go` tool fetches
`https://ptah.run/<import path>?go-get=1`, reads the tag from whatever page
comes back (GitHub Pages answers unknown paths with `404.html`, and `go`
accepts the tag from a 404 response), then confirms it against
`https://ptah.run/?go-get=1`. A `go-source` tag beside it gives pkg.go.dev
links to files and lines on GitHub.

Both halves of that are in place: `go.mod` in `stokaro/ptah` declares
`module ptah.run`, and v0.4.0 is the first release carrying it. The tooling note
on the page names `ptah.run` accordingly. The install commands never needed the
switch -- they fetch a script over HTTPS rather than resolving a module path.

## Domain

DNS for `ptah.run` points at GitHub Pages:

| Record | Value |
| --- | --- |
| `A` (apex) | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `AAAA` (apex) | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |

There is no `www` record yet. Adding `CNAME www` → `stokaro.github.io` (DNS
only) would make GitHub redirect `www.ptah.run` to the apex. Keep the
Cloudflare proxy off for every record that points at GitHub Pages so GitHub can
issue and renew the TLS certificate.

## Fonts

The fonts under `public/assets/fonts/` are subsets served by Google Fonts and licensed
under the SIL Open Font License 1.1; the license texts sit beside the files.
`*-symbols.woff2` files carry only the box-drawing and arrow glyphs the ASCII
diagrams use, so those glyphs stay in the same face as the text around them.

## License

MIT. See [LICENSE](LICENSE). Ptah itself is licensed separately in its own
repository.

# ptah.run

The website for [Ptah](https://github.com/stokaro/ptah), served at
<https://ptah.run> from GitHub Pages.

The site is static HTML, CSS and a small script with no application build step. The
documentation is a separate site, <https://docs.ptah.run>, built from
`docs/site` in the `stokaro/ptah` repository; this repository only holds the
pages served at `ptah.run` itself.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Homepage |
| `install/index.html` | Install page with platform-detecting tabs |
| `in-practice/index.html` | The recorded runs as a grid; generated (see "Recorded runs") |
| `community/index.html` | Community page: where to ask, report a bug or a vulnerability, and contribute |
| `ja/**`, `de/**`, `fr/**` | Japanese, German and French; one page per English page (see "Languages") |
| `404.html` | Not-found page (GitHub Pages serves it for unknown paths), in English and Japanese |
| `assets/site.css` | The one stylesheet: tokens, layout, light and dark themes |
| `assets/site.js` | Theme toggle, mobile menu, copy buttons, install tabs, release-version refresh |
| `assets/runs.js` | Every recorded session: the commands, the output and the demo's narration |
| `assets/runs.{ja,de,fr}.js` | Localized narration, keyed by the English it replaces |
| `assets/fonts/` | Self-hosted font subsets and their licenses |
| `assets/logo.svg`, `favicon.svg` | The Ptah mark, copied from `stokaro/ptah` (`docs/site/src/assets/logo.svg`) |
| `og.png`, `apple-touch-icon.png`, `favicon.ico` | Generated from the mark and the ASCII wordmark |
| `install.sh`, `install.ps1` | Not in git: the deploy fetches them from `docs/site/public/` on the master branch of `stokaro/ptah` (see "Installers") |
| `CNAME` | The custom domain, as a record (see "Deployment settings") |
| `robots.txt`, `sitemap.xml` | Crawl policy and the indexable URLs; add a row to the sitemap when a page is added |
| `.nojekyll` | Tells GitHub Pages not to run Jekyll over the files |
| `LICENSE` | MIT, for the site's own code |
| `scripts/stamp-version.mjs` | Writes a release tag into the pages; run by the deploy workflow |
| `scripts/build-runs.mjs` | Writes all in-practice pages and home transcripts from `assets/runs.js` |
| `scripts/check-locales.mjs` | Checks locale coverage, links, metadata and indexability |
| `scripts/locales.mjs` | Language names, paths, alternate links and the shared language picker |
| `scripts/check-browser.mjs` | Responsive and interaction checks; saves screenshots and layout readings |
| `.github/workflows/deploy.yml` | Checks local references, stamps the latest release, deploys to GitHub Pages |

## Working on it

Serve the directory with any static file server. Absolute paths (`/assets/...`)
are used throughout, so open the site from the repository root:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

Every push to `main` deploys. The workflow first checks that every local
`href`/`src` on the pages points at a file that exists. It finds the pages with
`git ls-files`, so adding one needs no edit there; what a new page does need is
counterparts in every language, a row in `sitemap.xml` and an entry in
`PAGES` in `scripts/stamp-version.mjs`, which cannot discover anything because
it has to run on a bare copy of the pages. `scripts/check-locales.mjs` fails
until all three are done.

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
a mix. `scripts/check-locales.mjs` counts it: a Japanese page that gives the
reading twice, spells it some other way, or never gives it at all, fails.

Japanese is not subset and self-hosted the way the Latin faces are -- a usable
Japanese face is megabytes, and every platform this site is read on ships one.
`--sans-jp` and `--mono-jp` keep Instrument Sans and IBM Plex Mono at the front
of the stack, so a sentence with a command in it still sets the command in the
same face and only the kana and kanji fall through to the system.

### Keeping translations complete

`scripts/build-runs.mjs` generates every in-practice page and homepage
transcript from the same commands and output in `assets/runs.js`. Narration
lives in `assets/runs.{ja,de,fr}.js`; missing, empty or orphaned entries fail
generation. The browser also refuses incomplete dictionaries instead of
substituting English. The static localized transcript remains readable.

`scripts/check-locales.mjs` compares commands, link destinations, controls,
anchors and version stamps across languages. It checks complete switches,
self canonicals, reciprocal alternatives, metadata, translated descriptions,
accessibility labels, sitemap coverage and indexability. Its refusal tests
remove required content and break links to show that the gate catches them.
`scripts/stamp-version.mjs` stamps every language, including the shared 404.

Run the source checks after staging new pages, since discovery uses tracked
files. Browser checks require Node.js and the pinned development dependency;
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
the transcript player. Screenshots of the German and French homepages and
layout readings go to `artifacts/locales/`, or `SCREENSHOT_DIR`. CI uploads
them as `localization-browser-checks`.

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
`assets/site.js` was captured by running Ptah, not written. The schema one is
the documented direct quick start
(`docs/site/src/content/docs/start/quick-start-direct.mdx`) executed against a
real `app.db`; the rest were run on Linux against a throwaway sqlite database in
`/tmp/app`, which is why absolute paths in the transcripts read the way they do.
Output shown is stdout: the scanning, dependency-order and progress lines these
commands write go to stderr and are not what a reader sees in a pipeline.
Trimming a long block to its telling lines is what a transcript does and is
allowed; reordering it, or writing a line Ptah did not print, is not.
Re-capture rather than edit when a diagnostic changes wording.

Every run lives in `assets/runs.js`, which all homepage and in-practice variants load and
`scripts/build-runs.mjs` reads. Adding one is an entry in `SCENARIOS` plus
its key in `ROTATING` and in `order`, its narration in every `assets/runs.{ja,de,fr}.js` dictionary,
then a run of that script. The generator refuses to write while a translation
has a hole in it, so the order those edits happen in does not matter.

Each run carries one tag, and `order` groups the grid by it. The vocabulary is
eight words -- Schema change, Inference, Safety, Go annotations, Inspection,
Exports, Registry, Atlas -- and it exists to be scanned, so a ninth needs a
reason better than "this one does not fit the eight". A tag scattered over a
grid is decoration; the same tag three cards running is a section, which is why
the order is grouped rather than being the order the runs were written in.

The home page offers four at a time. Two are fixed -- the schema cycle and the
inference cycle, which are what Ptah is for -- and two are drawn at random from
the rest on each load, so a second visit has something new without the others
hiding behind a "more examples" link. The picker markup carries two empty slots
that JavaScript labels.

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

All in-practice pages and home transcripts are generated:

    node scripts/build-runs.mjs           write them
    node scripts/build-runs.mjs --check   fail when they are out of date

The deploy workflow runs `--check`, so a run edited in `assets/runs.js`
without regenerating fails before it can ship a page that disagrees with the
player, in any language. `transcript()` in that script mirrors `settle()` in `assets/site.js`
line for line; when one changes, change the other.

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
`assets/site.js` and `scripts/build-runs.mjs`; when one changes, change the
other.

The first session is also in each language’s `index.html` as a transcript,
between `<!--session:transcript-->` markers. That is the page without
JavaScript, and it is what a crawler and a screen reader read; the player hides
it from sight and replays it. The generator owns those bytes, so the two cannot
drift.

The release version on the pages has three layers. The HTML in git carries
the last release known when it was committed (`v0.3.0`). At deploy time the
workflow asks the GitHub API for the latest `stokaro/ptah` release with the
Actions token and writes it into every element marked `data-version` or
`data-version-bare` (`scripts/stamp-version.mjs`); the workflow also runs on a
schedule every six hours and on the `ptah-release` and `installers-updated`
repository dispatches that `stokaro/ptah` sends, so the served value stays
recent. In the browser, `assets/site.js` asks the same API
once per session and rewrites the elements again; when that request fails
(offline, anonymous rate limit), the deploy-time value stands. Bump the value
in git occasionally so a local preview is not far off.

The ASCII wordmark in the hero and in `og.png` is the one the binaries print
on their entry screen: copy it verbatim from `cmd/internal/banner/banner.go` in
`stokaro/ptah` (the design handoff carried an older, narrower variant).

Documentation links point at the `edge` build of the docs site
(`https://docs.ptah.run/edge/...`), the same choice the Ptah README makes: it
always exists and always documents the current command tree, and the docs site
has a version switcher. Do not "fix" them to a release path without changing
this rule.

Design source: the "Ptah website" design project (option 2a for the homepage,
1d for install, 1f for mobile, 1g for dark mode). Type is Instrument Sans for
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

The fonts under `assets/fonts/` are subsets served by Google Fonts and licensed
under the SIL Open Font License 1.1; the license texts sit beside the files.
`*-symbols.woff2` files carry only the box-drawing and arrow glyphs the ASCII
diagrams use, so those glyphs stay in the same face as the text around them.

## License

MIT. See [LICENSE](LICENSE). Ptah itself is licensed separately in its own
repository.

# ptah.run

The website for [Ptah](https://github.com/stokaro/ptah), served at
<https://ptah.run> from GitHub Pages.

The site is static HTML, CSS and a small script with no build step. The
documentation is a separate site, <https://docs.ptah.run>, built from
`docs/site` in the `stokaro/ptah` repository; this repository only holds the
homepage, the install page and the 404 page.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Homepage |
| `install/index.html` | Install page with platform-detecting tabs |
| `404.html` | Not-found page (GitHub Pages serves it for unknown paths) |
| `assets/site.css` | The one stylesheet: tokens, layout, light and dark themes |
| `assets/site.js` | Theme toggle, mobile menu, copy buttons, install tabs, release-version refresh |
| `assets/fonts/` | Self-hosted font subsets and their licenses |
| `assets/logo.svg`, `favicon.svg` | The Ptah mark, copied from `stokaro/ptah` (`docs/site/src/assets/logo.svg`) |
| `og.png`, `apple-touch-icon.png`, `favicon.ico` | Generated from the mark and the ASCII wordmark |
| `install.sh`, `install.ps1` | Not in git: the deploy fetches them from `docs/site/public/` on the master branch of `stokaro/ptah` (see "Installers") |
| `CNAME` | The custom domain, as a record (see "Deployment settings") |
| `robots.txt`, `sitemap.xml` | Crawl policy and the two indexable URLs; add a row to the sitemap when a page is added |
| `.nojekyll` | Tells GitHub Pages not to run Jekyll over the files |
| `LICENSE` | MIT, for the site's own code |
| `scripts/stamp-version.mjs` | Writes a release tag into the pages; run by the deploy workflow |
| `.github/workflows/deploy.yml` | Checks local references, stamps the latest release, deploys to GitHub Pages |

## Working on it

Serve the directory with any static file server. Absolute paths (`/assets/...`)
are used throughout, so open the site from the repository root:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

Every push to `main` deploys. The workflow first checks that every local
`href`/`src` on the three pages points at a file that exists.

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
happen. Those lines are the demo's own narration, not Ptah's output, and the
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

Every run lives in `assets/runs.js`, which both pages load and
`scripts/build-runs.mjs` reads. Adding one is an entry in `SCENARIOS` plus
its key in `ROTATING` and in `order`, then a run of that script.

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

The page and the home page's transcript are both generated:

    node scripts/build-runs.mjs           write them
    node scripts/build-runs.mjs --check   fail when they are out of date

The deploy workflow runs `--check`, so a run edited in `assets/runs.js`
without regenerating fails before it can ship a page that disagrees with the
player. `transcript()` in that script mirrors `settle()` in `assets/site.js`
line for line; when one changes, change the other.

The terminal scrolls and expands. Scrolling follows the newest line only while
the reader is already at the bottom, so scrolling back to re-read a finding is
not undone by the next one. Expanding moves the same node into a `<dialog>` --
the same session, still playing -- because the hero column is half a page wide
and Ptah's diagnostics are sentences. The frame travels between the two places
rather than one panel vanishing and another appearing: the move is measured
before and after and played back as a transform, which is the only reason the
node move has to happen before `close()` rather than after. Expanded it runs
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

The first session is also in `index.html` as a transcript, between
`<!--session:transcript-->` markers. That is the page without JavaScript, and it
is what a crawler and a screen reader read; the player hides it from sight and
replays it. The generator owns those bytes, so the two cannot drift.

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

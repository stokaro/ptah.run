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

The hero demo is held to that rule twice over, because it moves. Both sessions
were captured by running Ptah, not written: the schema one is the documented
direct quick start (`docs/site/src/content/docs/start/quick-start-direct.mdx`)
executed against a real `app.db`, and the lint one is `ptah migrations lint`
over a one-file directory that drops a column, exit code 1. Every line in
`assets/site.js` is that output verbatim, including the trailing note about the
thinner analysis. Re-capture rather than edit when a diagnostic changes wording.

The whole first session is also in `index.html` as a transcript. That is the
page without JavaScript, and it is what a crawler and a screen reader read; the
player hides it from sight and replays it. Keep the two in step.

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

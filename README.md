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
| `CNAME` | The custom domain |
| `.github/workflows/deploy.yml` | Deploys `main` to GitHub Pages |

## Working on it

Serve the directory with any static file server. Absolute paths (`/assets/...`)
are used throughout, so open the site from the repository root:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

Every push to `main` deploys. The workflow first checks that every local
`href`/`src` on the three pages points at a file that exists.

## Content rules

Every command, output line, database name and claim on these pages comes from
the `stokaro/ptah` repository and its documentation site. When a command or its
output changes there, change it here. Do not invent output.

The release version shown on the pages (`v0.3.0` in the HTML) is the last known
release. On load, `assets/site.js` asks the GitHub API for the latest release
and rewrites every element marked `data-version` or `data-version-bare`; when
the request fails, the HTML value stands. Bump the HTML value when cutting a
release so the page is right without JavaScript too.

Design source: the "Ptah website" design project (option 2a for the homepage,
1d for install, 1f for mobile, 1g for dark mode). Type is Instrument Sans for
prose and interface chrome, IBM Plex Mono for anything that can be pasted into a
terminal, and JetBrains Mono for the ASCII wordmark only. Two-pixel radii,
one-pixel rules, no shadows; the primary button is black, blue is reserved for
links.

## Domain

DNS for `ptah.run` points at GitHub Pages:

| Record | Value |
| --- | --- |
| `A` (apex) | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `AAAA` (apex) | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| `CNAME www` | `stokaro.github.io` |

GitHub redirects `www.ptah.run` to the apex. Keep the Cloudflare proxy off
(DNS only) so GitHub can issue and renew the TLS certificate.

## Fonts

The fonts under `assets/fonts/` are subsets served by Google Fonts and licensed
under the SIL Open Font License 1.1; the license texts sit beside the files.
`*-symbols.woff2` files carry only the box-drawing and arrow glyphs the ASCII
diagrams use, so those glyphs stay in the same face as the text around them.

## License

MIT. See [LICENSE](LICENSE). Ptah itself is licensed separately in its own
repository.

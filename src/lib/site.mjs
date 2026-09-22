// Addresses, languages and the release every page names. One module, so a
// link or a version is wrong in one place rather than in each page.

import release from "../data/release.json" with { type: "json" };

export const ORIGIN = "https://ptah.run";

export const LOCALES = {
  en: { name: "English", short: "EN", switchLabel: "Language" },
  ja: { name: "日本語", short: "JA", switchLabel: "言語" },
  de: { name: "Deutsch", short: "DE", switchLabel: "Sprache" },
  fr: { name: "Français", short: "FR", switchLabel: "Langue" },
};

export const LANGS = Object.keys(LOCALES);
// Every language but the default lives under its own directory.
export const PREFIXED = LANGS.filter((lang) => lang !== "en");

export const prefix = (lang) => (lang === "en" ? "" : `/${lang}`);
export const localizedPath = (lang, path) => `${prefix(lang)}${path}`;

// Pages that exist in every language, by their path in the default tree.
export const PAGES = ["/", "/install/", "/in-practice/", "/community/"];

// The release the pages name when they leave the build. The deploy workflow
// passes the latest stokaro/ptah release in PTAH_VERSION; without it the value
// committed in src/data/release.json stays, so a local build and a build that
// could not reach the GitHub API still produce a whole page. In the browser,
// assets/site.js asks GitHub again and replaces it when the answer is newer.
const TAG_RE = /^v\d+\.\d+\.\d+$/;
const committed = release.version;
const fromEnv = process.env.PTAH_VERSION;
if (fromEnv !== undefined && !TAG_RE.test(fromEnv)) {
  throw new Error(`PTAH_VERSION must look like v1.2.3, got ${JSON.stringify(fromEnv)}`);
}
if (!TAG_RE.test(committed)) {
  throw new Error(`src/data/release.json: version must look like v1.2.3, got ${JSON.stringify(committed)}`);
}
export const VERSION = fromEnv || committed;
export const VERSION_BARE = VERSION.slice(1);

// Write the release into every element marked data-version / data-version-bare
// inside authored HTML. The fragments carry whatever version was current when
// they were written; the element is the contract, not the number in it.
const FULL = /(<[^>]*\bdata-version(?![\w-])[^>]*>)v\d+\.\d+\.\d+(?=<\/)/g;
const BARE = /(<[^>]*\bdata-version-bare\b[^>]*>)\d+\.\d+\.\d+(?=<\/)/g;
export function stampVersion(html) {
  return html.replace(FULL, (_, open) => `${open}${VERSION}`).replace(BARE, (_, open) => `${open}${VERSION_BARE}`);
}

// `go` resolves ptah.run/<anything> by fetching the page with ?go-get=1 and
// reading this tag. Every page carries it, the 404 included, because GitHub
// Pages answers an unknown subpath with that page.
export const GO_IMPORT = "ptah.run git https://github.com/stokaro/ptah";
export const GO_SOURCE =
  "ptah.run https://github.com/stokaro/ptah https://github.com/stokaro/ptah/tree/master{/dir} https://github.com/stokaro/ptah/blob/master{/dir}/{file}#L{line}";

export const LINKS = {
  docs: "https://docs.ptah.run/",
  quickStart: "https://docs.ptah.run/edge/start/quick-start/",
  playground: "https://play.ptah.run/",
  operator: "https://operator.ptah.run/",
  blog: "https://blog.ptah.run/",
  github: "https://github.com/stokaro/ptah",
  issues: "https://github.com/stokaro/ptah/issues",
  releases: "https://github.com/stokaro/ptah/releases",
  license: "https://github.com/stokaro/ptah/blob/master/LICENSE",
  action: "https://github.com/stokaro/ptah-action",
};

// @ts-check
import { defineConfig } from "astro/config";

// The same engine as docs.ptah.run (docs/site in stokaro/ptah), pinned to the
// same Astro release. Starlight is left out: it is a documentation layout, and
// this site is a handful of pages with their own.
export default defineConfig({
  site: "https://ptah.run",
  // Every page is a directory with an index.html, the URL shape the site has
  // always had: /install/, /ja/in-practice/. A link without the slash is a
  // redirect on GitHub Pages, so none is written.
  trailingSlash: "always",
  build: {
    format: "directory",
    // Styles go into files rather than <style> blocks in each page, so a
    // reader moving between pages downloads them once.
    inlineStylesheets: "never",
  },
  // Transcripts are <pre> blocks and whitespace inside them is the content.
  // The compressor leaves <pre> alone, but the fragments carry pre elements
  // built from spans, and a byte-for-byte page is easier to check.
  compressHTML: false,
  devToolbar: { enabled: false },
});

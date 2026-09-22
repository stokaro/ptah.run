// The authored pages that moved into this build unchanged: install and
// community in each language, and the one 404 every unknown address gets.
// They are HTML because that is what they were written as; the layout around
// them is Astro's.
import { stampVersion } from "./site.mjs";

const files = import.meta.glob("../fragments/**/*.html", { query: "?raw", import: "default", eager: true });

export function fragment(name) {
  const html = files[`../fragments/${name}.html`];
  if (typeof html !== "string") throw new Error(`src/fragments/${name}.html does not exist`);
  return stampVersion(html);
}

// The homepage copy in every language. English is the source; a translation
// has every key English has, with the same kind of value, or the build stops.
import en from "./home.en.mjs";
import { LANGS } from "../lib/site.mjs";

const translations = import.meta.glob("./home.*.mjs", { eager: true, import: "default" });

export const HOME = {};
for (const lang of LANGS) {
  const copy = translations[`./home.${lang}.mjs`];
  if (copy) HOME[lang] = copy;
}

function shape(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

const isPiece = (v) => shape(v) === "object" && ("code" in v || "exit" in v || "href" in v || "strong" in v);
// A sentence with inline pieces: a translation may reorder it, but the code,
// links and exit codes in it are the same set, because they are not prose.
const isRich = (v) => shape(v) === "array" && v.some(isPiece);
const fixed = (rich) =>
  rich
    .filter(isPiece)
    .map((p) => JSON.stringify(p.code !== undefined ? { code: p.code } : p.exit !== undefined ? { exit: p.exit } : p.href ? { href: p.href } : { strong: p.strong }))
    .sort()
    .join("\n");

// Every key, at every depth, present with the same kind of value.
export function copyProblems(source, target, path = "") {
  const where = path || "(root)";
  if (typeof source === "function") {
    if (typeof target !== "function") return [`${where}: expected a function`];
    return [];
  }
  if (isRich(source)) {
    if (!isRich(target) && shape(target) !== "array") return [`${where}: expected a sentence with pieces`];
    return fixed(source) === fixed(target) ? [] : [`${where}: code, links or exit codes differ from English`];
  }
  if (shape(source) !== shape(target)) return [`${where}: expected ${shape(source)}, got ${shape(target)}`];
  if (shape(source) === "string") return source.trim() && !target.trim() ? [`${where}: empty`] : [];
  const problems = [];
  if (shape(source) === "array") {
    if (source.length !== target.length) return [`${where}: ${target.length} items, English has ${source.length}`];
    source.forEach((v, i) => problems.push(...copyProblems(v, target[i], `${path}[${i}]`)));
  }
  if (shape(source) === "object") {
    for (const key of Object.keys(source)) problems.push(...copyProblems(source[key], target[key], path ? `${path}.${key}` : key));
    for (const key of Object.keys(target)) if (!(key in source)) problems.push(`${path ? `${path}.` : ""}${key}: not in English`);
  }
  return problems;
}

for (const lang of LANGS) {
  if (lang === "en") continue;
  if (!HOME[lang]) throw new Error(`src/i18n/home.${lang}.mjs is missing`);
  const problems = copyProblems(en, HOME[lang]);
  if (problems.length) throw new Error(`src/i18n/home.${lang}.mjs:\n  ${problems.join("\n  ")}`);
}

// Rendering captured terminal output and source files as HTML. Nothing here
// changes a byte of what was captured: it only wraps runs of it in spans so
// the stylesheet can colour a prompt, a flag, a string or a comment.

import { esc } from "./runs.mjs";

// A command line: flags and quoted strings coloured, everything else as typed.
export function hlCmd(text) {
  return text
    .split(/("[^"]*"|'[^']*'|(?<=^|\s)--?[a-z][\w-]*)/)
    .map((part, i) => {
      if (i % 2 === 0) return esc(part);
      return `<span class="${part.startsWith("-") ? "f" : "s"}">${esc(part)}</span>`;
    })
    .join("");
}

// One captured block. Each line is {k, t}: k "cmd" is a command at a prompt,
// "cont" its continuation, "m" muted output, "a" the accent (SQL Ptah
// writes), "e" a finding, "c" the page's own narration; anything else is plain
// output.
export function renderLines(lines) {
  return lines
    .map(({ k, t }) => {
      if (k === "cmd") return `<span class="p">$</span> ${hlCmd(t)}`;
      if (k === "cont") return hlCmd(t);
      const body = esc(t ?? "");
      return k ? `<span class="${k}">${body}</span>` : body;
    })
    .join("\n");
}

// Source files and exported documents. Token classes: k keyword, s string,
// n number or type, c comment. The rules are per language and deliberately
// small: they colour what a reader scans for and leave the rest alone.
//
// hl() places each group's span by adding up the lengths of the groups before
// it, starting at the match. So every character of a match belongs to a
// group: text a rule matches only for context, like the ": " before a YAML
// number, is a group with no class. Left out of the groups, it shifts every
// span after it -- "maxLength: 255" coloured ": 2" instead of "255".
const RULES = {
  yaml: [
    [/^(\s*#.*)$/, ["c"]],
    [/^(\s*-?\s*)([\w.$-]+)(:)/, [null, "k", null]],
    [/(\s#.*)$/, ["c"]],
    [/("[^"]*"|'[^']*')/g, ["s"]],
    // A number only when it is the whole value: 3.0.3 is a version string.
    [/(:\s+)(true|false|null|-?\d+(?:\.\d+)?)(?=\s*(?:#|$))/g, [null, "n"]],
  ],
  graphql: [
    [/^(\s*#.*)$/, ["c"]],
    [/\b(type|enum|input|scalar|extend|interface|union|implements|schema|query|mutation)\b/g, ["k"]],
    [/\b(ID|String|Int|Float|Boolean)\b/g, ["n"]],
    [/(\s#.*)$/, ["c"]],
    [/("[^"]*")/g, ["s"]],
  ],
  proto: [
    [/^(\s*\/\/.*)$/, ["c"]],
    [/\b(syntax|package|message|enum|optional|repeated|import|option|reserved)\b/g, ["k"]],
    [/\b(int32|int64|uint32|uint64|string|bool|bytes|double|float)\b/g, ["n"]],
    [/("[^"]*")/g, ["s"]],
    [/(\/\/.*)$/, ["c"]],
  ],
  md: [
    [/^(#+ .*)$/, ["k"]],
    [/(`[^`]+`)/g, ["s"]],
  ],
  dbml: [
    [/^(\s*\/\/.*)$/, ["c"]],
    [/^(\s*)(Table|Enum|Ref|Indexes|Note)\b/, [null, "k"]],
    [/(\[[^\]]*\])/g, ["s"]],
    [/('[^']*'|"[^"]*")/g, ["s"]],
  ],
  hcl: [
    [/^(\s*#.*)$/, ["c"]],
    [/^(\s*)(table|column|primary_key|index|foreign_key|schema|enum|values)\b/, [null, "k"]],
    [/("[^"]*")/g, ["s"]],
    [/(=\s*)(true|false|null|\d+)\b/g, [null, "n"]],
  ],
  sql: [
    [/^(\s*--.*)$/, ["c"]],
    [/\b(CREATE|TABLE|ALTER|ADD|DROP|COLUMN|PRIMARY|KEY|NOT|NULL|REFERENCES|INSERT|INTO|VALUES|UPDATE|DELETE|DEFAULT|UNIQUE|INDEX|ON|TYPE|AS|ENUM|CHECK|CONSTRAINT|FOREIGN)\b/g, ["k"]],
    [/('[^']*')/g, ["s"]],
  ],
  go: [
    [/^(\s*\/\/.*)$/, ["c"]],
    [/\b(package|type|struct|func|import|return)\b/g, ["k"]],
    [/\b(int|int32|int64|string|bool|float64|\*string|time\.Time)\b/g, ["n"]],
    [/(`[^`]*`|"[^"]*")/g, ["s"]],
  ],
  plain: [],
};

export function hl(lang, src) {
  const rules = RULES[lang];
  if (!rules) throw new Error(`no highlighting rules for ${lang}`);
  return src
    .split("\n")
    .map((line) => {
      // Spans over the raw line; a later rule only colours what an earlier one
      // left plain, so a string inside a comment stays a comment.
      let spans = [{ s: 0, e: line.length, c: null }];
      for (const [re, classes] of rules) {
        const r = new RegExp(re.source, "g");
        const found = [];
        let m;
        while ((m = r.exec(line)) && m[0].length) {
          let pos = m.index;
          for (let g = 1; g < m.length; g++) {
            const part = m[g] ?? "";
            if (part && classes[g - 1]) found.push({ s: pos, e: pos + part.length, c: classes[g - 1] });
            pos += part.length;
          }
          if (!re.flags.includes("g")) break;
        }
        for (const f of found) {
          const next = [];
          for (const sp of spans) {
            if (sp.c !== null || f.e <= sp.s || f.s >= sp.e) {
              next.push(sp);
              continue;
            }
            if (f.s > sp.s) next.push({ s: sp.s, e: f.s, c: null });
            next.push({ s: Math.max(f.s, sp.s), e: Math.min(f.e, sp.e), c: f.c });
            if (f.e < sp.e) next.push({ s: f.e, e: sp.e, c: null });
          }
          spans = next;
        }
      }
      return spans
        .filter((sp) => sp.e > sp.s)
        .map((sp) => (sp.c ? `<span class="${sp.c}">${esc(line.slice(sp.s, sp.e))}</span>` : esc(line.slice(sp.s, sp.e))))
        .join("");
    })
    .join("\n");
}

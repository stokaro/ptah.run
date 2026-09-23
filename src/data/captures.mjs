/* Everything the homepage shows as a command or as output.
 *
 * Every line here was printed by Ptah: the raw runs sit in
 * src/data/captures/*.json with the files they ran against, the command, its
 * stdout, stderr and exit code, and the release they ran on. This module only
 * selects and arranges them. It never writes a line of output itself; a
 * trimmed block is trimmed at line boundaries and never reordered, and a
 * command split over two lines for the width of a frame is checked against
 * the command that ran.
 */

import exportRuns from "./captures/export.json";
import ormRuns from "./captures/orm.json";
import tryitRuns from "./captures/tryit.json";
import formatRuns from "./captures/formats.json";
import sealRuns from "./captures/seal.json";
import ciRuns from "./captures/ci.json";
import inferenceRuns from "./captures/inference.json";
import assistRec from "./captures/assist.json";

/* ---------- Helpers ---------- */

const trimEnd = (text) => text.replace(/\n+$/, "");
const lines = (text) => (text ? trimEnd(text).split("\n") : []);

// A command on the page may be split over lines for the width of a frame. The
// joined text must be exactly what ran, or the page shows a different command.
function shownAs(ran, parts) {
  const joined = parts.map((l) => l.replace(/\s*\\$/, "").trim()).join(" ");
  if (joined !== ran) throw new Error(`shown command "${joined}" is not the one that ran ("${ran}")`);
  return parts.map((t, i) => ({ k: i === 0 ? "cmd" : "cont", t }));
}

// Split a command after its first flag group so it fits a half-width frame,
// and prove the split is the same command.
function wrapCmd(ran, breakBefore) {
  const at = ran.indexOf(` ${breakBefore}`);
  if (at < 0) return shownAs(ran, [ran]);
  return shownAs(ran, [`${ran.slice(0, at)} \\`, `    ${ran.slice(at + 1)}`]);
}

function mustExit(run, code, where) {
  if (run.exit !== code) throw new Error(`${where}: "${run.cmd}" exited ${run.exit}, expected ${code}`);
  return run;
}

/* ---------- Export ---------- */

const E = exportRuns.runs;
const exp = (key, i = 0) => mustExit(E[key][i], 0, `captures/export.json ${key}[${i}]`);
export const EXPORT = {
  ptah: exportRuns.ptah,
  source: "models/*.go",
  targets: [
    { id: "openapi", to: "openapi-v3", kind: "contract", lang: "yaml", cmd: exp("openapi").cmd, body: trimEnd(exp("openapi").stdout) },
    {
      id: "graphql",
      to: "graphql",
      kind: "contract",
      lang: "graphql",
      cmd: "ptah schema export --to graphql --root-dir ./models \\\n    --graphql-operations list,by-id",
      body: trimEnd(exp("graphql").stdout),
    },
    {
      id: "proto",
      to: "protobuf",
      kind: "contractStateful",
      lang: "proto",
      cmd: "ptah schema export --to protobuf --root-dir ./models \\\n    --proto-package shop.v1 --out shop.proto",
      out: trimEnd(exp("proto").stdout),
      then: exp("proto", 1).cmd,
      body: trimEnd(exp("proto", 1).stdout),
    },
    { id: "md", to: "markdown", kind: "document", lang: "md", cmd: exp("md").cmd, body: trimEnd(exp("md").stdout) },
    { id: "html", to: "html", kind: "documentSelf", lang: "plain", cmd: exp("html").cmd, out: trimEnd(exp("html").stdout), body: "" },
    { id: "dbml", to: "dbml", kind: "format", lang: "dbml", cmd: exp("dbml").cmd, body: trimEnd(exp("dbml").stdout) },
    {
      id: "hcl",
      to: "hcl",
      kind: "formatGo",
      lang: "hcl",
      cmd: exp("hcl").cmd,
      out: trimEnd(exp("hcl").stdout),
      then: exp("hcl", 1).cmd,
      body: trimEnd(exp("hcl", 1).stdout),
    },
  ],
};
for (const t of EXPORT.targets) {
  const shown = t.cmd.replace(/ \\\n\s+/g, " ");
  if (shown !== E[t.id][0].cmd) throw new Error(`export ${t.id}: shown "${shown}" is not what ran ("${E[t.id][0].cmd}")`);
}

/* ---------- ORM loaders ---------- */

const drift = mustExit(ormRuns.runs[1], 0, "captures/orm.json");
export const ORM = {
  // GORM and SQLAlchemy have committed, version-pinned recipes in the ptah
  // repository (examples/orm-loaders); the others are named in
  // docs/site/src/content/docs/schema/orm-and-external.md as loaders whose
  // SQL output can use the same contract. Doctrine is named nowhere and is
  // not on the list.
  chips: [
    { name: "GORM", verified: true },
    { name: "SQLAlchemy", verified: true },
    { name: "Django" },
    { name: "TypeORM" },
    { name: "Sequelize" },
    { name: "Hibernate" },
  ],
  lines: [
    ...shownAs(drift.cmd, ["ptah schema drift \\", "    --schema-cmd ./scripts/export-schema \\", "    --db-url sqlite://app.db"]),
    ...lines(drift.stdout).map((t) => ({ k: "", t })),
  ],
};

/* ---------- Try it ---------- */

// Colour only: which lines of a drift report or a plan are the finding, the
// SQL Ptah would run, or the context around them.
function driftLines(stdout) {
  return lines(stdout).map((t) => {
    if (/^- /.test(t)) return { k: "a", t };
    if (/^Schema drift detected \(highest severity: destructive\)/.test(t)) return { k: "e", t };
    if (/^(Failure threshold|Database|Findings):?/.test(t)) return { k: "m", t };
    return { k: "", t };
  });
}
function planLines(stdout) {
  return lines(stdout).map((t) => {
    if (t === "Planned schema changes:" || /^--/.test(t)) return { k: "m", t };
    if (t === "" || /^Schema is synced/.test(t)) return { k: "", t };
    return { k: "a", t };
  });
}

// The edited file against the file the database was created from. A line
// that only gained or lost its trailing comma is the same line; everything
// else is an addition or a removal, found by longest common subsequence.
function diff(before, after) {
  const a = lines(before);
  const b = lines(after);
  const key = (s) => s.replace(/,\s*$/, "");
  const n = a.length;
  const m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i][j] = key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
  }
  const out = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && key(a[i]) === key(b[j])) {
      out.push({ mark: "", t: b[j] });
      i++;
      j++;
    } else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) {
      out.push({ mark: "+", t: b[j++] });
    } else {
      out.push({ mark: "-", t: a[i++] });
    }
  }
  return out;
}

const EDITS = ["none", "add", "drop", "table"];
const D = tryitRuns.dialects;
const base = D.sqlite.none.file;
const files = {};
for (const e of EDITS) {
  // One schema.sql per edit, the same bytes on every engine.
  for (const d of Object.keys(D)) {
    if (D[d][e].file !== D.sqlite[e].file) throw new Error(`captures/tryit.json: ${d} ${e} ran a different schema.sql`);
  }
  const rows = diff(base, D.sqlite[e].file);
  files[e] = {
    rows,
    added: rows.filter((r) => r.mark === "+").length,
    removed: rows.filter((r) => r.mark === "-").length,
  };
}
const url = { sqlite: "sqlite://app.db", postgres: "postgres://app@db/app", mysql: "mysql://app@db/app" };
export const TRYIT = {
  ptah: tryitRuns.ptah,
  files,
  dialects: Object.fromEntries(
    Object.keys(D).map((d) => [
      d,
      {
        label: d,
        url: url[d],
        edits: Object.fromEntries(
          EDITS.map((e) => {
            const r = D[d][e];
            mustExit(r.drift, e === "none" ? 0 : 1, `tryit ${d} ${e}`);
            mustExit(r.plan, 0, `tryit ${d} ${e}`);
            return [
              e,
              {
                lines: [
                  ...wrapCmd(r.drift.cmd, "--db-url"),
                  ...driftLines(r.drift.stdout),
                  { k: "exit", code: r.drift.exit },
                  { k: "", t: "" },
                  ...wrapCmd(r.plan.cmd, "--db-url"),
                  ...planLines(r.plan.stdout),
                  { k: "exit", code: r.plan.exit },
                ],
              },
            ];
          }),
        ),
      },
    ]),
  ),
};

/* ---------- Five source formats ---------- */

const FMT_META = {
  sql: { label: "SQL", lang: "sql" },
  yaml: { label: "YAML", lang: "yaml" },
  hcl: { label: "HCL", lang: "hcl" },
  dbml: { label: "DBML", lang: "dbml" },
  go: { label: "Go", lang: "go" },
};
const plans = new Set();
export const FORMATS = Object.fromEntries(
  Object.entries(formatRuns.formats).map(([k, f]) => {
    mustExit(f.plan, 0, `formats ${k}`);
    plans.add(f.plan.stdout);
    return [
      k,
      {
        ...FMT_META[k],
        file: f.file,
        src: trimEnd(f.content),
        exit: f.plan.exit,
        lines: [...wrapCmd(f.plan.cmd, "--db-url"), ...planLines(f.plan.stdout)],
      },
    ];
  }),
);
// The section says "same plan, whatever the source"; the captures have to agree.
if (plans.size !== 1) throw new Error("captures/formats.json: the five sources did not produce one plan");

/* ---------- Scenarios ---------- */

// 01: the lint gate on a pull request that drops a column, and what the
// action reports. The workflow step is the action's own README example.
const lint = mustExit(ciRuns.lint, 1, "captures/ci.json lint");
const comment = lines(ciRuns.comment);
const heading = comment.find((l) => l.startsWith("## "));
const sqlAt = comment.findIndex((l) => l.startsWith("-- Remove columns"));
const summary = lines(ciRuns.check_run.output.summary);
const s1 = {
  workflowFile: ".github/workflows/ptah.yml",
  workflow: [
    "- uses: stokaro/ptah-action@v1",
    "  with:",
    "    dir: ./internal/models",
    "    db-url: ${{ secrets.PTAH_DATABASE_URL }}",
    "    dialect: postgres",
    "    migration-dir: ./migrations",
  ].join("\n"),
  lines: [
    ...wrapCmd(lint.cmd, "--dialect"),
    // stdout carries one note that the run had no baseline schema to read;
    // the findings are on stderr, and they are what the gate is about.
    ...lines(lint.stderr).map((t) => ({ k: /\[error\]/.test(t) ? "e" : /\[warning\]/.test(t) ? "m" : "", t })),
  ],
  exit: lint.exit,
  checks: {
    action: "stokaro/ptah-action@v1",
    name: ciRuns.check_run.name,
    conclusion: ciRuns.check_run.conclusion,
    title: ciRuns.check_run.output.title,
    // The verdict: the first two lines of the check run's summary.
    summary: summary.slice(0, 2),
    comment: [heading, "", ...comment.slice(sqlAt, sqlAt + 3)].join("\n"),
  },
};

// 02: a sealed directory, then an applied migration edited behind its back.
const seal = {
  hash: mustExit(sealRuns.hash, 0, "seal hash"),
  sum: mustExit(sealRuns.sum, 0, "seal sum"),
  up: mustExit(sealRuns.up, 2, "seal up"),
  echo: sealRuns.echo,
};
const s2 = {
  left: [
    ...shownAs(seal.hash.cmd, [seal.hash.cmd]),
    ...lines(seal.hash.stdout).map((t) => ({ k: "", t })),
    ...shownAs(seal.sum.cmd, [seal.sum.cmd]),
    ...lines(seal.sum.stdout).map((t) => ({ k: "m", t })),
  ],
  right: [
    ...shownAs(seal.up.cmd, ["ptah migrations up \\", "    --db-url sqlite://app.db \\", "    --migrations-dir ./migrations"]),
    ...lines(seal.up.stderr).map((t) => ({ k: "e", t })),
    { k: "cmd", t: "echo $?" },
    ...lines(seal.echo.stdout).map((t) => ({ k: "", t })),
  ],
};

// 03: a second embedding generation, step by step, with what
// `ptah inference status` reported for the new generation after each.
const steps = inferenceRuns.steps.map((s) => {
  const run = s.measured_second_generation;
  const approved = s.measured_second_generation_approved;
  const out = [
    ...shownAs(run.command, [run.command]),
    ...lines(run.stdout).map((t) => ({ k: /refused/.test(t) ? "e" : /^\s*-/.test(t) ? "m" : "", t })),
    ...lines(run.stderr).map((t) => ({ k: "e", t })),
  ];
  if (approved) {
    out.push({ k: "", t: "" }, ...shownAs(approved.command, [approved.command]), ...lines(approved.stdout).map((t) => ({ k: /^\s*-/.test(t) ? "m" : "a", t })));
  }
  if (!s.status_g1_first_line || !s.status_g2_first_line) throw new Error(`captures/inference.json: step ${s.step} has no status lines`);
  return {
    name: s.step,
    lines: out,
    // What `ptah inference status` printed for each generation after the step.
    g1: s.status_g1_first_line,
    g2: s.status_g2_first_line,
  };
});
export const SCN = { s1, s2, s3: { steps } };

/* ---------- What leaves the database ---------- */

const plan = inferenceRuns.steps.find((s) => s.step === "plan").measured_second_generation;
const planOut = lines(plan.stdout);
const leaves = planOut.indexOf("What leaves the database:");
if (leaves < 0) throw new Error("captures/inference.json: the plan has no 'What leaves the database' block");
export const PROOF = {
  command: "ptah inference plan",
  lines: planOut.slice(leaves).map((t) => ({ k: /declared local$/.test(t) ? "" : "", t })),
};

/* ---------- The assist recording ---------- */

function moment(text) {
  return lines(text)
    .map((t) => {
      const safe = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (/^┃/.test(t)) return `<span class="bar">${safe}</span>`;
      if (/^>/.test(t)) return `<span class="q">${safe}</span>`;
      if (/^--/.test(t)) return `<span class="m">${safe}</span>`;
      return safe;
    })
    .join("\n");
}
export const MOMENTS = { approval: moment(assistRec.approval), hold: moment(assistRec.hold) };

/* ---------- Databases ---------- */

// The declared release lines of the generated support matrix
// (docs/site/src/content/docs/databases/support-matrix.md in stokaro/ptah,
// from internal/capabilityprobe/cells.go): per engine, how many lines are
// declared and how many are tested, meaning certified or legacy-tested. The
// support policy grants either level only to a line something actually runs
// against; legacy-tested is a line past its upstream end of life that CI
// still runs. The rest are best-effort: ClickHouse 25.8, whose upstream
// support has ended and which nothing probes, and Spanner's only line, which
// runs against the emulator because that is the only Spanner a container can
// provide.
//
// An engine shows its tested lines only. A line the vendor no longer supports
// stays in the matrix as a record, not as a gap in the engine's coverage, so
// counting it against ClickHouse would say less than the testing does.
// `lines` stays here for the total check below.
//
// The notes beside each engine come from the matrix's Coverage column, which
// is about feature depth, a different question from how much testing stands
// behind a line.
export const ENGINES = {
  counts: { declared: 32, probed: 31, certified: 28, legacyTested: 2 },
  list: [
    { id: "postgres", name: "PostgreSQL", lines: 6, tested: 6 },
    { id: "sqlite", name: "SQLite", lines: 1, tested: 1 },
    { id: "mysql", name: "MySQL", lines: 3, tested: 3 },
    { id: "mariadb", name: "MariaDB", lines: 4, tested: 4 },
    { id: "cockroachdb", name: "CockroachDB", lines: 3, tested: 3 },
    { id: "yugabytedb", name: "YugabyteDB", lines: 3, tested: 3 },
    { id: "sqlserver", name: "SQL Server", lines: 3, tested: 3 },
    { id: "oracle", name: "Oracle", lines: 2, tested: 2 },
    { id: "clickhouse", name: "ClickHouse", lines: 6, tested: 5 },
    { id: "spanner", name: "Spanner", lines: 1, tested: 0 },
  ],
};

// The per-engine figures and the totals are copied from the same table, so
// they have to agree; a line added to one and not the other stops the build
// rather than showing two answers.
{
  const sum = (key) => ENGINES.list.reduce((total, engine) => total + engine[key], 0);
  const tested = ENGINES.counts.certified + ENGINES.counts.legacyTested;
  if (sum("lines") !== ENGINES.counts.declared || sum("tested") !== tested) {
    throw new Error(
      `ENGINES: the engines add up to ${sum("lines")} lines and ${sum("tested")} tested, ` +
        `the totals say ${ENGINES.counts.declared} and ${tested}`,
    );
  }
}

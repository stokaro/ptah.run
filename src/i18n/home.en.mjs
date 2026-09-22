// The homepage in English, the source every translation is made from.
//
// Only the page's own prose lives here. Commands, flags, file names, SQL and
// anything Ptah printed are recorded output and sit in src/data/captures.mjs,
// the same bytes in every language.
//
// A value that is an array of strings and objects is a sentence with inline
// pieces: a plain string is text, {code} is inline code, {exit} is an exit
// code chip, {href, text} is a link. src/components/Rich.astro renders them.

export default {
  meta: {
    title: "Ptah — database migrations without surprises",
    description:
      "Open-source database change management. Ptah compares the schema you want with a live database and either writes versioned migrations or applies an approved plan. PostgreSQL, MySQL, MariaDB, SQLite and more.",
    ogDescription:
      "Open-source database change management. Ptah compares the schema you want with a live database and either writes versioned migrations or applies an approved plan.",
    jsonldDescription: "Open-source database change management for schemas and persistent inference state.",
  },

  hero: {
    eyebrow: "Open-source database DevOps",
    h1: "Database migrations without surprises.",
    lede: "Ptah compares the schema you want with a live database and either writes versioned migrations or applies an approved plan. It also migrates persistent inference state, such as re-embedding a pgvector table. PostgreSQL, MySQL, MariaDB, SQLite and more. Open source, MIT, no toolchain to install.",
    copy: "Copy",
    copyName: "install command",
    windows: "Windows:",
    getStarted: "Get started",
    playground: "Playground",
    github: "View on GitHub",
    badges: ["Fully open source, MIT", "Zero telemetry", "Runs air-gapped"],
    why: "Why that matters →",
    modesLabel: "Demo",
    walk: "Walkthrough",
    try: "Try it",
    openPlayground: "Open in Playground →",
    change: "Change",
    edits: { none: "No change", add: "Add a column", drop: "Drop a column", table: "Add a table" },
    // What the edit did to schema.sql, counted by the page from the two files.
    diff: (added, removed) =>
      !added && !removed
        ? "matches the database"
        : [added && `+${added} line${added === 1 ? "" : "s"}`, removed && `−${removed} line${removed === 1 ? "" : "s"}`].filter(Boolean).join(" "),
    more: "More recorded workflows",
    inPractice: "In practice",
  },

  how: {
    eyebrow: "How it works",
    h2: "One comparison. Every workflow reads it.",
    lead: [
      "Whatever you write the schema in, Ptah parses it into one desired schema and diffs it against the database. Drift, plans, lint and apply are four readings of that one diff — and every check exits ",
      { exit: 0 },
      ", ",
      { exit: 1 },
      " or ",
      { exit: 2 },
      ", so CI never mistakes a broken connection for a clean schema.",
    ],
    sources: "SOURCES · ANY MIX",
    live: "LIVE DATABASE",
    liveBox: "live database",
    supported: "supported databases →",
    desired: "desired schema",
    compare: "compare",
    oneDiff: "one diff",
    out: "WHAT COMES OUT",
    proof: "the proof",
    review: "the review surface",
    gate: "the gate",
    afterApproval: "after approval",
    afterApprovalLive: "after approval → live database",
    aria: "How Ptah works: any mix of sources becomes one desired schema; it is compared with the live database; the single diff drives drift checks, plans, lint and, after approval, apply, which writes back to the same live database.",
  },

  scenarios: {
    h2: "Three things it does in a typical week.",
    lead: "Real commands, real output. Exit codes are stable across all of them: 0 success, 1 a negative check result, 2 a usage or connection failure.",
    tabs: [
      {
        name: "Keep unsafe and destructive migrations out of main.",
        sub: "Database CI/CD: a migration plan, a safety verdict and lint in the pull request.",
        short: "Gate a PR",
      },
      {
        name: "Keep unreviewed migrations away from the database.",
        sub: "ptah.sum is verified before anything runs.",
        short: "Seal a directory",
      },
      {
        name: "Switch embedding models without a search outage.",
        sub: "A lifecycle, not a script: each step is a command.",
        short: "Switch models",
      },
    ],
    inCi: "in CI",
    checks: "Checks · pull request",
    postedBy: "Comment posted by ptah-action",
    s1Note: [
      "The action plans the migration against the target database, posts the plan as a comment and writes one check run that fails when a statement would destroy data. ",
      { code: "ptah migrations lint" },
      " exits 1 on a finding and 2 when it could not run, so a broken connection never looks like a clean directory.",
    ],
    s2Left: "seal",
    s2Right: "later, after an applied file was edited",
    s2Note: [
      { code: "ptah.sum" },
      " records a checksum per file. ",
      { code: "up" },
      ", ",
      { code: "validate" },
      " and ",
      { code: "lint" },
      " check it before they do anything, and ",
      { code: "status" },
      " does with ",
      { code: "--verify-sum" },
      ". What CI reviewed is what production runs.",
    ],
    s3Note: [
      "Ptah builds the new generation beside the one queries read, calls your embeddings endpoint, verifies, and switches queries over when an approval names the plan. It never produces a vector itself, and ",
      { code: "plan" },
      " tells you what leaves the database before anything runs.",
    ],
    stepsLabel: "Lifecycle step",
    g1: "g1 · ptah-docs-stub · the generation queries read",
    g2: "g2 · ptah-docs-stub-v2 · the new model",
  },

  sources: {
    eyebrow: "Schema as Code",
    h2: "Works with the schemas you already have.",
    lead: "Define the schema you want; review the changes needed to get there. Every source parses into the same internal schema before planning — files, Go annotations, a live database, or any program that prints one, an ORM included.",
    samePlan: "same plan, whatever the source",
    formatsLabel: "Schema format",
    ormEyebrow: "Or let the ORM be the schema",
    ormLead:
      "Any program that prints the complete schema as SQL, HCL or YAML to stdout is a source. Ptah runs it without a shell, bounds it, and refuses empty output.",
    yourScript: "your script",
    ormLegend: "a committed, version-pinned recipe in the repository · the others print SQL DDL and can use the same contract",
    refEyebrow: "Reference data as code",
    refH3: "Lookup rows, declared next to the tables.",
    refP: [
      "Ptah diffs the declared rows against the live table and writes a reversible data migration. Drift checks and direct plans read the same rows. A data migration that updates or deletes rows needs ",
      { code: "--allow-destructive" },
      ".",
    ],
    refSteps: ["//ptah:schema:data · countries.yaml", "diff by key against the live table", "INSERT · UPDATE · DELETE", ".up.sql / .down.sql · ptah.sum"],
    accEyebrow: "Database access as code",
    accH3: "Roles, grants and row-level policies, declared with the tables.",
    accP: [
      { code: "ptah schema security" },
      " reads the live database and flags a table granted to a role with no row-level security. ",
      { code: "ptah viz --security" },
      " marks the same finding on the declared schema. Gate a pull request on it with ",
      { code: "--fail-on any" },
      ".",
    ],
    accSteps: ["GRANT … TO role", "ptah schema security", "PRV01 · no RLS on a granted table", "declare a policy"],
  },

  export: {
    eyebrow: "Schema export",
    h2: "One schema, exported to whatever needs it.",
    lead: "Seven targets. Go annotations reach all seven; a schema file reaches every one but HCL. Contracts for machines, documents for people, two more schema formats. Nothing connects to a database, and every export is a candidate to review.",
    sourceSub: "Go annotations",
    targetsLabel: "Export target",
    kinds: {
      contract: "contract",
      contractStateful: "contract · stateful",
      document: "document",
      documentSelf: "document · self-contained",
      format: "schema format",
      formatGo: "schema format · from Go",
    },
    note: [
      { code: "api_name" },
      ", ",
      { code: "api_type" },
      " and ",
      { code: "api_expose" },
      " shape the published contract without touching the migration engine — a ",
      { code: "DECIMAL" },
      " can ship as a string, and a column can be left out of the contract. Protobuf field numbers persist in the file you commit.",
    ],
  },

  agents: {
    eyebrow: "Agentic development",
    h2: "Two ways to put a model on the project. One set of tools. Never the database.",
    lead: "Pick who owns the model connection. Everything downstream is the same Ptah: eleven tools with a workspace, every write previewed and checked against a digest, an audit line for each decision.",
    assistWho: "Ptah owns the model connection, through a profile you configure: the OpenAI-compatible or the Anthropic API.",
    mcpWho: "The client owns the model. Claude, Cursor, VS Code, Zed, or any MCP client that runs a local server over stdio.",
    you: "you",
    terminal: "terminal",
    inClient: "in the client",
    profile: "a model on your machine, a gateway or a provider",
    tools: "tools",
    client: "your MCP client",
    clients: "Claude · Cursor · VS Code · Zed",
    project: "your project",
    projectSub: "schema · migrations · a dev database",
    contract: [
      {
        title: "read → preview → approve → apply",
        text: ["The approval covers one patch, named by its digest. If the files changed after the preview, the apply refuses."],
      },
      {
        title: "Allow once · for this session · No",
        text: ["You answer in the terminal or in the client. Repository policy can only remove authority."],
      },
      {
        title: "Never writes to the database",
        text: ["No tool runs SQL, changes a database or applies a migration, and no setting adds one. ", { code: "ptah migrations up" }, " stays a person’s step."],
      },
      {
        title: "Audit and byte count",
        text: [
          "With a workspace, every permission decision goes to ",
          { code: ".ptah/agent-audit.jsonl" },
          ". In ptah assist, each answer ends with how many bytes of project content reached the provider.",
        ],
      },
    ],
    moment1: "ptah assist · the approval moment",
    moment2: "ptah assist · the model can refuse too",
    recorded: "recorded live",
  },

  sovereignty: {
    h2: "Fully open source. Zero telemetry. Runs where the network does not.",
    lead: "Built for data that has to stay where it is: regulated, sovereign, classified. Every component can be self-hosted, and none of them phones home.",
    pillars: [
      {
        word: "MIT",
        title: "Fully open source",
        text: [
          "The CLI, ",
          { code: "ptah-compat" },
          ", ",
          { code: "ptah-ls" },
          ", the Kubernetes Operator, the GitHub Action and this site. Four repositories, one license, and no paid tier holds back a safety check.",
        ],
      },
      {
        word: "Private",
        title: "Zero telemetry",
        text: [
          "Ptah connects only to addresses you give it: your database, the embedding endpoint, the model provider for ptah assist, and the registry you push to or pull from. No usage pings, no update checks, no account.",
        ],
      },
      {
        word: "Yours",
        title: "Sovereign by default",
        text: [
          "Schemas and migration directories as OCI artifacts in your own registry: ECR, GAR, Harbor, GHCR, Docker Hub or a plain ",
          { code: "registry:2" },
          ". The Operator runs in your cluster. Credentials are references, never values, so a spec is a file you can commit.",
        ],
      },
      {
        word: "Air-gapped",
        title: "No network required",
        text: [
          "Release archives hold ptah, ptah-compat and ptah-ls, built without CGO. Check an archive against ",
          { code: "checksums.txt" },
          " with no network. For inference, ",
          { code: "--release" },
          " accepts an oci-layout directory you copied across on disk.",
        ],
      },
    ],
    proofEyebrow: "Proof, not a promise",
    proof: [
      "Before an inference run touches a provider, ",
      { code: "plan" },
      " prints exactly what leaves: which model, which endpoint and its declared class, which columns, how many rows. It is the same list a data-protection review asks for.",
    ],
    proofBar: "printed before anything runs",
  },

  operator: {
    eyebrow: "GitOps for databases",
    h2: "Reconcile a database on a schema published as an OCI artifact.",
    p: "The Ptah Operator pins the tag to a digest and uses only that digest. It verifies the artifact, observes the database and publishes a plan. By default it applies the plan only after an approval that names it, then observes the database again instead of trusting the job's exit code. Destructive plans are off by default; enabling them still binds the approval to the exact plan bytes.",
    explore: "Explore the operator →",
    note: "Optional Kubernetes workflow · the CLI works on its own · PostgreSQL and MySQL · v1alpha1, a preview",
    loopTitle: "PtahSchema · reconcile loop",
    steps: ["resolve tag → digest", "verify artifact", "observe database", "publish plan", "approve", "apply", "observe again"],
    reconcile: "RECONCILE",
    every: "every interval · on change",
    afterApply: "after apply",
    start: "START",
    notes: [
      "destructive plans are off by default; enabling them binds the approval to the exact plan bytes",
      "the loop trusts what it observes in the database, not the apply job's exit code",
    ],
    aria: "Reconcile loop of the Ptah Operator: 01 resolve tag to digest, 02 verify artifact, 03 observe database, 04 publish plan, 05 approve, 06 apply, 07 observe again, then back to 01",
  },

  databases: {
    eyebrow: "Databases",
    h2: "Ten engines. Coverage stated per engine, not implied.",
    counts: (declared, probed, certified) => [
      { strong: String(declared) },
      " declared release lines · ",
      { strong: String(probed) },
      " probed against a live server on every change to master and every night · ",
      { strong: String(certified) },
      " certified. Ask your own server: ",
      { code: "ptah db capabilities --db-url …" },
      " ",
      { href: "https://docs.ptah.run/edge/databases/support-matrix/", text: "Support matrix →" },
    ],
    notes: {
      postgres: "primary target, broadest coverage",
      sqlite: "local work, examples, tests",
      mysql: "supported, dialect limits",
      mariadb: "supported, dialect limits",
      cockroachdb: "PostgreSQL path, capability differences",
      yugabytedb: "PostgreSQL path, capability differences",
      sqlserver: "conservative portable subset",
      oracle: "renders, plans, reads a live catalog",
      clickhouse: "capability-limited",
      spanner: "most conservative, best-effort testing",
    },
    toolingLabel: "Tooling",
    tooling: [
      { code: "ptah" },
      " is the product. ",
      { code: "ptah-ls" },
      " gives editor support for Go annotations. ",
      { href: "https://github.com/stokaro/ptah-action", text: "GitHub Action" },
      ", ",
      { href: "https://operator.ptah.run/", text: "Kubernetes Operator" },
      ", Go packages at ",
      { code: "ptah.run" },
      ".",
    ],
    atlasLabel: "Coming from Atlas",
    atlas: [
      { code: "ptah-compat" },
      " keeps Atlas-shaped commands while executing Ptah behavior. Independent clean-room implementation, not affiliated with Ariga. ",
      { href: "https://docs.ptah.run/edge/atlas/overview/", text: "Atlas compatibility →" },
    ],
  },
};

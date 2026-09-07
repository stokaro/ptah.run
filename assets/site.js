/* ptah.run — progressive enhancements.
 *
 * Everything on the site works without this file. It adds: the theme toggle,
 * the mobile menu, copy-to-clipboard on commands, the platform-detecting tabs
 * on /install/, and a best-effort refresh of the release version from the
 * GitHub API (the HTML carries the last known release as a fallback).
 */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;

  function $(sel, ctx) {
    return (ctx || doc).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  /* ---------- Theme ---------- */

  var themeBtn = $(".theme-btn");
  var THEME_COLORS = { light: "#fbfbfa", dark: "#161311" };
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function labelTheme() {
    if (!themeBtn) return;
    var theme = currentTheme();
    // Fixed name ("Dark theme") plus a pressed state, never a changing verb.
    themeBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    // Browser chrome follows the page, not only the system setting.
    $$('meta[name="theme-color"]').forEach(function (m) {
      m.removeAttribute("media");
      m.setAttribute("content", THEME_COLORS[theme]);
    });
  }
  if (themeBtn) {
    labelTheme();
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("ptah-theme", next);
      } catch (e) {
        /* storage unavailable: the choice lasts for this page only */
      }
      labelTheme();
    });
  }

  /* ---------- Mobile menu ---------- */

  var header = $(".site-header");
  var menuBtn = $(".menu-btn");
  if (header && menuBtn) {
    function setMenu(open) {
      header.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      // The links precede the button in the DOM, so put focus on the first
      // one when the menu opens; otherwise Tab would skip the menu entirely.
      if (open) {
        var first = $(".nav-links a", header);
        if (first) first.focus();
      }
    }
    menuBtn.addEventListener("click", function () {
      setMenu(!header.classList.contains("is-open"));
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    doc.addEventListener("click", function (e) {
      if (header.classList.contains("is-open") && !header.contains(e.target)) setMenu(false);
    });
  }

  /* ---------- Copy buttons ---------- */

  var copyStatus = $("#copy-status");
  $$("[data-copy]").forEach(function (btn) {
    var target = doc.getElementById(btn.getAttribute("data-copy"));
    if (!target) return;
    var label = $(".copy-text", btn) || btn;
    var idle = label.textContent;
    var name = btn.getAttribute("data-copy-name") || "command";
    var timer = null;
    btn.addEventListener("click", function () {
      var text = target.getAttribute("data-copy-text") || target.textContent.replace(/^\$\s+/, "");
      var done = function () {
        btn.setAttribute("data-state", "done");
        label.textContent = "Copied";
        if (copyStatus) copyStatus.textContent = "Copied the " + name + " to the clipboard.";
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.removeAttribute("data-state");
          label.textContent = idle;
          if (copyStatus) copyStatus.textContent = "";
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          fallbackCopy(text) && done();
        });
      } else if (fallbackCopy(text)) {
        done();
      }
    });
  });

  function fallbackCopy(text) {
    var ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    doc.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = doc.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    doc.body.removeChild(ta);
    return ok;
  }

  /* ---------- Install tabs ---------- */

  var tablist = $(".tablist");
  if (tablist) {
    var tabs = $$('[role="tab"]', tablist);
    var panels = tabs.map(function (t) {
      return doc.getElementById(t.getAttribute("aria-controls"));
    });
    var ids = tabs.map(function (t) {
      return t.getAttribute("data-tab");
    });

    function detectPlatform() {
      var uaData = navigator.userAgentData;
      var plat = (uaData && uaData.platform) || navigator.platform || "";
      var ua = navigator.userAgent || "";
      var s = plat + " " + ua;
      if (/Mac|iPhone|iPad|iPod/i.test(s)) return "macos";
      if (/Win/i.test(s)) return "windows";
      return "linux";
    }
    var names = { macos: "macOS", linux: "Linux", windows: "Windows" };
    var detected = detectPlatform();
    var detectedEl = $(".detected");
    if (detectedEl) detectedEl.textContent = "detected: " + names[detected];

    function select(id, opts) {
      opts = opts || {};
      var idx = ids.indexOf(id);
      if (idx < 0) return;
      tabs.forEach(function (t, i) {
        var on = i === idx;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle("is-active", on);
        if (on) panels[i].removeAttribute("hidden");
        else panels[i].setAttribute("hidden", "");
      });
      if (opts.focus) tabs[idx].focus();
      if (opts.hash && history.replaceState) {
        history.replaceState(null, "", "#" + id);
      }
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        select(ids[i], { hash: true });
      });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") n = 0;
        else if (e.key === "End") n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        select(ids[n], { focus: true, hash: true });
      });
    });

    var fromHash = location.hash.replace(/^#/, "");
    select(ids.indexOf(fromHash) >= 0 ? fromHash : detected);
    window.addEventListener("hashchange", function () {
      var h = location.hash.replace(/^#/, "");
      if (ids.indexOf(h) >= 0) select(h);
    });
  }

  /* ---------- Release version ---------- */

  var versionEls = $$("[data-version]");
  var bareEls = $$("[data-version-bare]");
  if (versionEls.length || bareEls.length) {
    var KEY = "ptah-latest-release";
    var TTL = 60 * 60 * 1000;
    var API = "https://api.github.com/repos/stokaro/ptah/releases/latest";

    function apply(tag) {
      var bare = tag.replace(/^v/, "");
      versionEls.forEach(function (el) {
        el.textContent = tag;
      });
      bareEls.forEach(function (el) {
        el.textContent = bare;
      });
    }
    function cached() {
      try {
        var c = JSON.parse(sessionStorage.getItem(KEY) || "null");
        if (c && typeof c.tag === "string" && Date.now() - c.t < TTL) return c.tag;
      } catch (e) {
        /* ignore */
      }
      return null;
    }
    var known = cached();
    if (known) {
      apply(known);
    } else if (window.fetch) {
      fetch(API, { headers: { Accept: "application/vnd.github+json" } })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (j) {
          var tag = j && j.tag_name;
          if (typeof tag !== "string" || !/^v\d+\.\d+\.\d+$/.test(tag)) return;
          try {
            sessionStorage.setItem(KEY, JSON.stringify({ tag: tag, t: Date.now() }));
          } catch (e) {
            /* ignore */
          }
          apply(tag);
        })
        .catch(function () {
          /* offline or rate-limited: the HTML keeps the last known release */
        });
    }
  }

  /* ---------- Hero demo ----------
   *
   * A scripted `ptah-quick-start` session. Every command and every line of
   * output here was captured from a real run of the documented quick start;
   * the same text sits in the markup as a transcript, which is what a reader
   * without this script gets. Nothing is invented and nothing is executed:
   * the player replays bytes.
   *
   * The one thing it adds beyond a typewriter is the arc. The line you write
   * into schema.sql and the line `ptah db read` finds in the database are
   * marked the same way, so the eye connects them across the apply that put
   * one there because of the other.
   */
  var demo = $("[data-demo]");
  if (demo) {
    var screen = $("[data-demo-screen]", demo);
    var syncPill = $("[data-demo-sync]", demo);
    var controls = $("[data-demo-controls]", demo);
    var toggleBtn = $("[data-demo-toggle]", demo);
    var speedBtn = $("[data-demo-speed]", demo);
    var speedLabel = $("[data-demo-speed-label]", demo);
    var replayBtn = $("[data-demo-replay]", demo);
    var expandBtn = $("[data-demo-expand]", demo);
    var progress = $("[data-demo-progress]", demo);
    var progressFill = $("span", progress);
    var modal = $("[data-demo-modal]");
    var where = $(".demo-where", demo);
    var pick = $("[data-demo-pick]");
    // Filled once the scenarios exist: two of these buttons are slots, and a
    // slot with no scenario on it is not a button yet.
    var pickBtns;
    var caption = $("[data-demo-caption]");

    // Kinds: cmd and cont are typed, everything else arrives whole. `new`
    // marks the added column, in the file and again in the database.
    var CHANGE = [
      ["sync", "no drift"],
      ["note", "# Write the database's own schema into a file."],
      ["cmd", "ptah db read --db-url sqlite://app.db | tee schema.sql"],
      ["sql", 'CREATE TABLE "users" ('],
      ["sql", '  "id" INTEGER PRIMARY KEY,'],
      ["sql", '  "email" TEXT NOT NULL'],
      ["sql", ");"],
      ["note", "# Drift compares that file with the database it came from."],
      ["cmd", "ptah schema drift --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db"],
      ["out", "No schema drift detected."],
      ["note", "# Now ask for a column, by rewriting the schema you want."],
      ["cmd", "cat > schema.sql <<'SQL'"],
      ["out", 'CREATE TABLE "users" ('],
      ["out", '  "id" INTEGER PRIMARY KEY,'],
      ["out", '  "email" TEXT NOT NULL,'],
      ["new", '  "created_at" TEXT'],
      ["out", ");"],
      ["out", "SQL"],
      ["sync", "drift"],
      ["note", "# The same check now has something to report."],
      ["cmd", "ptah schema drift --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db"],
      ["err", "Schema drift detected (highest severity: warning)."],
      ["mute", "Failure threshold: all. Failing: true."],
      ["mute", "Database: sqlite://app.db"],
      ["blank"],
      ["mute", "Findings:"],
      ["new", "- columns_added: 1 (warning)"],
      ["note", "# Ask what it would take to close it. A dry run executes nothing."],
      ["cmd", "ptah schema apply --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db --dry-run"],
      ["mute", "Planned schema changes:"],
      ["sql", 'ALTER TABLE "users" ADD COLUMN "created_at" TEXT;'],
      ["note", "# Run the reviewed plan. --auto-approve suits a disposable file."],
      ["cmd", "ptah schema apply --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db --auto-approve"],
      ["mute", "Planned schema changes:"],
      ["sql", 'ALTER TABLE "users" ADD COLUMN "created_at" TEXT;'],
      ["mute", "Auto-approval enabled; applying schema changes."],
      ["wait", 400],
      ["out", "Schema apply completed successfully."],
      ["note", "# And the same check, a third time."],
      ["cmd", "ptah schema drift --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db"],
      ["out", "No schema drift detected."],
      ["sync", "no drift"]
    ];

    // What the other three scenarios take for granted: the schema is Go, and
    // the SQL is rendered from it per engine. Captured by running
    // `ptah schema render` over the entity shown here, once per dialect. The
    // scanning and dependency-order lines it prints go to stderr, so stdout is
    // the SQL alone. The annotations carry the `sql` colour and the Go around
    // them is muted, because the annotations are the declaration and the
    // struct is where it is written down.
    var ENTITIES = [
      ["sync", "postgres"],
      ["note", "# The schema is a Go struct. The annotations are the declaration."],
      ["cmd", "cat entities/user.go"],
      ["mute", "package entities"],
      ["blank"],
      ["sql", '//ptah:schema:table name="users"'],
      ["mute", "type User struct {"],
      ["sql", '\t//ptah:schema:field name="id" type="SERIAL" primary="true"'],
      ["mute", "\tID int64"],
      ["sql", '\t//ptah:schema:field name="email" type="VARCHAR(255)" not_null="true"'],
      ["mute", "\tEmail string"],
      ["sql", '\t//ptah:schema:field name="plan" type="ENUM" enum="free,team,enterprise"'],
      ["mute", "\tPlan string"],
      ["mute", "}"],
      ["note", "# Render it for PostgreSQL."],
      ["cmd", "ptah schema render --root-dir . --dialect postgres"],
      ["mute", "-- Statement 1/2"],
      ["new", "CREATE TYPE \"enum_user_plan\" AS ENUM ('free', 'team', 'enterprise');"],
      ["blank"],
      ["mute", "-- Statement 2/2"],
      ["mute", "-- POSTGRES TABLE: users --"],
      ["sql", 'CREATE TABLE "users" ('],
      ["sql", '  "id" SERIAL PRIMARY KEY NOT NULL,'],
      ["sql", '  "email" VARCHAR(255) NOT NULL,'],
      ["new", '  "plan" enum_user_plan'],
      ["sql", ");"],
      ["sync", "sqlite"],
      ["note", "# The same file, one flag apart."],
      ["cmd", "ptah schema render --root-dir . --dialect sqlite"],
      ["mute", "-- Statement 1/1"],
      ["sql", 'CREATE TABLE "users" ('],
      ["sql", '  "id" INTEGER PRIMARY KEY,'],
      ["sql", '  "email" TEXT NOT NULL,'],
      ["new", "  \"plan\" TEXT CHECK (plan IN ('free', 'team', 'enterprise'))"],
      ["sql", ");"],
      ["note", "# No enum type in SQLite, so it is a CHECK. Nothing was dropped."]
    ];

    // The other half of "without surprises": the change that does not run.
    // Captured from `ptah migrations lint` over a directory whose one file
    // drops a column, exit code 1. The diagnostic is long because it names the
    // consequence and the safer order; that length is the point, so it wraps
    // here rather than being trimmed into a slogan.
    var GUARD = [
      ["sync", "review"],
      ["note", "# A pull request adds this migration."],
      ["cmd", "cat migrations/1700000100_drop_email.up.sql"],
      ["sql", 'ALTER TABLE "users" DROP COLUMN "email";'],
      ["note", "# Check it before it reaches a database."],
      ["cmd", "ptah migrations lint --dir ./migrations \\"],
      ["cont", "    --dialect postgres"],
      ["wait", 400],
      ["mute", "migrations/1700000100_drop_email.up.sql:1 [warning] BC104: dropping a column retires a name application versions already deployed against the old schema still select and insert, so each of them starts failing the moment this migration commits, whether or not the column held any rows; deploy readers that no longer use the column first, then drop it in a later release (dropped column breaks deployed code)"],
      ["err", "migrations/1700000100_drop_email.up.sql:1 [error] DS102: DROP COLUMN permanently deletes the column's data; deploy readers that no longer use the column first, then drop it in a later release (column dropped)"],
      ["blank"],
      ["out", "2 finding(s)."],
      ["mute", "warning: DS110P ran without the baseline schema it reads, so this analysis is thinner than the same directory would get against a dev database the run can read"],
      ["sync", "blocked"],
      ["note", "# The exit code is what fails the build."],
      ["cmd", "echo $?"],
      ["out", "1"]
    ];

    // Everything below was captured by running the command shown, on Linux,
    // against a throwaway sqlite database in /tmp/app. Output is stdout; the
    // progress and dependency-order chatter these commands write goes to
    // stderr and is not part of a transcript a reader would see in a pipeline.

    // The declaration becomes a pair of files with a version, rather than a
    // change applied straight to the database.
    var VERSIONED = [
      ["sync", "1 pending"],
      ["note", "# Turn the declaration into a versioned migration."],
      ["cmd", "ptah migrations generate --root-dir ./entities \\"],
      ["cont", "    --db-url sqlite://app.db --migrations-dir ./migrations \\"],
      ["cont", "    --name create_users_and_posts"],
      ["out", "Generated migration files for sqlite://app.db:"],
      ["mute", "UP:   /tmp/app/migrations/1788809709_create_users_and_posts.up.sql"],
      ["mute", "DOWN: /tmp/app/migrations/1788809709_create_users_and_posts.down.sql"],
      ["note", "# A down file too, written at the same time as the up."],
      ["cmd", "ptah migrations up --db-url sqlite://app.db \\"],
      ["cont", "    --migrations-dir ./migrations"],
      ["mute", "=== MIGRATE UP ==="],
      ["mute", "Current version: 0"],
      ["mute", "Total migrations: 1"],
      ["mute", "Pending migrations: 1"],
      ["blank"],
      ["out", "✅ Migrations completed successfully!"],
      ["new", "Database is now at version: 1788809709"],
      ["sync", "up to date"],
      ["note", "# And the revision table agrees."],
      ["cmd", "ptah migrations status --db-url sqlite://app.db \\"],
      ["cont", "    --migrations-dir ./migrations"],
      ["mute", "=== MIGRATION STATUS ==="],
      ["mute", "Database: ***"],
      ["mute", "Current Version: 1788809709"],
      ["mute", "Applied Migrations: 1"],
      ["new", "Pending Migrations: 0"]
    ];

    // The other direction: a database that exists, and no declaration of it.
    var ADOPT = [
      ["sync", "no declaration"],
      ["note", "# A database nobody ever wrote a schema file for."],
      ["cmd", "ptah introspect --db-url sqlite://app.db --out ./models"],
      ["out", "Generated 2 Go file(s) in /tmp/app/models"],
      ["mute", "Imported 2 table(s), 5 field(s), 0 enum(s)"],
      ["sync", "declared"],
      ["note", "# What it wrote is the annotated Go you would have written."],
      ["cmd", "cat models/posts.go"],
      ["mute", "// Code generated by ptah introspect; DO NOT EDIT."],
      ["blank"],
      ["mute", "package models"],
      ["blank"],
      ["sql", '//ptah:schema:table name="posts"'],
      ["mute", "type Posts struct {"],
      ["sql", '\t//ptah:schema:field name="id" type="INTEGER" primary="true"'],
      ["mute", "\tId *int"],
      ["new", '\t//ptah:schema:field name="user_id" type="INT" not_null="true" foreign="users(id)" foreign_key_name="fk_posts_user_id" on_delete="NO ACTION" on_update="NO ACTION"'],
      ["mute", "\tUserId int"],
      ["sql", '\t//ptah:schema:field name="title" type="TEXT" not_null="true"'],
      ["mute", "\tTitle string"],
      ["mute", "}"],
      ["note", "# The constraint came back with its name and its actions."]
    ];

    // The same annotations, drawn rather than rendered.
    var DIAGRAM = [
      ["sync", "mermaid"],
      ["note", "# The declaration is also a diagram."],
      ["cmd", "ptah viz --root-dir ./entities --format mermaid \\"],
      ["cont", "    --include-columns"],
      ["out", "erDiagram"],
      ["out", "  users {"],
      ["out", "    SERIAL id PK"],
      ["out", "    VARCHAR_255 email"],
      ["out", "  }"],
      ["out", "  posts {"],
      ["out", "    SERIAL id PK"],
      ["out", "    INT user_id FK"],
      ["out", "    VARCHAR_200 title"],
      ["out", "  }"],
      ["new", '  users ||--o{ posts : "fk_posts_user_id"'],
      ["note", "# The relationship is read off the foreign key, not a second file."]
    ];

    // Downstream of the schema: the API layer that reads the same tables.
    var API = [
      ["sync", "graphql"],
      ["note", "# The same declaration, exported for the layer above it."],
      ["cmd", "ptah schema export --to graphql --root-dir ./entities \\"],
      ["cont", "    --out schema.graphql"],
      ["out", "Exported GraphQL schema to /tmp/app/schema.graphql"],
      ["mute", "Found 2 table(s), 5 field(s), 0 enum(s)"],
      ["cmd", "cat schema.graphql"],
      ["mute", "# Code generated by ptah; DO NOT EDIT."],
      ["blank"],
      ["sql", "type User {"],
      ["sql", "  id: ID!"],
      ["sql", "  email: String!"],
      ["sql", "}"],
      ["blank"],
      ["sql", "type Post {"],
      ["sql", "  id: ID!"],
      ["sql", "  user_id: Int!"],
      ["sql", "  title: String!"],
      ["new", "  user: User!"],
      ["sql", "}"],
      ["note", "# The last field is the foreign key, read as a relation."]
    ];

    // The same export, aimed at a diagram tool instead of an API.
    var DBML = [
      ["sync", "dbml"],
      ["note", "# A diagramming tool wants DBML. One flag apart."],
      ["cmd", "ptah schema export --to dbml --root-dir ./entities \\"],
      ["cont", "    --out schema.dbml"],
      ["out", "Exported DBML schema to /tmp/app/schema.dbml"],
      ["mute", "Found 2 table(s), 5 field(s), 0 enum(s)"],
      ["cmd", "cat schema.dbml"],
      ["sql", 'Table "posts" {'],
      ["sql", '  "id" SERIAL [pk]'],
      ["sql", '  "user_id" INT [not null]'],
      ["sql", '  "title" VARCHAR(200) [not null]'],
      ["sql", "}"],
      ["blank"],
      ["sql", 'Table "users" {'],
      ["sql", '  "id" SERIAL [pk]'],
      ["sql", '  "email" VARCHAR(255) [not null]'],
      ["sql", "}"],
      ["blank"],
      ["new", 'Ref "posts"."user_id" > "users"."id"'],
      ["note", "# Nothing was described twice to get this."]
    ];

    // What Ptah decided about the server in front of it, and why.
    var CAPABILITIES = [
      ["sync", "sqlite 3"],
      ["note", "# Ask what Ptah resolved for the server it is talking to."],
      ["cmd", "ptah db capabilities --db-url sqlite://app.db"],
      ["mute", "Dialect:            sqlite"],
      ["mute", "Server version:     3.53.4"],
      ["mute", "Capability preset:  SQLite3 (sqlite)"],
      ["mute", "Preset source:      version-ladder"],
      ["out", "Support level:      certified"],
      ["blank"],
      ["mute", "Behavior:"],
      ["mute", "  identifier_limit       unlimited"],
      ["new", "  enum_modeling          unsupported"],
      ["mute", "  foreign_key_reference  unique"],
      ["blank"],
      ["mute", "Capabilities:"],
      ["mute", "  advisory_locks                          unsupported"],
      ["mute", "  catalog_partitions                      supported"],
      ["note", "# enum_modeling is why a declared enum arrives here as a CHECK."]
    ];

    // Schema shape as numbers, for a pipeline that already charts numbers.
    var STATS = [
      ["sync", "openmetrics"],
      ["note", "# Schema shape, in a format a metrics pipeline already reads."],
      ["cmd", "ptah schema stats --db-url sqlite://app.db"],
      ["mute", "# HELP ptah_schema_tables Tables."],
      ["mute", "# TYPE ptah_schema_tables gauge"],
      ["new", 'ptah_schema_tables{dialect="sqlite"} 2'],
      ["mute", "# HELP ptah_schema_columns Columns across all tables."],
      ["mute", "# TYPE ptah_schema_columns gauge"],
      ["new", 'ptah_schema_columns{dialect="sqlite"} 5'],
      ["mute", "# HELP ptah_schema_indexes Indexes."],
      ["mute", "# TYPE ptah_schema_indexes gauge"],
      ["mute", 'ptah_schema_indexes{dialect="sqlite"} 0'],
      ["note", "# Counts of objects, never of rows. Shape, not contents."]
    ];

    // What breaks if this column goes, asked before the drop rather than after.
    var LINEAGE = [
      ["sync", "static"],
      ["note", "# Which view columns depend on which base columns?"],
      ["cmd", "ptah schema lineage --schema-file schema.sql \\"],
      ["cont", "    --dialect sqlite"],
      ["mute", "SOURCE       FEEDS               KIND"],
      ["new", "users.email  active_users.email  view"],
      ["out", "users.id     active_users.id     view"],
      ["note", "# Static, and without --db-url it contacts nothing."]
    ];

    // The reviewed plan is the plan that runs, and the signature is what says so.
    var APPROVE = [
      ["sync", "planned"],
      ["note", "# Save the plan, so what is reviewed is what runs."],
      ["cmd", "ptah schema plan --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db --name add-active-users \\"],
      ["cont", "    --output plan.json"],
      ["mute", "Planned schema changes:"],
      ["sql", 'CREATE TABLE "users" ('],
      ["sql", '  "id" INTEGER PRIMARY KEY,'],
      ["sql", '  "email" TEXT NOT NULL,'],
      ["sql", '  "legacy_ref" TEXT'],
      ["sql", ");"],
      ["out", "Plan saved to file://plan.json"],
      ["sync", "approved"],
      ["note", "# Sign it. Ptah never reads the key; ssh-keygen does."],
      ["cmd", "ptah schema approve --plan plan.json --key ./release_key"],
      ["out", "Approved plan.json"],
      ["mute", "Signature: plan.json.sig"],
      ["cmd", "ptah schema verify-approval --plan plan.json"],
      ["out", "Approved by release@example.com"],
      ["mute", "Plan digest: cb74d5837d3efb8c1a8c93bd930fd0321d12abc5e13fd731ff129c43bf0bfc41"],
      ["note", "# Now change one identifier in the approved plan."],
      ["cmd", "sed -i 's/legacy_ref/legacy_id/g' plan.json"],
      ["cmd", "ptah schema verify-approval --plan plan.json"],
      ["sync", "refused"],
      ["err", "error: approval does not verify against .ptah/allowed_signers: either the plan changed after it was approved, or it was signed by a key that file does not list"],
      ["note", "# Exit 2. An edited plan is a plan nobody approved."]
    ];

    // The Atlas-shaped surface, for a pipeline already written against it.
    var COMPAT = [
      ["sync", "atlas dir"],
      ["note", "# An existing Atlas pipeline, and the same flags."],
      ["cmd", "ptah-compat migrate diff add_users --dir file://migrations \\"],
      ["cont", "    --to file://schema.sql \\"],
      ["cont", '    --dev-url "sqlite://dev.db?mode=memory"'],
      ["out", "Created migration file: /tmp/app/migrations/20260907193826_add_users.sql"],
      ["mute", "Updated migration checksum: /tmp/app/migrations/atlas.sum"],
      ["note", "# It wrote an Atlas directory: the timestamped file, and atlas.sum."],
      ["cmd", "cat migrations/atlas.sum"],
      ["mute", "h1:9q+8PcnP03kKT2aZzOj4MHlWEilRmbPXaScNvs2FJzI="],
      ["mute", "20260907193826_add_users.sql h1:eXKVFuXvHFnneZKiWkpyJSHeF5q8KlZCCXJqM7JNymE="],
      ["note", "# And apply reads that same directory."],
      ["cmd", "ptah-compat migrate apply --dir file://migrations \\"],
      ["cont", "    --url sqlite://app.db"],
      ["mute", "Migrating to version 20260907193826 from 1 pending migrations."],
      ["out", "Migration complete. Current version: 20260907193826"],
      ["sync", "applied"],
      ["note", "# No script changed. The native surface is still there underneath."]
    ];

    // The third thing Ptah migrates: the vectors, not the columns. Every line
    // is either quoted from the inference quick start or captured from a run of
    // its own fixture, which is why the generation id and the transaction
    // number are the ones that run produced.
    var INFERENCE = [
      ["sync", "1 generation"],
      ["note", "# A new embedding model. Plan measures what it would take."],
      ["cmd", "ptah inference plan"],
      ["out", "source.estimated_rows = 3 (measured)"],
      ["out", "target.capability.vector_type = true (measured)"],
      ["sql", "[backfill] embed 3 in-scope source rows"],
      ["mute", "Consistency mode: outbox"],
      ["note", "# Build the new generation beside the one being served."],
      ["cmd", "ptah inference prepare"],
      ["out", "prepared run quick-start for generation b7cc9eb5c7d2"],
      ["mute", "  - snapshot boundary: 753"],
      ["cmd", "ptah inference backfill --batch-rows 10"],
      ["out", "backfill finished: 3 scanned, 3 embedded, 0 skipped"],
      ["sync", "candidate"],
      ["note", "# Rows that changed while it ran are caught up, then indexed."],
      ["cmd", "ptah inference catchup --batch-rows 10"],
      ["out", "caught up to transaction 761: 0 changed rows, 0 tombstoned"],
      ["cmd", "ptah inference index"],
      ["out", "generation b7cc9eb5c7d2 has a valid index"],
      ["note", "# Check it before anything reads it."],
      ["cmd", "ptah inference verify"],
      ["out", "3 source rows, 3 target rows"],
      ["new", "every deterministic layer passed"],
      ["sync", "verified"],
      ["note", "# Queries still read the old vectors. Cutover is its own approved step."]
    ];

    var SCENARIOS = {
      change: {
        script: CHANGE,
        label: "Change a schema",
        where: "sh · ptah-quick-start",
        caption:
          "Know exactly what your migration will do before it touches the " +
          "database. The plan is the review surface; drift is the proof."
      },
      inference: {
        script: INFERENCE,
        label: "Migrate embeddings",
        where: "sh · ptah-inference",
        caption:
          "A new embedding model is built and checked beside the one being " +
          "served. Queries keep reading the old vectors until an approved " +
          "cutover moves them."
      },
      guard: {
        script: GUARD,
        label: "Stop an unsafe one",
        where: "sh · ptah-ci",
        caption:
          "A migration that would delete data is refused before it runs, with " +
          "the reason and the safer order. Exit code 1 fails the build."
      },
      entities: {
        script: ENTITIES,
        label: "Go structs to SQL",
        where: "sh · ptah-entities",
        caption:
          "The schema is annotated Go, and one file renders for each engine " +
          "in the terms that engine has: PostgreSQL gets a real enum type, " +
          "SQLite the CHECK constraint that means the same thing."
      },
      versioned: {
        script: VERSIONED,
        label: "Write a migration",
        where: "sh · ptah-migrations",
        caption:
          "The other route: versioned files with an up and a down, applied in " +
          "order and recorded in a revision table."
      },
      adopt: {
        script: ADOPT,
        label: "Adopt a database",
        where: "sh · ptah-adopt",
        caption:
          "A database that predates any declaration becomes annotated Go, " +
          "constraint names and referential actions included."
      },
      diagram: {
        script: DIAGRAM,
        label: "Draw the schema",
        where: "sh · ptah-viz",
        caption:
          "The declaration is the diagram too, with the relationships read " +
          "off the foreign keys rather than kept in a second file."
      },
      api: {
        script: API,
        label: "Export a GraphQL API",
        where: "sh · ptah-export",
        caption:
          "One schema, and the layer above it. A foreign key becomes a " +
          "relation field, so the two cannot drift apart."
      },
      dbml: {
        script: DBML,
        label: "Export to DBML",
        where: "sh · ptah-export",
        caption:
          "The same source feeds a diagramming tool. HCL, OpenAPI, GraphQL, " +
          "Protobuf, Markdown and DBML are all one flag."
      },
      capabilities: {
        script: CAPABILITIES,
        label: "Ask what it supports",
        where: "sh · ptah-capabilities",
        caption:
          "What Ptah resolved for the server in front of it, and where the " +
          "answer came from. Nothing about a target is guessed."
      },
      stats: {
        script: STATS,
        label: "Chart schema shape",
        where: "sh · ptah-stats",
        caption:
          "Object counts in OpenMetrics, so schema shape can be charted by " +
          "the pipeline that already charts everything else."
      },
      lineage: {
        script: LINEAGE,
        label: "Trace a column",
        where: "sh · ptah-lineage",
        caption:
          "Which view columns depend on which base columns, answered before " +
          "the drop rather than after it."
      },
      approve: {
        script: APPROVE,
        label: "Sign off a plan",
        where: "sh · ptah-release",
        caption:
          "A plan saved, signed with an SSH key, and refused the moment one " +
          "identifier in it changes. The reviewed plan is the plan that runs."
      },
      compat: {
        script: COMPAT,
        label: "Run Atlas scripts",
        where: "sh · ptah-compat",
        caption:
          "ptah-compat answers to the Atlas command surface and writes an " +
          "Atlas migration directory, so an existing pipeline keeps working."
      }
    };

    // Two of the four choices are always there: the schema cycle and the
    // inference cycle are what Ptah is for. The other two are drawn from the
    // rest on each load, so a second visit has something new to show without
    // hiding twelve scenarios behind a "more examples" link nobody clicks.
    var ROTATING = [
      "guard", "entities", "versioned", "adopt", "diagram", "api", "dbml",
      "capabilities", "stats", "lineage", "approve", "compat"
    ];

    (function drawTwo() {
      var pool = ROTATING.slice();
      var slots = $$("[data-demo-slot]", pick);
      for (var i = 0; i < slots.length && pool.length; i++) {
        var key = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        slots[i].setAttribute("data-demo-scenario", key);
        slots[i].textContent = SCENARIOS[key].label;
        slots[i].hidden = false;
      }
    })();

    pickBtns = $$("[data-demo-scenario]", pick);

    var SCRIPT = CHANGE;

    var CLASS = { mute: "m", sql: "a", new: "n", err: "e", note: "c" };

    // What each event is expected to cost. The typing jitter makes the real
    // figure vary by a few per cent, which is invisible on a two-pixel rule and
    // much cheaper than measuring a duration nobody knows before it runs.
    // Every beat is proportional to what the reader has just been given. A
    // one-line answer needs a moment; the lint diagnostic is a paragraph and
    // needs several. Fixed beats were the same length after both, which is why
    // the long one read as too fast and the short one as a stall.
    var TYPE_SCALE = 1.2;

    function typeTime(text) {
      return 460 + text.length * 32 * TYPE_SCALE;
    }

    // Prose is read; a command is scanned for its flags. Both scale, at
    // different rates, and both have a floor so a short line still lands.
    function readTime(text, kind) {
      if (kind === "note") return 900 + text.length * 30;
      return 700 + text.length * 14;
    }

    // The beat after output, before the next step is announced. Capped, because
    // past a few seconds a pause stops reading as deliberate.
    function outputBeat(printed) {
      return Math.min(4600, 1000 + printed * 11);
    }

    function isOutput(kind) {
      return kind !== "wait" && kind !== "sync" && kind !== "blank" &&
        kind !== "note" && kind !== "cmd" && kind !== "cont";
    }

    // Whether the event at index i is a command line the next line continues.
    function continues(i) {
      var next = SCRIPT[i];
      return !!next && next[0] === "cont";
    }

    // The duration of every event, walked in order so the beats that depend on
    // preceding output are computed exactly as the run will compute them. The
    // progress rule reads this, so it cannot drift from the keyboard.
    function plan(script) {
      var out = [];
      var printed = 0;
      for (var i = 0; i < script.length; i++) {
        var event = script[i];
        var kind = event[0];
        var ms;
        if (kind === "wait") {
          ms = event[1];
        } else if (kind === "note") {
          ms = outputBeat(printed) + 60 + typeTime(event[1]) + readTime(event[1], "note");
          printed = 0;
        } else if (kind === "cmd" || kind === "cont") {
          ms = typeTime(event[1]);
          if (!(script[i + 1] && script[i + 1][0] === "cont")) {
            ms += readTime(event[1], "cmd");
            printed = 0;
          }
        } else if (kind === "blank") {
          ms = 60;
        } else if (kind === "sync") {
          ms = 120;
        } else {
          ms = 70;
          printed += event[1].length;
        }
        out.push(ms);
      }
      return out;
    }

    var elapsed = 0;
    var duration = 0;
    var timings = [];
    var printed = 0;

    // Set where the rule is going and how long it has to get there, so the
    // browser animates between events and the script never has to tick.
    function advance(ms) {
      var to = duration ? Math.min(1, (elapsed + ms) / duration) : 0;
      progressFill.style.transition =
        ms && !still.matches ? "width " + ms / rate + "ms linear" : "none";
      progressFill.style.width = to * 100 + "%";
      elapsed += ms;
    }

    function freezeProgress() {
      var at = progressFill.getBoundingClientRect().width;
      var of = progress.getBoundingClientRect().width || 1;
      progressFill.style.transition = "none";
      progressFill.style.width = (at / of) * 100 + "%";
      elapsed = duration * (at / of);
    }
    var at = 0;
    var timer = null;
    var blink = null;
    var paused = false;
    var playing = false;
    var seen = false;

    function esc(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // The screen is rebuilt from a list of finished lines plus the one being
    // typed, so a replay is a reset of that list rather than a DOM rewind.
    var CURSOR = '<span class="demo-cursor" data-on="1">\u258d</span>';
    var lines = [];
    var typing = null;
    var idle = false;

    // Each line is its own block, so a line too long for the frame wraps under
    // its own indent instead of restarting at column zero. A Go annotation or
    // a lint diagnostic broken that way reads as a new top-level line, which
    // is the one thing the shape of a transcript is supposed to tell you.
    function row(inner) {
      // A blank separator is still a row, and an empty block is neither a line
      // on screen nor a line in what a reader selects out of the frame.
      return '<span class="l">' + (inner || " ") + "</span>";
    }

    function paint() {
      var rows = lines.slice();
      if (typing !== null) {
        var cls = CLASS[typing.kind];
        var head = typing.kind === "cmd" ? '<span class="p">$</span> ' : "";
        var body = esc(typing.text) + CURSOR;
        rows.push(head + (cls ? '<span class="' + cls + '">' + body + "</span>" : body));
      } else if (idle || paused) {
        // A shell that is not being typed at still shows a caret, and the
        // blink is how a reader tells waiting from finished.
        //
        // At the end of the last line, not on a new one: the pause belongs
        // BEFORE the line break. You finish a line, the caret sits where you
        // stopped while you read it, and only then does the session move on.
        // Breaking first and waiting after puts the beat in the wrong place --
        // the reader is looking at an empty row while the thing they were
        // meant to read has already scrolled up a line.
        //
        // `idle` is set only for the beats that are waits. Setting it for the
        // gaps between output lines would add and remove a caret every 70ms.
        if (rows.length) rows[rows.length - 1] += CURSOR;
        else rows.push(CURSOR);
      }
      // Whether to follow is decided before the write, because writing is what
      // moves the bottom. A reader who scrolled up to re-read a finding is not
      // dragged back down by the next line; returning to the bottom re-arms it.
      var following = screen.scrollHeight - screen.scrollTop - screen.clientHeight < 24;
      screen.innerHTML = rows.map(row).join("");
      if (following) screen.scrollTop = screen.scrollHeight;
    }

    function commit(kind, text) {
      var cls = CLASS[kind];
      var body = esc(text);
      if (kind === "cmd") body = '<span class="p">$</span> ' + body;
      lines.push(cls ? '<span class="' + cls + '">' + body + "</span>" : body);
      // A shell scrolls; the frame is fixed, so the oldest lines go rather
      // than the newest, which is the half a reader is looking at.
      while (lines.length > 200) lines.shift();
      typing = null;
      paint();
    }

    function setSync(state) {
      syncPill.textContent = state;
      syncPill.setAttribute("data-state", state === "no drift" ? "clear" : "pending");
    }

    // Everything above is planned time: the script, the plan, the progress
    // rule. The rate turns it into real time here and nowhere else, so a
    // reader changing the speed cannot make the bar and the keyboard disagree
    // about where in the session they are.
    var RATES = [0.5, 1, 2, 3];
    var rate = 1;
    var pending = null;

    // One chain of timeouts, always. Stopping it drops the beat in flight with
    // it, so nothing can reschedule a beat behind whatever runs next.
    function halt() {
      clearTimeout(timer);
      pending = null;
    }

    function after(ms, fn) {
      halt();
      pending = { ms: ms, fn: fn, at: Date.now() };
      timer = setTimeout(function () {
        var beat = pending;
        pending = null;
        beat.fn();
      }, ms / rate);
    }

    function setRate(next) {
      var beat = pending;
      // What the beat in flight still owes, in planned time. Without this a
      // reader who speeds up during a four-second pause waits out the old
      // pause first, and the control reads as broken.
      var left = beat ? Math.max(0, beat.ms - (Date.now() - beat.at) * rate) : 0;
      rate = next;
      speedLabel.textContent = next + "\u00d7";
      speedBtn.setAttribute("aria-label", "Playback speed, " + next + "\u00d7. Press to change.");
      if (beat && playing && !paused) after(left, beat.fn);
    }

    // A wait with a caret through it. The flag is cleared before the next thing
    // runs so that whatever paints next paints without it.
    function hold(ms, fn) {
      idle = true;
      printed = 0;
      paint();
      after(ms, function () {
        idle = false;
        fn();
      });
    }

    function type(kind, text, n) {
      if (paused) return;
      if (n > text.length) {
        return after(kind === "note" ? 240 : 320, function () {
          commit(kind, text);
          // A note is finished being typed but not finished being read: the
          // last words land at the same moment the command would start, and
          // the eye cannot be in two places.
          if (kind === "note") return hold(readTime(text, "note"), step);
          // A command that continues on the next line has not been entered
          // yet, so the beat belongs after its last line rather than inside
          // it.
          if (continues(at)) return after(140, step);
          hold(readTime(text, "cmd"), step);
        });
      }
      // The blank row that separates blocks belongs to the note, and it
      // arrives when the note does. Emitting it earlier would end the previous
      // beat on an empty line, which is exactly the line break the beat is
      // supposed to come before.
      if (n === 0 && kind === "note" && lines.length && lines[lines.length - 1] !== "") {
        lines.push("");
      }
      typing = { text: text.slice(0, n), kind: kind };
      paint();
      var ch = text.charAt(n - 1);
      // Prose is read as it lands, so it runs a little quicker than a command,
      // which is scanned character by character for a flag.
      var base = kind === "note" ? 14 : 20;
      var delay = ch === " " ? base + 14 : base + Math.random() * 30;
      after(delay * TYPE_SCALE, function () {
        type(kind, text, n + 1);
      });
    }

    function step() {
      if (paused) return;
      var event = SCRIPT[at];
      if (!event) {
        // A reader who pressed Play, or who expanded it, asked for one run.
        // Nothing is waiting for the reader once the session is over, so the
        // caret goes. Left blinking on a finished frame it asks for input that
        // does not exist, which is the one thing a caret should never say.
        idle = false;
        paint();
        if (!loops()) {
          elapsed = duration;
          advance(0);
          playing = false;
          label();
          return;
        }
        return after(4200, start);
      }
      at++;
      var kind = event[0];
      advance(timings[at - 1] || 0);
      if (kind === "wait") return hold(event[1], step);
      // A note introduces the next step, so the beat before it is the beat
      // after the last one finished: time to read what just happened before
      // being told what happens next.
      if (kind === "note") {
        return hold(outputBeat(printed), function () {
          type(kind, event[1], 0);
        });
      }
      if (isOutput(kind)) printed += event[1].length;
      if (kind === "sync") {
        setSync(event[1]);
        return after(120, step);
      }
      if (kind === "cmd" || kind === "cont") return type(kind, event[1], 0);
      if (kind === "blank") {
        lines.push("");
        paint();
        return after(60, step);
      }
      commit(kind, event[1]);
      after(70, step);
    }

    // A finished session, not a slower one. Where movement is unwanted the
    // answer is the result, not a longer wait for it.
    function settle() {
      halt();
      demo.classList.remove("is-playing");
      lines = [];
      typing = null;
      for (var i = 0; i < SCRIPT.length; i++) {
        var event = SCRIPT[i];
        if (event[0] === "wait") continue;
        if (event[0] === "sync") setSync(event[1]);
        else if (event[0] === "blank") lines.push("");
        else commit(event[0], event[1]);
      }
      paint();
      playing = false;
      elapsed = duration = 1;
      advance(0);
      label();
    }

    function start() {
      halt();
      at = 0;
      lines = [];
      typing = null;
      idle = false;
      playing = true;
      paused = false;
      elapsed = 0;
      printed = 0;
      timings = plan(SCRIPT);
      duration = timings.reduce(function (a, b) { return a + b; }, 0);
      advance(0);
      demo.classList.add("is-playing");
      label();
      paint();
      step();
    }

    function label() {
      var next = !playing || paused ? "Play" : "Pause";
      // The icon follows a data attribute rather than being swapped here, so
      // the two shapes live in the markup beside each other and CSS decides
      // which one shows -- the same shape the menu button already uses.
      demo.setAttribute("data-paused", next === "Play" ? "1" : "0");
      toggleBtn.setAttribute("aria-label", next + " the demo");
      toggleBtn.setAttribute("title", next);
      // While nothing is playing, Replay would do what Play does. One button
      // for one action keeps the bar to a single row on a phone.
      replayBtn.hidden = !playing;
    }

    // Two reasons to hold still, one behaviour. Reduced motion is a stated
    // preference. A narrow screen is a judgement: the commands wrap there, so
    // typing reflows the block line by line, it costs a phone battery for a
    // 30-second story nobody scrolled down to wait for, and the transcript is
    // the thing a reader can actually take away and paste.
    var still = window.matchMedia("(prefers-reduced-motion: reduce)");
    var narrow = window.matchMedia("(max-width: 720px)");

    function autoplays() {
      return !still.matches && !narrow.matches;
    }

    // Expanded, the session is something the reader chose to watch, so it runs
    // once and stops on its last frame. In the hero it is ambient and comes
    // round again, because a reader arriving mid-session should not have to
    // guess what the first half said.
    function loops() {
      return autoplays() && !demo.classList.contains("is-open");
    }

    function choose(name) {
      var scenario = SCENARIOS[name];
      if (!scenario) return;
      SCRIPT = scenario.script;
      where.textContent = scenario.where;
      caption.textContent = scenario.caption;
      for (var i = 0; i < pickBtns.length; i++) {
        pickBtns[i].setAttribute(
          "aria-pressed",
          pickBtns[i].getAttribute("data-demo-scenario") === name ? "true" : "false"
        );
      }
      // Switching is a request to watch that one, so it plays where the first
      // one would have played and settles where it would have settled.
      if (autoplays()) start();
      else settle();
    }

    demo.classList.add("is-live");
    screen.hidden = false;
    syncPill.hidden = false;
    controls.hidden = false;
    pick.hidden = false;
    progress.hidden = false;

    for (var b = 0; b < pickBtns.length; b++) {
      pickBtns[b].addEventListener("click", function () {
        choose(this.getAttribute("data-demo-scenario"));
      });
    }

    // Expanding moves the terminal rather than copying it: one node, one
    // running session, so the script does not restart and the two copies
    // cannot disagree about where it is.
    var home = demo.nextSibling;
    var homeParent = demo.parentNode;

    // The frame travels between its place in the page and the overlay instead
    // of one panel vanishing and another appearing, so the reader keeps hold of
    // the thing they clicked. Both positions are only ever known here, after
    // the move: measure where it was, let it land, then play the difference.
    var flight = null;

    function fly(from) {
      // Drop the handlers before cancelling: `cancel` is delivered later, and a
      // late `land` would clear the flight that replaced it. An interrupted
      // flight leaves from wherever it had got to, because `from` was measured
      // with its transform still applied.
      if (flight) {
        flight.onfinish = null;
        flight.oncancel = null;
        flight.cancel();
        flight = null;
      }
      if (still.matches || !demo.animate || !from.width) return;
      var to = demo.getBoundingClientRect();
      if (!to.width) return;
      var offset =
        "translate(" +
        (from.left - to.left) +
        "px," +
        (from.top - to.top) +
        "px) scale(" +
        from.width / to.width +
        "," +
        from.height / to.height +
        ")";
      demo.classList.add("is-flying");
      flight = demo.animate(
        [
          { transform: offset, transformOrigin: "0 0" },
          { transform: "none", transformOrigin: "0 0" }
        ],
        // Long enough to read as one movement, and eased at both ends: a curve
        // that spends most of its distance in the first third arrives before
        // the eye has followed it, which reads as a jump with a tail.
        { duration: 420, easing: "cubic-bezier(0.4, 0.02, 0.2, 1)" }
      );
      var land = function () {
        demo.classList.remove("is-flying");
        flight = null;
      };
      flight.onfinish = land;
      flight.oncancel = land;
    }

    function setOpen(open) {
      // Read the box before anything moves; every later measurement is of the
      // destination.
      var from = demo.getBoundingClientRect();
      expandBtn.setAttribute("aria-expanded", open ? "true" : "false");
      expandBtn.setAttribute("aria-label", (open ? "Close" : "Expand") + " the demo");
      expandBtn.setAttribute("title", open ? "Close" : "Expand");
      demo.classList.toggle("is-open", open);
      if (open) {
        modal.appendChild(demo);
        modal.showModal();
      } else {
        // Home first, then close: a closed dialog is `display: none`, and a
        // frame inside one has no box left to fly back to.
        homeParent.insertBefore(demo, home);
        if (modal.open) modal.close();
        // Back in the hero it is ambient again. A run that ended under the
        // overlay's one-shot rule starts over; one still playing carries on.
        if (!playing && autoplays()) start();
      }
      // The height changed under a stream that may be mid-scroll.
      screen.scrollTop = screen.scrollHeight;
      fly(from);
    }

    expandBtn.addEventListener("click", function () {
      setOpen(expandBtn.getAttribute("aria-expanded") !== "true");
    });
    // Escape closes the dialog itself, which would strip the frame of the box
    // the return flight is measured from, so it is refused and routed through
    // the same path the button takes.
    modal.addEventListener("cancel", function (event) {
      event.preventDefault();
      setOpen(false);
    });
    modal.addEventListener("click", function (event) {
      if (event.target === modal) setOpen(false);
    });
    // Whatever else closes it -- a browser affordance, a form -- still has to
    // leave the button label and the moved node in a consistent state.
    modal.addEventListener("close", function () {
      if (demo.parentNode === modal) setOpen(false);
    });

    speedBtn.addEventListener("click", function () {
      setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]);
    });
    replayBtn.addEventListener("click", start);
    toggleBtn.addEventListener("click", function () {
      if (!playing) return start();
      paused = !paused;
      halt();
      if (paused) freezeProgress();
      paint();
      label();
      if (!paused) step();
    });

    settle();

    if (autoplays()) {
      if (!("IntersectionObserver" in window)) {
        start();
      } else {
        new IntersectionObserver(function (entries) {
          var visible = entries[0].isIntersecting;
          if (visible && !seen) {
            seen = true;
            start();
            return;
          }
          // Off screen is not paused: the control still says Pause, and coming
          // back resumes rather than restarting somewhere the reader never saw.
          if (!playing || paused) return;
          // Clear before resuming: one chain of timeouts, always. Calling
          // step() beside a pending one advances the script twice per tick.
          halt();
          if (!visible) return freezeProgress();
          step();
        }, { threshold: 0.25 }).observe(demo);
      }
    }

    // A caret blinks when it is waiting for you and holds steady when it is
    // busy being typed at. Blinking under the keystrokes made the two states
    // one state, and the reader lost the only signal that says "this beat is
    // deliberate, the next line is coming".
    blink = setInterval(function () {
      var cursor = $(".demo-cursor", screen);
      if (!cursor) return;
      if (typing !== null && !paused) return cursor.setAttribute("data-on", "1");
      cursor.setAttribute("data-on", cursor.getAttribute("data-on") === "1" ? "0" : "1");
    }, 530);
    void blink;
  }
})();

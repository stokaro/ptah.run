/* ptah.run — the demo sessions.
 *
 * Every session here was captured by running Ptah, not written: the schema one
 * is the documented direct quick start, and the rest were run on Linux against
 * a throwaway sqlite database in /tmp/app, with a local OCI registry for the
 * artifact ones. What is shown is stdout; the scanning, dependency-order and
 * progress lines these commands write go to stderr. Trimming a long block to
 * its telling lines is what a transcript does; reordering it, or writing a
 * line Ptah did not print, is not.
 *
 * Event kinds: `cmd` and `cont` are typed a character at a time, `note` is the
 * demo's own narration (typed too), and everything else arrives whole. `sync`
 * moves the pill in the terminal bar, `wait` is a beat, `blank` is a spacer.
 *
 * Loaded by the home page and by /sessions/, and read by
 * scripts/build-sessions.mjs, which writes the transcripts on that page. Both
 * ends read this file so neither can drift from it.
 */
(function (root) {
  "use strict";

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
    ["note", "# Queries still read the old vectors. Cutover is its own step."],
    ["cmd", "ptah inference cutover"],
    ["mute", "plan 5bbecb32c113"],
    ["err", "cutover refused:"],
    ["err", "  - this policy requires an approval and none was given"],
    ["err", "error: cutover refused"],
    ["sync", "needs approval"],
    ["note", "# Approve that plan by its digest, and only that one."],
    ["cmd", "export PTAH_APPROVE=5bbecb32c113"],
    ["cmd", "ptah inference cutover --approver 'quick-start check'"],
    ["new", "queries now read generation b7cc9eb5c7d2ee13ad46ba3d5da8a479ec57b128d771e4151fab5bf6d1da0866 (plan 5bbecb32c113)"],
    ["mute", "  - this is the first generation over this target, so there is no previous one to keep current and nothing to roll back to"],
    ["sync", "cut over"],
    ["note", "# The pointer the queries follow now names it."],
    ["cmd", "psql -c 'SELECT target_table, active_generation FROM ptah_embedding_pointer;'"],
    ["mute", " target_table |                        active_generation"],
    ["mute", "--------------+------------------------------------------------------------------"],
    ["new", " docs         | b7cc9eb5c7d2ee13ad46ba3d5da8a479ec57b128d771e4151fab5bf6d1da0866"],
    ["mute", "(1 row)"]
  ];

  // A schema published as an immutable artifact, the way an image is.
  var OCI_PUBLISH = [
    ["sync", "unpublished"],
    ["note", "# Publish the schema itself, as an artifact with a digest."],
    ["cmd", "ptah schema push oci://registry.example/acme/schema:v1 \\"],
    ["cont", "    --schema-file schema.sql --dialect sqlite --latest"],
    ["out", "Pushed schema as oci://registry.example/acme/schema:v1"],
    ["new", "Digest: sha256:66fed834333daafa24448c7c6b5fe548c4f429d036977194f5b417c505fb933f"],
    ["mute", "Version: "],
    ["mute", "Tags: [v1 latest]"],
    ["sync", "published"],
    ["note", "# Two tags now point at it, and only the two that were asked for."],
    ["cmd", "ptah oci tags oci://registry.example/acme/schema"],
    ["out", "latest"],
    ["out", "v1"],
    ["note", "# A moving tag resolves to the digest that cannot move."],
    ["cmd", "ptah oci resolve oci://registry.example/acme/schema:latest"],
    ["new", "oci://registry.example/acme/schema@sha256:66fed834333daafa24448c7c6b5fe548c4f429d036977194f5b417c505fb933f"]
  ];

  // What an artifact says about itself, without pulling the payload.
  var OCI_INSPECT = [
    ["sync", "remote"],
    ["note", "# What does that artifact declare? Ask without downloading it."],
    ["cmd", "ptah oci inspect oci://registry.example/acme/schema:v1"],
    ["mute", "Reference:     oci://registry.example/acme/schema:v1"],
    ["mute", "Digest:        sha256:66fed834333daafa24448c7c6b5fe548c4f429d036977194f5b417c505fb933f"],
    ["mute", "Media type:    application/vnd.oci.image.manifest.v1+json"],
    ["mute", "Size:          843"],
    ["new", "Artifact type: application/vnd.stokaro.ptah.schema.v1"],
    ["mute", "Discovery:     none"],
    ["blank"],
    ["mute", "Annotations:"],
    ["mute", "  io.stokaro.ptah.kind               application/vnd.stokaro.ptah.schema.v1"],
    ["mute", "  io.stokaro.ptah.schema-format      hcl"],
    ["mute", "  org.opencontainers.image.revision  112a72244a81db149899df0ce43afc704a152bc4"],
    ["blank"],
    ["mute", "Files:"],
    ["mute", "  NAME        MEDIA TYPE                                  SIZE  DIGEST"],
    ["out", "  schema.hcl  application/vnd.stokaro.ptah.schema.hcl.v1  483   sha256:11719c3690781f43aadc70a236e5494dd5435e9418b6197e4048fc3a5fd23366"],
    ["note", "# 843 bytes of manifest answered that. The payload stayed put."]
  ];

  // The other end of a registry: a build that reads its schema from one.
  var OCI_CONSUME = [
    ["sync", "oci source"],
    ["note", "# A registry reference is a schema source like a file is."],
    ["cmd", "ptah schema render \\"],
    ["cont", "    --schema-file oci://registry.example/acme/schema:v1 \\"],
    ["cont", "    --dialect postgres"],
    ["mute", "-- Statement 1/3"],
    ["mute", "-- POSTGRES TABLE: users --"],
    ["sql", 'CREATE TABLE "users" ('],
    ["sql", '  "id" INTEGER PRIMARY KEY NOT NULL,'],
    ["sql", '  "email" TEXT NOT NULL'],
    ["sql", ");"],
    ["note", "# Or take the artifact down as the canonical HCL it was stored as."],
    ["cmd", "ptah schema pull oci://registry.example/acme/schema:v1 \\"],
    ["cont", "    --out pulled.hcl"],
    ["out", "Pulled oci://registry.example/acme/schema:v1 to /tmp/app/pulled.hcl"],
    ["mute", "Digest: sha256:66fed834333daafa24448c7c6b5fe548c4f429d036977194f5b417c505fb933f"],
    ["cmd", "head -12 pulled.hcl"],
    ["mute", "// Code generated by ptah; DO NOT EDIT."],
    ["blank"],
    ["sql", 'table "posts" {'],
    ["sql", '  column "id" {'],
    ["sql", "    type = INTEGER"],
    ["sql", "  }"],
    ["sql", '  primary_key {'],
    ["sql", "    columns = [column.id]"],
    ["sql", "  }"],
    ["new", '  foreign_key "fk_posts_user_id" {'],
    ["sql", "    columns = [column.user_id]"],
    ["sql", "    ref_columns = [table.users.column.id]"],
    ["sql", "  }"],
    ["sql", "}"]
  ];

  // The HTTP contract, derived rather than kept in step by hand.
  var OPENAPI = [
    ["sync", "openapi"],
    ["note", "# The tables also describe the payloads that carry them."],
    ["cmd", "ptah schema export --to openapi-v3 --from sql \\"],
    ["cont", "    --schema-file schema.sql --out openapi.yaml"],
    ["out", "Exported OpenAPI schema to /tmp/app/openapi.yaml"],
    ["mute", "Found 2 table(s), 5 field(s), 0 enum(s)"],
    ["cmd", "head -20 openapi.yaml"],
    ["mute", "openapi: 3.0.3"],
    ["mute", "info:"],
    ["mute", "  title: Ptah Exported Schema"],
    ["mute", "  version: 1.0.0"],
    ["mute", "paths: {}"],
    ["sql", "components:"],
    ["sql", "  schemas:"],
    ["sql", "    users:"],
    ["sql", "      type: object"],
    ["new", "      required:"],
    ["new", "        - id"],
    ["new", "        - email"],
    ["sql", "      properties:"],
    ["sql", "        id:"],
    ["sql", "          type: integer"],
    ["sql", "          format: int32"],
    ["note", "# NOT NULL became required. The two cannot disagree."]
  ];

  // A wire contract, where the hard part is not the first export.
  var PROTOBUF = [
    ["sync", "contract"],
    ["note", "# The same schema as a wire contract."],
    ["cmd", "ptah schema export --to protobuf --from sql \\"],
    ["cont", "    --schema-file schema.sql --out schema.proto \\"],
    ["cont", "    --proto-package acme.app.v1"],
    ["out", "Exported Protobuf schema to /tmp/app/schema.proto"],
    ["mute", "Exported 2 message(s), 5 field(s), 0 enum(s)"],
    ["new", "bootstrapped new compatibility history"],
    ["err", "1 export warning(s) reported"],
    ["note", "# The warning is the point: field numbers are a promise."],
    ["cmd", "head -14 schema.proto"],
    ["mute", 'edition = "2023";'],
    ["blank"],
    ["mute", "package acme.app.v1;"],
    ["blank"],
    ["sql", "message Post {"],
    ["new", "  int32 id = 1;"],
    ["new", "  int32 user_id = 2;"],
    ["new", "  string title = 3;"],
    ["sql", "}"],
    ["blank"],
    ["sql", "message User {"],
    ["sql", "  int32 id = 1;"],
    ["sql", "  string email = 2;"],
    ["sql", "}"],
    ["note", "# A later export reuses these numbers, or refuses to write."]
  ];

  // The schema as something a person reads.
  var DOCS = [
    ["sync", "markdown"],
    ["note", "# The reference page nobody keeps up to date by hand."],
    ["cmd", "ptah schema export --to markdown --from sql \\"],
    ["cont", "    --schema-file schema.sql --out SCHEMA.md"],
    ["out", "Exported schema documentation to /tmp/app/SCHEMA.md"],
    ["mute", "Found 2 table(s), 5 field(s), 0 enum(s)"],
    ["cmd", "head -13 SCHEMA.md"],
    ["mute", "# Schema reference"],
    ["blank"],
    ["mute", "- [posts](#posts)"],
    ["mute", "- [users](#users)"],
    ["blank"],
    ["sql", "## posts"],
    ["blank"],
    ["mute", "| Column | Type | Null | Default | Key | Comment |"],
    ["mute", "| --- | --- | --- | --- | --- | --- |"],
    ["sql", "| id | INTEGER | yes | — | PK | — |"],
    ["new", "| user_id | INTEGER | no | — | FK → users(id) | — |"],
    ["sql", "| title | TEXT | no | — | — | — |"],
    ["note", "# HTML is the same command with a different --to."]
  ];

  // Two schema states, and the SQL between them. No database in the middle.
  var DIFF = [
    ["sync", "two states"],
    ["note", "# What is the SQL between these two files?"],
    ["cmd", "ptah schema diff --from file://schema.sql \\"],
    ["cont", "    --to file://schema-next.sql \\"],
    ["cont", '    --dev-url "sqlite://dev.db?mode=memory"'],
    ["new", 'ALTER TABLE "users" ADD COLUMN "created_at" TEXT;'],
    ["new", 'CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");'],
    ["note", "# Two arbitrary states, neither of them a live database."]
  ];

  // The live schema, read back in whichever shape the next tool wants.
  var INSPECT = [
    ["sync", "live"],
    ["note", "# Read the database back as something else reads."],
    ["cmd", "ptah schema inspect --db-url sqlite://app.db --format dbml"],
    ["sql", 'Table "users" {'],
    ["sql", '  "id" INTEGER [pk]'],
    ["sql", '  "email" TEXT [not null]'],
    ["sql", "}"],
    ["note", "# Or as JSON, for something that is not a person."],
    ["cmd", "ptah schema inspect --db-url sqlite://app.db --format json"],
    ["new", '{"schemas":[{"name":"main","tables":[{"name":"users","columns":[{"name":"id","type":"INTEGER","null":true},{"name":"email","type":"TEXT"}],"primary_key":{"parts":[{"column":"id"}]}}]}]}'],
    ["note", "# hcl and sql are the other two, and --out-dir writes files."]
  ];

  // Reference data, scoped to an environment and recorded once applied.
  var SEED = [
    ["sync", "dev"],
    ["note", "# Seed files carry the environment in the name."],
    ["cmd", "ls seeds"],
    ["out", "001_demo_accounts.dev.sql"],
    ["out", "002_reference_data.prod.sql"],
    ["cmd", "ptah seed --db-url sqlite://app.db --seeds-dir ./seeds --env dev"],
    ["mute", "=== SEED ==="],
    ["mute", "Environment: dev"],
    ["blank"],
    ["mute", "Matching seeds: 1"],
    ["new", "Applied seeds: 1"],
    ["out", "Seeds completed successfully."],
    ["note", "# Run it again. Applied seeds are recorded, so this is a no-op."],
    ["cmd", "ptah seed --db-url sqlite://app.db --seeds-dir ./seeds --env dev"],
    ["mute", "Matching seeds: 1"],
    ["mute", "Applied seeds: 0"],
    ["new", "Skipped seeds: 1"],
    ["out", "Database seed data is already up to date."],
    ["sync", "prod refused"],
    ["note", "# And prod is not an environment you reach by typing it."],
    ["cmd", "ptah seed --db-url sqlite://app.db --seeds-dir ./seeds --env prod"],
    ["err", 'error: refusing to seed protected environment "prod" without --allow-prod']
  ];

  // The half of a migration pair nobody looks at until they need it.
  var ROLLBACK = [
    ["sync", "1 applied"],
    ["note", "# Every generated migration came with a down file."],
    ["cmd", "ls migrations"],
    ["out", "1788810699_create_users.down.sql"],
    ["out", "1788810699_create_users.up.sql"],
    ["note", "# Ask what rolling back would do. Nothing runs."],
    ["cmd", "ptah migrations down --db-url sqlite://app.db \\"],
    ["cont", "    --migrations-dir ./migrations --dry-run"],
    ["mute", "=== DRY RUN MODE ==="],
    ["mute", "No actual changes will be made to the database"],
    ["blank"],
    ["mute", "=== MIGRATE DOWN ==="],
    ["mute", "Target version: 0"],
    ["mute", "Current version: 1788810699"],
    ["mute", "Migrations to roll back: 1"],
    ["blank"],
    ["out", "✅ Dry run completed successfully!"],
    ["new", "Would have rolled back to version: 0"],
    ["mute", "Would have rolled back these migrations: [1788810699]"],
    ["note", "# The plan first, the rollback second. Same rule as forward."]
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
        "A new embedding model built and checked beside the one being served, " +
        "then a cutover that refuses to run without an approval naming that " +
        "exact plan."
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
    },
    ociPublish: {
      script: OCI_PUBLISH,
      label: "Publish the schema",
      where: "sh · ptah-oci",
      caption:
        "A schema pushed as an OCI artifact, tagged with what was asked for " +
        "and nothing else, and a moving tag that resolves to a fixed digest."
    },
    ociInspect: {
      script: OCI_INSPECT,
      label: "Read a remote artifact",
      where: "sh · ptah-oci",
      caption:
        "What an artifact is, read out of its manifest: the type, the format " +
        "it was stored in, and the one file it carries. Nothing is downloaded."
    },
    ociConsume: {
      script: OCI_CONSUME,
      label: "Build from a registry",
      where: "sh · ptah-oci",
      caption:
        "A registry reference is a schema source like a file is, and the " +
        "stored form is canonical HCL rather than one dialect's SQL."
    },
    openapi: {
      script: OPENAPI,
      label: "Derive an OpenAPI spec",
      where: "sh · ptah-export",
      caption:
        "The HTTP payloads, derived from the tables that carry them. A NOT " +
        "NULL column arrives as a required property."
    },
    protobuf: {
      script: PROTOBUF,
      label: "Emit a wire contract",
      where: "sh · ptah-export",
      caption:
        "Protobuf, with the compatibility history that makes field numbers " +
        "a promise: a later export reuses them or refuses to write."
    },
    docs: {
      script: DOCS,
      label: "Write the reference",
      where: "sh · ptah-export",
      caption:
        "The schema reference page nobody keeps up to date by hand, " +
        "including the foreign keys, in Markdown or HTML."
    },
    diff: {
      script: DIFF,
      label: "Diff two schemas",
      where: "sh · ptah-diff",
      caption:
        "The SQL between two arbitrary schema states, neither of which has " +
        "to be a live database."
    },
    inspect: {
      script: INSPECT,
      label: "Read a database back",
      where: "sh · ptah-inspect",
      caption:
        "The live schema in whichever shape the next tool wants it: DBML, " +
        "JSON, HCL or SQL."
    },
    seed: {
      script: SEED,
      label: "Seed an environment",
      where: "sh · ptah-seed",
      caption:
        "Reference data scoped to an environment, recorded once applied so " +
        "a second run is a no-op, and production behind an explicit flag."
    },
    rollback: {
      script: ROLLBACK,
      label: "Roll one back",
      where: "sh · ptah-migrations",
      caption:
        "The down file every generated migration came with, and the dry run " +
        "that says what it would undo before anything runs."
    }
  };

  // Two of the four choices are always there: the schema cycle and the
  // inference cycle are what Ptah is for. The other two are drawn from the
  // rest on each load, so a second visit has something new to show without
  // hiding twelve scenarios behind a "more examples" link nobody clicks.
  var ROTATING = [
    "guard", "entities", "versioned", "adopt", "diagram", "api", "dbml",
    "capabilities", "stats", "lineage", "approve", "compat", "ociPublish",
    "ociInspect", "ociConsume", "openapi", "protobuf", "docs", "diff",
    "inspect", "seed", "rollback"
  ];

  var SESSIONS = {
    scenarios: SCENARIOS,
    // Fixed on the home page: the schema cycle and the inference cycle are
    // what Ptah is for. Everything else takes a turn in the two other slots.
    pinned: ["change", "inference"],
    rotating: ROTATING,
    // Reading order for /sessions/, where nothing rotates and everything shows.
    order: ["change", "inference"].concat(ROTATING)
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SESSIONS;
  else root.PTAH_SESSIONS = SESSIONS;
})(typeof globalThis !== "undefined" ? globalThis : this);

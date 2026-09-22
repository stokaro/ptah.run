/* Narration translated from assets/runs.js; recorded commands and output stay unchanged.
 * scripts/build-runs.mjs checks every source key before writing any page. */
(function (root) {
  "use strict";
  var narration = {
  "scenarios": {
    "change": {
      "tag": "Schemaänderung",
      "label": "Ein Schema ändern",
      "caption": "Sie beschreiben das gewünschte Schema. Ptah zeigt die nötigen Änderungen vor der Ausführung. Anschließend prüft die Driftkontrolle, ob die Datenbank dem Schema entspricht."
    },
    "inference": {
      "tag": "Inferenz",
      "label": "Embeddings migrieren",
      "caption": "Neue Embeddings neben den aktiven aufbauen, prüfen und dann umschalten. Die Umschaltung erfordert eine Freigabe für genau diesen Plan."
    },
    "guard": {
      "tag": "Sicherheit",
      "label": "Eine unsichere Änderung stoppen",
      "caption": "Ein Pull Request entfernt eine Spalte. Der Build schlägt fehl und nennt den Grund sowie eine sichere Reihenfolge."
    },
    "entities": {
      "tag": "Go-Annotationen",
      "label": "Von Go-Structs zu SQL",
      "caption": "Ein Go-Struct, zwei Datenbankmotoren. PostgreSQL erhält einen echten Enum-Typ, SQLite eine gleichbedeutende CHECK-Bedingung."
    },
    "versioned": {
      "tag": "Schemaänderung",
      "label": "Eine Migration erzeugen",
      "caption": "Der andere Ablauf: Ptah schreibt Up- und Down-Dateien, führt ausstehende Migrationen aus und protokolliert die Ausführung."
    },
    "adopt": {
      "tag": "Go-Annotationen",
      "label": "Eine Datenbank übernehmen",
      "caption": "Eine Datenbank ohne Schemadeklaration. Ptah erzeugt daraus Go-Code mit Constraint-Namen und referenziellen Aktionen."
    },
    "diagram": {
      "tag": "Export",
      "label": "Das Schema zeichnen",
      "caption": "Dieselben Annotationen als Diagramm. Die Pfeile werden aus Fremdschlüsseln abgeleitet und stimmen dadurch mit dem Schema überein."
    },
    "api": {
      "tag": "Export",
      "label": "Eine GraphQL-API exportieren",
      "caption": "Die Tabellen beschreiben bereits die API. Ein Fremdschlüssel wird zum Beziehungsfeld; ein manueller Abgleich entfällt."
    },
    "dbml": {
      "tag": "Export",
      "label": "Nach DBML exportieren",
      "caption": "Ihr Diagrammwerkzeug benötigt DBML. Ein Flag bestimmt das Format; auch HCL, OpenAPI, GraphQL, Protobuf und Markdown sind möglich."
    },
    "capabilities": {
      "tag": "Inspektion",
      "label": "Unterstützte Funktionen abfragen",
      "caption": "Prüfen Sie, was Ptah über den verbundenen Server ermittelt hat und worauf jede Angabe beruht. Die Eigenschaften des Ziels werden nicht geraten."
    },
    "stats": {
      "tag": "Inspektion",
      "label": "Ein Dashboard versorgen",
      "caption": "Die Schemastruktur als Zahlen für Ihre Metrik-Pipeline. Gezählt werden Objekte, keine Datenzeilen."
    },
    "lineage": {
      "tag": "Inspektion",
      "label": "Eine Spalte verfolgen",
      "caption": "Vor dem Entfernen einer Spalte ihre Leser ermitteln. Die Analyse ist statisch: Ohne Datenbank-URL wird keine Verbindung aufgebaut."
    },
    "approve": {
      "tag": "Sicherheit",
      "label": "Einen Plan signieren",
      "caption": "Signieren Sie den Plan mit einem SSH-Schlüssel. Wird danach ein Bezeichner geändert, schlägt die Prüfung fehl. Genau das soll eine Freigabeprüfung erkennen."
    },
    "compat": {
      "tag": "Atlas",
      "label": "Atlas-Skripte ausführen",
      "caption": "Eine unveränderte Atlas-Pipeline: dieselben Flags, dasselbe Verzeichnis und dieselbe atlas.sum, ausgeführt durch Ptah."
    },
    "ociPublish": {
      "tag": "Registry",
      "label": "Das Schema veröffentlichen",
      "caption": "Das Schema selbst hochladen. Zurück kommen ein Digest, ausschließlich die angeforderten Tags und ein veränderlicher Tag, der auf einen unveränderlichen Digest verweist."
    },
    "ociInspect": {
      "tag": "Registry",
      "label": "Ein entferntes Artefakt lesen",
      "caption": "Was liegt unter dieser Referenz? Das Manifest beantwortet es mit 843 Bytes. Die Nutzdaten bleiben in der Registry."
    },
    "ociConsume": {
      "tag": "Registry",
      "label": "Aus einer Registry erzeugen",
      "caption": "Eine Registry-Referenz lässt sich wie ein Dateiname verwenden. Direkt daraus erzeugen oder das Artefakt im gespeicherten HCL-Format herunterladen."
    },
    "openapi": {
      "tag": "Export",
      "label": "Eine OpenAPI-Spezifikation exportieren",
      "caption": "HTTP-Datenstrukturen werden aus den Tabellen abgeleitet. Eine NOT-NULL-Spalte wird zu einer erforderlichen Eigenschaft, sodass beide übereinstimmen."
    },
    "protobuf": {
      "tag": "Export",
      "label": "Ein Austauschformat erhalten",
      "caption": "Feldnummern sind verbindlich. Ptah bewahrt ihren Verlauf: Der nächste Export verwendet sie erneut oder verweigert das Schreiben."
    },
    "docs": {
      "tag": "Export",
      "label": "Die Referenz erzeugen",
      "caption": "Eine Schemareferenz samt Fremdschlüsseln, ohne manuelle Pflege. Hier als Markdown; ein anderes Flag liefert HTML."
    },
    "diff": {
      "tag": "Schemaänderung",
      "label": "Zwei Schemas vergleichen",
      "caption": "Zwei Dateien und das SQL, das sie voneinander unterscheidet. Keine davon muss eine laufende Datenbank sein."
    },
    "inspect": {
      "tag": "Inspektion",
      "label": "Eine Datenbank auslesen",
      "caption": "Das aktuelle Schema im Format des nächsten Werkzeugs auslesen: DBML, JSON, HCL oder SQL."
    },
    "seed": {
      "tag": "Sicherheit",
      "label": "Eine Umgebung mit Daten befüllen",
      "caption": "Entwicklungsdaten gelangen nur in die Entwicklungsumgebung. Ein zweiter Lauf ändert nichts. Der Aufruf für prod wird abgelehnt."
    },
    "rollback": {
      "tag": "Schemaänderung",
      "label": "Eine Migration zurücknehmen",
      "caption": "Jede Migration hat eine Down-Datei. Die geplanten Rücknahmen werden angezeigt, bevor etwas rückgängig gemacht wird."
    }
  },
  "notes": {
    "# Write the database's own schema into a file.": "# Das Schema der Datenbank in eine Datei schreiben.",
    "# Drift compares that file with the database it came from.": "# Die Driftkontrolle vergleicht die Datei mit ihrer Quelldatenbank.",
    "# Now ask for a column, by rewriting the schema you want.": "# Eine Spalte zum gewünschten Schema hinzufügen.",
    "# The same check now has something to report.": "# Dieselbe Prüfung hat jetzt eine Abweichung zu melden.",
    "# Ask what it would take to close it. A dry run executes nothing.": "# Die nötigen Änderungen ermitteln. Ein Dry Run führt nichts aus.",
    "# Run the reviewed plan. --auto-approve suits a disposable file.": "# Den geprüften Plan ausführen. --auto-approve eignet sich für eine entbehrliche Datei.",
    "# And the same check, a third time.": "# Dieselbe Prüfung zum dritten Mal ausführen.",
    "# A new embedding model. Plan first: what would this take?": "# Ein neues Embedding-Modell. Zuerst die nötigen Schritte planen.",
    "# Build the new generation beside the one being served.": "# Die neue Generation neben der aktiven aufbauen.",
    "# Rows that changed while it ran are caught up, then indexed.": "# Zwischenzeitlich geänderte Zeilen nachziehen und anschließend indizieren.",
    "# Check it before anything reads it.": "# Prüfen, bevor die neue Generation gelesen wird.",
    "# Queries still read the old vectors. Cutover is its own step.": "# Abfragen lesen noch die bisherigen Vektoren. Die Umschaltung ist ein eigener Schritt.",
    "# Approve that plan by its digest, and only that one.": "# Genau diesen Plan anhand seines Digests freigeben.",
    "# The pointer the queries follow now names it.": "# Der Zeiger für die Abfragen verweist nun auf die neue Generation.",
    "# A pull request adds this migration.": "# Ein Pull Request fügt diese Migration hinzu.",
    "# Check it before it reaches a database.": "# Prüfen, bevor die Migration eine Datenbank erreicht.",
    "# The exit code is what fails the build.": "# Der Exit-Code lässt den Build fehlschlagen.",
    "# The schema is a Go struct. The annotations are the declaration.": "# Das Schema ist ein Go-Struct. Die Annotationen bilden die Deklaration.",
    "# Render it for PostgreSQL.": "# Für PostgreSQL ausgeben.",
    "# The same file, one flag apart.": "# Dieselbe Datei mit einem anderen Flag.",
    "# No enum type in SQLite, so it is a CHECK. Nothing was dropped.": "# SQLite hat keinen Enum-Typ, daher entsteht eine CHECK-Bedingung. Nichts geht verloren.",
    "# Turn the declaration into a versioned migration.": "# Aus der Deklaration eine versionierte Migration erzeugen.",
    "# A down file too, written at the same time as the up.": "# Die Down-Datei entsteht gleichzeitig mit der Up-Datei.",
    "# And the revision table agrees.": "# Die Revisionstabelle bestätigt das Ergebnis.",
    "# A database nobody ever wrote a schema file for.": "# Eine Datenbank, für die keine Schemadatei existiert.",
    "# What it wrote is the annotated Go you would have written.": "# Das Ergebnis ist annotierter Go-Code, wie er auch von Hand geschrieben würde.",
    "# The constraint came back with its name and its actions.": "# Die Bedingung behält ihren Namen und ihre referenziellen Aktionen.",
    "# The declaration is also a diagram.": "# Die Deklaration als Diagramm darstellen.",
    "# The relationship is read off the foreign key, not a second file.": "# Die Beziehung wird aus dem Fremdschlüssel gelesen, nicht aus einer zweiten Datei.",
    "# The tables already describe the API that reads them.": "# Die Tabellen beschreiben bereits die API, die sie liest.",
    "# The last field is the foreign key, read as a relation.": "# Das letzte Feld ist der Fremdschlüssel als Beziehung.",
    "# A diagramming tool wants DBML instead. Change one flag.": "# Das Diagrammwerkzeug benötigt DBML. Ein anderes Flag genügt.",
    "# Nothing was described twice to get this.": "# Keine zweite Beschreibung ist dafür nötig.",
    "# Ask what Ptah resolved for the server it is talking to.": "# Die von Ptah ermittelten Eigenschaften des verbundenen Servers abfragen.",
    "# enum_modeling is why a declared enum arrives here as a CHECK.": "# enum_modeling erklärt, warum ein deklariertes Enum hier eine CHECK-Bedingung wird.",
    "# Schema shape, in a format a metrics pipeline already reads.": "# Die Schemastruktur in einem Format ausgeben, das die Metrik-Pipeline bereits liest.",
    "# Counts of objects, never of rows. Shape, not contents.": "# Objekte zählen, keine Datenzeilen. Die Struktur statt der Inhalte erfassen.",
    "# Which view columns depend on which base columns?": "# Welche View-Spalten hängen von welchen Basisspalten ab?",
    "# The analysis is static: without --db-url it contacts nothing.": "# Die Analyse ist statisch: Ohne --db-url entsteht keine Verbindung.",
    "# Save the plan, so what is reviewed is what runs.": "# Den Plan speichern, damit genau das Geprüfte ausgeführt wird.",
    "# Sign it. Ptah never reads the key; ssh-keygen does.": "# Signieren. Den Schlüssel liest ssh-keygen, nicht Ptah.",
    "# Now change one identifier in the approved plan.": "# Einen Bezeichner im freigegebenen Plan ändern.",
    "# Exit 2. An edited plan is a plan nobody approved.": "# Exit-Code 2. Für den veränderten Plan liegt keine Freigabe vor.",
    "# An existing Atlas pipeline, and the same flags.": "# Eine vorhandene Atlas-Pipeline mit denselben Flags.",
    "# It wrote an Atlas directory: the timestamped file, and atlas.sum.": "# Ein Atlas-Verzeichnis wurde erzeugt: eine Datei mit Zeitstempel und atlas.sum.",
    "# And apply reads that same directory.": "# apply liest dasselbe Verzeichnis.",
    "# No script changed. The native surface is still there underneath.": "# Kein Skript wurde geändert. Die nativen Funktionen stehen weiterhin zur Verfügung.",
    "# Publish the schema itself, as an artifact with a digest.": "# Das Schema selbst als Artefakt mit Digest veröffentlichen.",
    "# Two tags now point at it, and only the two that were asked for.": "# Genau die beiden angeforderten Tags verweisen darauf.",
    "# A moving tag resolves to the digest that cannot move.": "# Ein veränderlicher Tag wird zum unveränderlichen Digest aufgelöst.",
    "# What does that artifact declare? Ask without downloading it.": "# Die Deklaration des Artefakts abfragen, ohne es herunterzuladen.",
    "# 843 bytes of manifest answered that. The payload stayed put.": "# 843 Bytes Manifest liefern die Antwort. Die Nutzdaten bleiben in der Registry.",
    "# A registry reference is a schema source like a file is.": "# Eine Registry-Referenz ist eine Schemaquelle, genau wie eine Datei.",
    "# Or take the artifact down as the canonical HCL it was stored as.": "# Oder das Artefakt in der gespeicherten kanonischen HCL-Form herunterladen.",
    "# The tables also describe the payloads that carry them.": "# Die Tabellen beschreiben auch die übertragenen Datenstrukturen.",
    "# NOT NULL became required. The two cannot disagree.": "# NOT NULL wird zu required. Beide Angaben stimmen überein.",
    "# The same schema as a wire contract.": "# Dasselbe Schema als Vertrag für den Datenaustausch.",
    "# The warning is the point: field numbers are a promise.": "# Die Warnung ist entscheidend: Feldnummern sind verbindlich.",
    "# A later export reuses these numbers, or refuses to write.": "# Ein späterer Export verwendet diese Nummern erneut oder verweigert das Schreiben.",
    "# The reference page nobody keeps up to date by hand.": "# Die Referenzseite erzeugen, die sonst von Hand gepflegt werden müsste.",
    "# HTML is the same command with a different --to.": "# Für HTML bleibt der Befehl gleich; nur --to ändert sich.",
    "# What is the SQL between these two files?": "# Welches SQL überführt die eine Datei in die andere?",
    "# Two arbitrary states, neither of them a live database.": "# Zwei beliebige Zustände, ohne laufende Datenbank.",
    "# Read the database back in a shape another tool reads.": "# Die Datenbank in einem Format auslesen, das ein anderes Werkzeug versteht.",
    "# Or as JSON, for something that is not a person.": "# Oder als JSON für die maschinelle Verarbeitung.",
    "# hcl and sql are the other two, and --out-dir writes files.": "# Weitere Formate sind hcl und sql. --out-dir schreibt Dateien.",
    "# Seed files carry the environment in the name.": "# Seed-Dateien tragen die Umgebung im Namen.",
    "# Run it again. Applied seeds are recorded, so this is a no-op.": "# Erneut ausführen. Angewendete Seeds sind protokolliert, daher ändert sich nichts.",
    "# And prod is not an environment you reach by typing it.": "# Die Angabe prod allein berechtigt nicht zur Ausführung in der Produktion.",
    "# Every generated migration came with a down file.": "# Jede erzeugte Migration enthält eine Down-Datei.",
    "# Ask what rolling back would do. Nothing runs.": "# Die Wirkung eines Rollbacks prüfen. Nichts wird ausgeführt.",
    "# The plan first, the rollback second. Same rule as forward.": "# Erst der Plan, dann der Rollback. Dieselbe Regel wie beim Vorwärtsmigrieren."
  },
  "sync": {
    "no drift": "keine Drift",
    "drift": "Drift",
    "1 generation": "1 Generation",
    "candidate": "Kandidat",
    "verified": "geprüft",
    "needs approval": "Freigabe nötig",
    "cut over": "umgeschaltet",
    "review": "Prüfung",
    "blocked": "blockiert",
    "postgres": "postgres",
    "sqlite": "sqlite",
    "1 pending": "1 ausstehend",
    "up to date": "aktuell",
    "no declaration": "keine Deklaration",
    "declared": "deklariert",
    "mermaid": "mermaid",
    "graphql": "graphql",
    "dbml": "dbml",
    "sqlite 3": "sqlite 3",
    "openmetrics": "openmetrics",
    "static": "statisch",
    "planned": "geplant",
    "approved": "freigegeben",
    "refused": "abgelehnt",
    "atlas dir": "Atlas-Verzeichnis",
    "applied": "angewendet",
    "unpublished": "unveröffentlicht",
    "published": "veröffentlicht",
    "remote": "entfernt",
    "oci source": "OCI-Quelle",
    "openapi": "openapi",
    "contract": "Vertrag",
    "markdown": "markdown",
    "two states": "zwei Zustände",
    "live": "laufend",
    "dev": "dev",
    "prod refused": "prod abgelehnt",
    "1 applied": "1 angewendet"
  }
};
  if (typeof module !== "undefined" && module.exports) module.exports = narration;
  else root.PTAH_RUNS_DE = narration;
})(typeof globalThis !== "undefined" ? globalThis : this);

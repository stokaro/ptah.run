/* Narration translated from assets/runs.js; recorded commands and output stay unchanged.
 * scripts/build-runs.mjs checks every source key before writing any page. */
(function (root) {
  "use strict";
  var narration = {
  "scenarios": {
    "change": {
      "tag": "Modification de schéma",
      "label": "Modifier un schéma",
      "caption": "Vous décrivez le schéma souhaité. Ptah indique les changements nécessaires avant l’exécution. Le contrôle de dérive vérifie ensuite que la base correspond au schéma."
    },
    "inference": {
      "tag": "Inférence",
      "label": "Migrer des embeddings",
      "caption": "Construisez les nouveaux embeddings à côté des actifs, vérifiez-les, puis basculez. La bascule exige une approbation désignant ce plan exact."
    },
    "guard": {
      "tag": "Sécurité",
      "label": "Bloquer une modification risquée",
      "caption": "Une pull request supprime une colonne. Le build échoue en indiquant la raison et l’ordre des opérations qui aurait été sûr."
    },
    "entities": {
      "tag": "Annotations Go",
      "label": "Des structs Go au SQL",
      "caption": "Une struct Go, deux moteurs. PostgreSQL reçoit un véritable type enum ; SQLite, une contrainte CHECK équivalente."
    },
    "versioned": {
      "tag": "Modification de schéma",
      "label": "Créer une migration",
      "caption": "L’autre approche : Ptah écrit les fichiers up et down, exécute les migrations en attente et enregistre ce qu’il a appliqué."
    },
    "adopt": {
      "tag": "Annotations Go",
      "label": "Adopter une base existante",
      "caption": "Une base sans déclaration de schéma. Ptah en extrait du Go, avec les noms des contraintes et les actions référentielles."
    },
    "diagram": {
      "tag": "Export",
      "label": "Dessiner le schéma",
      "caption": "Les mêmes annotations sous forme de diagramme. Les flèches proviennent des clés étrangères et correspondent donc au schéma."
    },
    "api": {
      "tag": "Export",
      "label": "Exporter une API GraphQL",
      "caption": "Les tables décrivent déjà l’API. Une clé étrangère devient un champ de relation, sans synchronisation manuelle."
    },
    "dbml": {
      "tag": "Export",
      "label": "Exporter en DBML",
      "caption": "Votre outil de diagrammes attend du DBML. Une option choisit le format ; HCL, OpenAPI, GraphQL, Protobuf et Markdown sont aussi disponibles."
    },
    "capabilities": {
      "tag": "Inspection",
      "label": "Consulter les capacités",
      "caption": "Consultez ce que Ptah a déterminé sur le serveur connecté et la source de chaque réponse. Les propriétés de la cible ne sont pas devinées."
    },
    "stats": {
      "tag": "Inspection",
      "label": "Alimenter un tableau de bord",
      "caption": "La structure du schéma en chiffres pour votre chaîne de métriques. Des nombres d’objets, jamais de lignes de données."
    },
    "lineage": {
      "tag": "Inspection",
      "label": "Suivre une colonne",
      "caption": "Avant de supprimer une colonne, trouvez ce qui la lit. L’analyse est statique : sans URL de base, elle n’établit aucune connexion."
    },
    "approve": {
      "tag": "Sécurité",
      "label": "Signer un plan",
      "caption": "Signez le plan avec une clé SSH. Si un identifiant change ensuite, la vérification échoue : c’est précisément ce que le contrôle d’approbation doit détecter."
    },
    "compat": {
      "tag": "Atlas",
      "label": "Exécuter des scripts Atlas",
      "caption": "Une pipeline Atlas inchangée : mêmes options, même répertoire et même atlas.sum, avec les fonctions natives de Ptah en dessous."
    },
    "ociPublish": {
      "tag": "Registre",
      "label": "Publier le schéma",
      "caption": "Publiez le schéma lui-même. Vous obtenez un digest, uniquement les tags demandés, et un tag modifiable qui se résout en digest immuable."
    },
    "ociInspect": {
      "tag": "Registre",
      "label": "Lire un artefact distant",
      "caption": "Que contient cette référence ? Le manifeste répond en 843 octets, sans déplacer les données de l’artefact."
    },
    "ociConsume": {
      "tag": "Registre",
      "label": "Générer depuis un registre",
      "caption": "Une référence de registre s’utilise comme un nom de fichier. Générez directement depuis cette référence ou récupérez l’artefact dans son format HCL d’origine."
    },
    "openapi": {
      "tag": "Export",
      "label": "Exporter une spécification OpenAPI",
      "caption": "Les structures de données HTTP proviennent des tables. Une colonne NOT NULL devient une propriété obligatoire, ce qui maintient leur cohérence."
    },
    "protobuf": {
      "tag": "Export",
      "label": "Préserver un contrat d’échange",
      "caption": "Les numéros de champs sont un engagement. Ptah conserve leur historique : l’export suivant les réutilise ou refuse d’écrire."
    },
    "docs": {
      "tag": "Export",
      "label": "Générer la référence",
      "caption": "Une référence du schéma, clés étrangères incluses, sans mise à jour manuelle. Ici en Markdown ; une option permet d’obtenir du HTML."
    },
    "diff": {
      "tag": "Modification de schéma",
      "label": "Comparer deux schémas",
      "caption": "Deux fichiers et le SQL permettant de passer de l’un à l’autre. Aucune base en cours d’exécution n’est nécessaire."
    },
    "inspect": {
      "tag": "Inspection",
      "label": "Relire une base",
      "caption": "Relisez le schéma existant dans le format attendu par l’outil suivant : DBML, JSON, HCL ou SQL."
    },
    "seed": {
      "tag": "Sécurité",
      "label": "Initialiser les données d’un environnement",
      "caption": "Des données de développement réservées à dev. Une seconde exécution ne change rien ; une demande pour prod est refusée."
    },
    "rollback": {
      "tag": "Modification de schéma",
      "label": "Annuler une migration",
      "caption": "Chaque migration possède un fichier down. Les opérations de retour arrière sont affichées avant toute annulation."
    }
  },
  "notes": {
    "# Write the database's own schema into a file.": "# Écrire le schéma de la base dans un fichier.",
    "# Drift compares that file with the database it came from.": "# Le contrôle de dérive compare ce fichier à la base dont il provient.",
    "# Now ask for a column, by rewriting the schema you want.": "# Ajouter une colonne au schéma souhaité.",
    "# The same check now has something to report.": "# Le même contrôle a maintenant une différence à signaler.",
    "# Ask what it would take to close it. A dry run executes nothing.": "# Déterminer les changements nécessaires. Une simulation n’exécute rien.",
    "# Run the reviewed plan. --auto-approve suits a disposable file.": "# Exécuter le plan revu. --auto-approve convient à un fichier jetable.",
    "# And the same check, a third time.": "# Exécuter le même contrôle une troisième fois.",
    "# A new embedding model. Plan first: what would this take?": "# Un nouveau modèle d’embeddings. Planifier d’abord les étapes nécessaires.",
    "# Build the new generation beside the one being served.": "# Construire la nouvelle génération à côté de la génération active.",
    "# Rows that changed while it ran are caught up, then indexed.": "# Rattraper les lignes modifiées pendant l’exécution, puis les indexer.",
    "# Check it before anything reads it.": "# Vérifier la candidate avant toute lecture.",
    "# Queries still read the old vectors. Cutover is its own step.": "# Les requêtes lisent encore les anciens vecteurs. La bascule est une étape distincte.",
    "# Approve that plan by its digest, and only that one.": "# Approuver ce plan exact à l’aide de son digest.",
    "# The pointer the queries follow now names it.": "# Le pointeur suivi par les requêtes désigne maintenant la nouvelle génération.",
    "# A pull request adds this migration.": "# Une pull request ajoute cette migration.",
    "# Check it before it reaches a database.": "# La vérifier avant qu’elle n’atteigne une base de données.",
    "# The exit code is what fails the build.": "# Le code de retour fait échouer le build.",
    "# The schema is a Go struct. The annotations are the declaration.": "# Le schéma est une struct Go. Les annotations constituent la déclaration.",
    "# Render it for PostgreSQL.": "# Produire le SQL pour PostgreSQL.",
    "# The same file, one flag apart.": "# Le même fichier avec une seule option différente.",
    "# No enum type in SQLite, so it is a CHECK. Nothing was dropped.": "# SQLite n’a pas de type enum : une contrainte CHECK le remplace. Rien n’est perdu.",
    "# Turn the declaration into a versioned migration.": "# Transformer la déclaration en migration versionnée.",
    "# A down file too, written at the same time as the up.": "# Le fichier down est écrit en même temps que le fichier up.",
    "# And the revision table agrees.": "# La table des révisions confirme le résultat.",
    "# A database nobody ever wrote a schema file for.": "# Une base pour laquelle aucun fichier de schéma n’a été écrit.",
    "# What it wrote is the annotated Go you would have written.": "# Le résultat est le Go annoté que l’on aurait écrit à la main.",
    "# The constraint came back with its name and its actions.": "# La contrainte conserve son nom et ses actions référentielles.",
    "# The declaration is also a diagram.": "# La déclaration devient aussi un diagramme.",
    "# The relationship is read off the foreign key, not a second file.": "# La relation est déduite de la clé étrangère, sans second fichier.",
    "# The tables already describe the API that reads them.": "# Les tables décrivent déjà l’API qui les lit.",
    "# The last field is the foreign key, read as a relation.": "# Le dernier champ est la clé étrangère représentée comme relation.",
    "# A diagramming tool wants DBML instead. Change one flag.": "# L’outil de diagrammes attend du DBML. Une seule option change.",
    "# Nothing was described twice to get this.": "# Aucune description en double n’a été nécessaire.",
    "# Ask what Ptah resolved for the server it is talking to.": "# Consulter les propriétés que Ptah a déterminées pour le serveur connecté.",
    "# enum_modeling is why a declared enum arrives here as a CHECK.": "# enum_modeling explique pourquoi un enum déclaré devient ici une contrainte CHECK.",
    "# Schema shape, in a format a metrics pipeline already reads.": "# La structure du schéma dans un format déjà lu par la chaîne de métriques.",
    "# Counts of objects, never of rows. Shape, not contents.": "# Compter les objets, jamais les lignes. Décrire la structure, pas les données.",
    "# Which view columns depend on which base columns?": "# Quelles colonnes de vues dépendent de quelles colonnes de base ?",
    "# The analysis is static: without --db-url it contacts nothing.": "# L’analyse est statique : sans --db-url, aucune connexion n’est établie.",
    "# Save the plan, so what is reviewed is what runs.": "# Enregistrer le plan pour exécuter exactement ce qui a été revu.",
    "# Sign it. Ptah never reads the key; ssh-keygen does.": "# Signer le plan. ssh-keygen lit la clé ; Ptah ne la lit jamais.",
    "# Now change one identifier in the approved plan.": "# Modifier un identifiant dans le plan approuvé.",
    "# Exit 2. An edited plan is a plan nobody approved.": "# Code de retour 2. Le plan modifié n’a été approuvé par personne.",
    "# An existing Atlas pipeline, and the same flags.": "# Une pipeline Atlas existante, avec les mêmes options.",
    "# It wrote an Atlas directory: the timestamped file, and atlas.sum.": "# Un répertoire Atlas a été écrit : le fichier horodaté et atlas.sum.",
    "# And apply reads that same directory.": "# apply lit ce même répertoire.",
    "# No script changed. The native surface is still there underneath.": "# Aucun script n’a changé. Les fonctions natives restent disponibles.",
    "# Publish the schema itself, as an artifact with a digest.": "# Publier le schéma lui-même comme artefact identifié par un digest.",
    "# Two tags now point at it, and only the two that were asked for.": "# Seuls les deux tags demandés pointent vers cet artefact.",
    "# A moving tag resolves to the digest that cannot move.": "# Un tag modifiable se résout en digest immuable.",
    "# What does that artifact declare? Ask without downloading it.": "# Consulter la déclaration de l’artefact sans le télécharger.",
    "# 843 bytes of manifest answered that. The payload stayed put.": "# 843 octets de manifeste suffisent. Les données de l’artefact restent sur place.",
    "# A registry reference is a schema source like a file is.": "# Une référence de registre est une source de schéma, comme un fichier.",
    "# Or take the artifact down as the canonical HCL it was stored as.": "# Ou télécharger l’artefact dans la forme HCL canonique sous laquelle il a été stocké.",
    "# The tables also describe the payloads that carry them.": "# Les tables décrivent aussi les structures de données échangées.",
    "# NOT NULL became required. The two cannot disagree.": "# NOT NULL devient required. Les deux restent cohérents.",
    "# The same schema as a wire contract.": "# Le même schéma comme contrat d’échange.",
    "# The warning is the point: field numbers are a promise.": "# L’avertissement est essentiel : les numéros de champs sont un engagement.",
    "# A later export reuses these numbers, or refuses to write.": "# Un export ultérieur réutilise ces numéros ou refuse d’écrire.",
    "# The reference page nobody keeps up to date by hand.": "# Générer la page de référence qu’il faudrait sinon tenir à jour à la main.",
    "# HTML is the same command with a different --to.": "# Pour HTML, la commande reste la même ; seule l’option --to change.",
    "# What is the SQL between these two files?": "# Quel SQL permet de passer d’un fichier à l’autre ?",
    "# Two arbitrary states, neither of them a live database.": "# Deux états quelconques, sans base en cours d’exécution.",
    "# Read the database back in a shape another tool reads.": "# Relire la base dans un format accepté par un autre outil.",
    "# Or as JSON, for something that is not a person.": "# Ou en JSON pour un traitement automatique.",
    "# hcl and sql are the other two, and --out-dir writes files.": "# Les autres formats sont hcl et sql. --out-dir écrit des fichiers.",
    "# Seed files carry the environment in the name.": "# Le nom des fichiers de données initiales indique leur environnement.",
    "# Run it again. Applied seeds are recorded, so this is a no-op.": "# Relancer l’exécution. Les chargements appliqués sont enregistrés : rien ne change.",
    "# And prod is not an environment you reach by typing it.": "# Saisir prod ne suffit pas à autoriser une exécution en production.",
    "# Every generated migration came with a down file.": "# Chaque migration générée possède un fichier down.",
    "# Ask what rolling back would do. Nothing runs.": "# Examiner les effets d’un retour arrière. Rien n’est exécuté.",
    "# The plan first, the rollback second. Same rule as forward.": "# D’abord le plan, puis le retour arrière. La même règle que pour avancer."
  },
  "sync": {
    "no drift": "aucune dérive",
    "drift": "dérive",
    "1 generation": "1 génération",
    "candidate": "candidate",
    "verified": "vérifiée",
    "needs approval": "approbation requise",
    "cut over": "basculée",
    "review": "revue",
    "blocked": "bloqué",
    "postgres": "postgres",
    "sqlite": "sqlite",
    "1 pending": "1 en attente",
    "up to date": "à jour",
    "no declaration": "sans déclaration",
    "declared": "déclaré",
    "mermaid": "mermaid",
    "graphql": "graphql",
    "dbml": "dbml",
    "sqlite 3": "sqlite 3",
    "openmetrics": "openmetrics",
    "static": "statique",
    "planned": "planifié",
    "approved": "approuvé",
    "refused": "refusé",
    "atlas dir": "répertoire Atlas",
    "applied": "appliqué",
    "unpublished": "non publié",
    "published": "publié",
    "remote": "distant",
    "oci source": "source OCI",
    "openapi": "openapi",
    "contract": "contrat",
    "markdown": "markdown",
    "two states": "deux états",
    "live": "en cours",
    "dev": "dev",
    "prod refused": "prod refusé",
    "1 applied": "1 appliquée"
  }
};
  if (typeof module !== "undefined" && module.exports) module.exports = narration;
  else root.PTAH_RUNS_FR = narration;
})(typeof globalThis !== "undefined" ? globalThis : this);

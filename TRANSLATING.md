# Translating ptah.run

English is the content source for Japanese (`/ja/`), German (`/de/`) and French
(`/fr/`). Preserve product behavior, limitations and project status. Commands,
flags, SQL, paths and recorded program output stay unchanged; translate the
surrounding prose and demo narration. `README.md` describes the locale checks.

## Japanese terminology guidance

This table records preferred wording for the meanings described in the first
column. It is editorial guidance, not a CI blacklist or a claim that other
Japanese words are incorrect. Review each sentence against its English source.
The checks do not establish one rendering per term or detect every synonym.
Rows can be revised or removed without changing a checker.

| Meaning in the English source | Preferred wording | Context |
| --- | --- | --- |
| live database | 稼働中のデータベース | A running database, including a development database; this does not mean production-only. |
| desired schema | 目標スキーマ | The schema supplied as the target of a comparison or change. |
| versioned migration | バージョン管理型マイグレーション | A versioned sequence of migration files, distinct from direct schema changes. |
| OCI artifact | アーティファクト | An object stored in an OCI registry. 成果物 remains available for work products in other contexts. |
| GitHub issue or issue tracker | Issue, Issue トラッカー | Labels for GitHub Issues. 課題 remains available for an ordinary problem or task. |
| command surface | コマンド体系 | The available commands and flags. 表面 remains available in unrelated contexts. |

The versioned-migration wording follows [Ent's Japanese introduction](https://entgo.io/ja/docs/versioned/intro/).
The running-database wording also appears in [High Link's account of online DDL](https://tech.high-link.co.jp/entry/MySQL-onlineDDL-change-database).
[GitHub's Japanese documentation](https://docs.github.com/ja/issues/tracking-your-work-with-issues/using-issues)
uses both 課題 and Issue; this site's label choice does not imply a global rule
about GitHub's translations.

These choices apply to this site's prose. The READMEs in `stokaro/ptah` and
`stokaro/ptah-operator` have their own review and checks; this file does not
silently impose policy on those repositories.

## Links to English resources

Use concise localized link labels without parenthetical language notices.
The Japanese footer explains once:

> ドキュメント、プレイグラウンド、リポジトリのリンク先は英語です。

Other landing-page languages remain available through the language picker.

## This project's typography conventions

These are choices for consistency on this site, not universal rules of Japanese:

- Omit a final `。` in an HTML heading or `<title>`.
- Put an ASCII space between adjacent Japanese and Latin letters in prose and
  control labels, for example `Ptah をインストール`. The [W3C Japanese layout
  requirements](https://www.w3.org/TR/2012/NOTE-jlreq-20120403/)
  discuss typographic spacing; they do not prescribe ASCII spaces in source text.
- Introduce the product as `Ptah（プタハ）` at its first prose mention and use
  `Ptah` afterward. `scripts/check-locales.mjs` checks this naming convention.
- Quote a session title before a suffix: `「スキーマを変更する」のトランスクリプト`.

## What the style check covers

`scripts/check-japanese.mjs` checks final punctuation in HTML headings and
`<title>`, adjacent Japanese/Latin letters in ordinary HTML prose, and
parenthetical language notices in link labels. It reads tracked `ja/**` HTML
and the shared `404.html`; generated pages are checked after generation.
Recorded code and transcripts are outside the prose spacing check.

It also reads the `TEXT.ja` dictionary in `assets/site.js`, including function
results for Japanese and Latin command names, detected platform names and
playback rates. New runtime functions require explicit sample arguments. This
covers those samples, not every possible input to a function. The fixtures test
both refusals and valid text, including ordinary uses of 課題, 成果物 and 表面.

There is no glossary parser, global word blacklist, required glossary-row count,
or minimum amount of prose. These checks measure the listed conventions; they
do not judge translation quality or enforce the terminology table.

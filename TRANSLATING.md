# Translating ptah.run

The site is written in English and translated into Japanese under `/ja/`,
German under `/de/` and French under `/fr/`.
`README.md` covers what is translated, what is not, and the checks that stop a
Japanese page going stale against its English counterpart. This file covers the
one thing those checks cannot see: whether two Japanese pages, written months
apart, use the same word for the same thing.

## Recorded output is not translated

Commands, flags, SQL, file names and anything Ptah printed stay byte-identical
in every language. Only the narration around them is translated. `README.md` has
the full rule; it is repeated here because it is the one a translator is most
likely to break.

## The glossary

A term with more than one plausible Japanese rendering splits the moment two
people translate two pages. Pick from this table, and add a row rather than a
synonym when a new term turns up.

| English                             | Japanese                   | Never                                          |
| ----------------------------------- | -------------------------- | ---------------------------------------------- |
| live database                       | 実データベース             | 実際のデータベース, 稼働中のデータベース       |
| the schema you want, desired schema | 目標スキーマ               | 望むスキーマ, 欲しいスキーマ, 目標のスキーマ   |
| versioned migration                 | バージョン付きマイグレーション | バージョン管理マイグレーション             |
| artifact (an OCI artifact)          | アーティファクト           | 成果物                                         |
| issue, issue tracker                | Issue, Issue トラッカー    | 課題, 課題トラッカー                           |
| command surface                     | コマンド体系               | 表面, コマンド面                               |

`scripts/check-japanese.mjs` reads this table -- the document, not a copy of it
-- and fails when a rendering in the `Never` column appears anywhere this
repository writes Japanese. It also fails when a rendering in the `Japanese`
column has stopped appearing at all, because a row nothing uses is a row that
will be wrong the next time somebody reads it.

Two of the choices are worth the sentence:

**アーティファクト, not 成果物.** 成果物 is the ordinary word for a work
product, and `README.ja.md` in `stokaro/ptah` uses it for a reviewed artifact
under version control. An OCI artifact is a different thing, and reusing the
word for both leaves the reader to guess which is meant.

**Issue, not 課題.** 課題 is a fine translation, but every link spelled that way
lands on a GitHub page whose own interface says Issues, in Japanese as well as
in English. The reader should meet the same word on both sides of the click.

## Links out of the Japanese pages

The documentation, playground, operator's site and repositories are in English.
The Japanese footer explains that once, in `foot-note`. Other landing-page
languages are available through the language picker.
Do not mark individual links -- the community page alone links to
more than thirty English destinations, and a marker on some of them tells the
reader nothing about the rest. `scripts/check-japanese.mjs` refuses the marker
`（英語）` for that reason.

## Typography

The first two rules are checked by `scripts/check-japanese.mjs`, on the pages
rather than on the sources they are generated from: a page is where the
generator's strings and the hand-written prose finally sit beside each other.

- No 句点 at the end of a heading or a title. Japanese publishing omits it, and
  a trailing `。` there is the English full stop carried across rather than the
  meaning.
- A space between Japanese and Latin script: `Ptah をインストール`, not
  `Ptahをインストール`.

The last two rules are on the translator:

- Full-width parentheses around the reading: `Ptah（プタハ）`. Where it goes and
  how often is `scripts/check-locales.mjs`; the spelling is here.
- No space before a Japanese particle. Joining a name to a suffix across a
  space -- `スキーマを変更する のトランスクリプト` -- is a shape Japanese does
  not write; 鉤括弧 close the name instead.

## What this gate cannot reach

`README.ja.md` in `stokaro/ptah` and in `stokaro/ptah-operator` is translated in
those repositories, against their own `check-translations.mjs`, and nothing
compares their Japanese with this site's. They should follow this table too. At
the time of writing they disagree with it in two places: `稼働中のデータベース`
for a live database, and `バージョン管理マイグレーション` for a versioned
migration.

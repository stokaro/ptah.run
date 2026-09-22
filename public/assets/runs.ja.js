/* ptah.run — the Japanese narration for the recorded runs.
 *
 * assets/runs.js holds the sessions themselves. Nothing here translates a
 * command, a flag, a file name, SQL or a line Ptah printed: those are what the
 * program did, and a transcript that changed them would be a different
 * recording. What this file carries is the narration around them — the name a
 * run goes by, the sentence under it, the state pill in the terminal bar, and
 * the `#` comments the demo types to say what is about to happen.
 *
 * Every table here is keyed by the English it replaces, and
 * scripts/build-runs.mjs refuses to write a page unless the keys and the
 * English source cover each other exactly. So an English line edited in
 * assets/runs.js orphans its key and fails the check, which is how the edit
 * reaches this file instead of silently leaving a Japanese page behind.
 *
 * `Ptah` stays Latin here. The reading プタハ is given once per page, in the
 * page's own prose, and never again — so no string in this file may carry it.
 */
(function (root) {
  "use strict";

  var JA = {
    // The state pill in the terminal bar, keyed by the state assets/runs.js
    // moves it to. An engine name, a format name and an environment name are
    // vocabulary the tool uses, so they stay as they are.
    sync: {
      "no drift": "ドリフトなし",
      drift: "ドリフト",
      "1 generation": "世代 1",
      candidate: "候補",
      verified: "検証済み",
      "needs approval": "承認待ち",
      "cut over": "切り替え済み",
      review: "レビュー",
      blocked: "停止",
      postgres: "postgres",
      sqlite: "sqlite",
      "1 pending": "未適用 1",
      "up to date": "最新",
      "no declaration": "宣言なし",
      declared: "宣言あり",
      mermaid: "mermaid",
      graphql: "graphql",
      dbml: "dbml",
      "sqlite 3": "sqlite 3",
      openmetrics: "openmetrics",
      static: "静的解析",
      planned: "計画済み",
      approved: "承認済み",
      refused: "拒否",
      "atlas dir": "atlas ディレクトリ",
      applied: "適用済み",
      unpublished: "未公開",
      published: "公開済み",
      remote: "リモート",
      "oci source": "OCI ソース",
      openapi: "openapi",
      contract: "契約",
      markdown: "markdown",
      "two states": "2 つの状態",
      live: "稼働中のデータベース",
      dev: "dev",
      "prod refused": "prod は拒否",
      "1 applied": "適用 1"
    },

    // What the grid and the overlay say about a session: the tag it is filed
    // under, the name it goes by, and the one sentence under that name. The
    // eight tags are a vocabulary meant to be scanned, so they are translated
    // once here and nowhere else.
    scenarios: {
      change: {
        tag: "スキーマ変更",
        label: "スキーマを変更する",
        caption:
          "目標スキーマを書く。実行前に何が起きるかを Ptah が示し、実行後はドリフト検査がデータベースとの一致を確かめる。"
      },
      versioned: {
        tag: "スキーマ変更",
        label: "マイグレーションを書く",
        caption:
          "もう一つの経路。Ptah が up と down を書き、未適用のものを実行し、何を実行したかを記録する。"
      },
      rollback: {
        tag: "スキーマ変更",
        label: "1 つ戻す",
        caption:
          "どのマイグレーションにも down がある。取り消す前に、取り消される内容がそのまま表示される。"
      },
      diff: {
        tag: "スキーマ変更",
        label: "2 つのスキーマを比較する",
        caption: "2 つのファイルと、その差を埋める SQL。どちらも稼働中のデータベースである必要はない。"
      },
      inference: {
        tag: "推論",
        label: "埋め込みを移行する",
        caption:
          "配信中の埋め込みの隣に新しい世代を作り、検証してから切り替える。切り替えはその計画を名指しした承認なしには走らない。"
      },
      guard: {
        tag: "安全性",
        label: "危険な変更を止める",
        caption:
          "列を削除するプルリクエストが出された。ビルドが落ちる様子と、その理由、そして安全だった順序。"
      },
      approve: {
        tag: "安全性",
        label: "計画に署名する",
        caption:
          "SSH 鍵で計画に署名する。あとから識別子を 1 つ書き換えれば検証は通らない。レビュー関門はそのために存在する。"
      },
      seed: {
        tag: "安全性",
        label: "環境に初期データを入れる",
        caption:
          "dev にしか入らない開発用データ。2 度目の実行は何もせず、prod を指定すれば拒否される。"
      },
      entities: {
        tag: "Go アノテーション",
        label: "Go 構造体から SQL へ",
        caption:
          "1 つの Go 構造体を 2 つのエンジンへ。PostgreSQL には本物の enum 型が、SQLite には同じ意味の CHECK 制約が出る。"
      },
      adopt: {
        tag: "Go アノテーション",
        label: "既存のデータベースを取り込む",
        caption:
          "誰も宣言を書かなかったデータベース。Ptah を向ければ、制約名も参照動作も含めて Go が返ってくる。"
      },
      capabilities: {
        tag: "調査",
        label: "対応機能を問い合わせる",
        caption:
          "接続先のサーバーについて Ptah が何を判定し、その答えがどこから来たのかを尋ねる。対象について推測することは何もない。"
      },
      inspect: {
        tag: "調査",
        label: "データベースを読み戻す",
        caption: "次のツールが求める形で実スキーマを読み戻す。DBML、JSON、HCL、SQL のいずれでも。"
      },
      lineage: {
        tag: "調査",
        label: "列をたどる",
        caption:
          "列を削除する前に、それを読んでいるものを調べる。解析は静的で、データベース URL がなければ何にも接続しない。"
      },
      stats: {
        tag: "調査",
        label: "ダッシュボードに流す",
        caption:
          "スキーマの形を、メトリクス基盤がすでに扱える数値として。数えるのはオブジェクトであって、行ではない。"
      },
      api: {
        tag: "エクスポート",
        label: "GraphQL API を書き出す",
        caption:
          "API はすでにテーブルが記述している。外部キーはリレーションフィールドとして届き、手作業で同期を保つものは残らない。"
      },
      openapi: {
        tag: "エクスポート",
        label: "OpenAPI 仕様を書き出す",
        caption:
          "HTTP のペイロードは、それを載せているテーブルから出てくる。NOT NULL 列は required として届くので、両者がずれることはない。"
      },
      protobuf: {
        tag: "エクスポート",
        label: "ワイヤ契約を保つ",
        caption:
          "フィールド番号は約束である。Ptah はその約束を守るための履歴を保持し、次回のエクスポートは同じ番号を再利用するか、書き込みを拒否する。"
      },
      dbml: {
        tag: "エクスポート",
        label: "DBML に書き出す",
        caption:
          "作図ツールが求めるのは DBML。フラグ 1 つで済み、HCL、OpenAPI、GraphQL、Protobuf、Markdown も同様。"
      },
      docs: {
        tag: "エクスポート",
        label: "リファレンスを書く",
        caption:
          "誰も手では最新に保てないスキーマリファレンス。外部キーも含まれる。ここでは Markdown、フラグ 1 つで HTML。"
      },
      diagram: {
        tag: "エクスポート",
        label: "スキーマを描く",
        caption:
          "同じアノテーションを図にしたもの。矢印は外部キーから引かれるので、図がスキーマと食い違うことはない。"
      },
      ociPublish: {
        tag: "レジストリ",
        label: "スキーマを公開する",
        caption:
          "スキーマそのものを push する。返ってくるのはダイジェスト、指定したタグだけ、そして動かないものを指す動くタグ。"
      },
      ociInspect: {
        tag: "レジストリ",
        label: "リモートのアーティファクトを読む",
        caption: "その参照先に何があるか。マニフェスト 843 バイトが答え、ペイロードは置かれたまま動かない。"
      },
      ociConsume: {
        tag: "レジストリ",
        label: "レジストリからビルドする",
        caption:
          "レジストリ参照はファイル名と同じように使える。そこから直接ビルドするか、保存された HCL として取り出す。"
      },
      compat: {
        tag: "Atlas",
        label: "Atlas のスクリプトを動かす",
        caption:
          "Atlas のパイプラインをそのまま。同じフラグ、同じディレクトリ、同じ atlas.sum で、下にはネイティブのコマンド体系がある。"
      }
    },

    // The demo's own narration, keyed by the English comment it replaces. The
    // `#` stays: the shell's comment syntax is what tells a reader that the
    // line is the demo speaking and not Ptah.
    notes: {
      "# Write the database's own schema into a file.":
        "# データベース自身のスキーマをファイルに書き出す。",
      "# Drift compares that file with the database it came from.":
        "# ドリフト検査は、そのファイルと取得元のデータベースを比べる。",
      "# Now ask for a column, by rewriting the schema you want.":
        "# 目標スキーマを書き換えて、列を 1 つ要求する。",
      "# The same check now has something to report.":
        "# 今度は同じ検査が報告を返す。",
      "# Ask what it would take to close it. A dry run executes nothing.":
        "# 差を埋めるのに何が要るかを尋ねる。ドライランは何も実行しない。",
      "# Run the reviewed plan. --auto-approve suits a disposable file.":
        "# レビュー済みの計画を実行する。使い捨てのファイルなら --auto-approve でよい。",
      "# And the same check, a third time.": "# そして同じ検査を、3 度目に。",

      "# Turn the declaration into a versioned migration.":
        "# 宣言をバージョン管理型マイグレーションにする。",
      "# A down file too, written at the same time as the up.":
        "# down も同時に書かれる。",
      "# And the revision table agrees.": "# リビジョンテーブルも一致している。",

      "# Every generated migration came with a down file.":
        "# 生成されたマイグレーションには必ず down が付いてくる。",
      "# Ask what rolling back would do. Nothing runs.":
        "# 戻したら何が起きるかを尋ねる。何も実行されない。",
      "# The plan first, the rollback second. Same rule as forward.":
        "# まず計画、次にロールバック。前進のときと同じ規則。",

      "# What is the SQL between these two files?":
        "# この 2 つのファイルの間にある SQL は何か。",
      "# Two arbitrary states, neither of them a live database.":
        "# 任意の 2 状態。どちらも稼働中のデータベースではない。",

      "# A new embedding model. Plan first: what would this take?":
        "# 新しい埋め込みモデル。まず計画を立てる。これには何が要るのか。",
      "# Build the new generation beside the one being served.":
        "# 配信中の世代の隣に、新しい世代を作る。",
      "# Rows that changed while it ran are caught up, then indexed.":
        "# 実行中に変わった行を追いつかせ、そのあとインデックスを張る。",
      "# Check it before anything reads it.": "# 何かが読む前に検証する。",
      "# Queries still read the old vectors. Cutover is its own step.":
        "# クエリはまだ古いベクトルを読んでいる。切り替えは独立した手順。",
      "# Approve that plan by its digest, and only that one.":
        "# その計画をダイジェストで承認する。承認されるのはその 1 つだけ。",
      "# The pointer the queries follow now names it.":
        "# クエリがたどるポインタが、新しい世代を指している。",

      "# A pull request adds this migration.":
        "# このマイグレーションを追加するプルリクエストが出た。",
      "# Check it before it reaches a database.":
        "# データベースに届く前に検査する。",
      "# The exit code is what fails the build.":
        "# ビルドを落とすのは終了コード。",

      "# Save the plan, so what is reviewed is what runs.":
        "# 計画を保存する。レビューされたものが、そのまま実行される。",
      "# Sign it. Ptah never reads the key; ssh-keygen does.":
        "# 署名する。鍵を読むのは ssh-keygen であって、Ptah ではない。",
      "# Now change one identifier in the approved plan.":
        "# 承認済みの計画で、識別子を 1 つ書き換えてみる。",
      "# Exit 2. An edited plan is a plan nobody approved.":
        "# 終了コード 2。書き換えられた計画は、誰も承認していない計画である。",

      "# Seed files carry the environment in the name.":
        "# シードファイルは環境名をファイル名に含む。",
      "# Run it again. Applied seeds are recorded, so this is a no-op.":
        "# もう一度実行する。適用済みのシードは記録されているので、何も起きない。",
      "# And prod is not an environment you reach by typing it.":
        "# そして prod は、打ち込めば届く環境ではない。",

      "# The schema is a Go struct. The annotations are the declaration.":
        "# スキーマは Go の構造体。宣言はアノテーションのほう。",
      "# Render it for PostgreSQL.": "# PostgreSQL 向けに出力する。",
      "# The same file, one flag apart.": "# 同じファイル、違うのはフラグ 1 つ。",
      "# No enum type in SQLite, so it is a CHECK. Nothing was dropped.":
        "# SQLite に enum 型はないので CHECK になる。落ちたものは何もない。",

      "# A database nobody ever wrote a schema file for.":
        "# 誰もスキーマファイルを書かなかったデータベース。",
      "# What it wrote is the annotated Go you would have written.":
        "# 出てきたのは、自分で書いたであろうアノテーション付きの Go。",
      "# The constraint came back with its name and its actions.":
        "# 制約は、名前と参照動作を伴って返ってきた。",

      "# Ask what Ptah resolved for the server it is talking to.":
        "# 接続先のサーバーについて Ptah が何を判定したかを尋ねる。",
      "# enum_modeling is why a declared enum arrives here as a CHECK.":
        "# 宣言した enum がここで CHECK になる理由が enum_modeling。",

      "# Read the database back in a shape another tool reads.":
        "# 別のツールが読める形でデータベースを読み戻す。",
      "# Or as JSON, for something that is not a person.":
        "# 人間以外が読むなら JSON で。",
      "# hcl and sql are the other two, and --out-dir writes files.":
        "# 残る 2 つは hcl と sql。--out-dir を付ければファイルに書く。",

      "# Which view columns depend on which base columns?":
        "# どのビュー列が、どの実テーブル列に依存しているのか。",
      "# The analysis is static: without --db-url it contacts nothing.":
        "# 解析は静的。--db-url がなければ何にも接続しない。",

      "# Schema shape, in a format a metrics pipeline already reads.":
        "# スキーマの形を、メトリクス基盤がすでに読める形式で。",
      "# Counts of objects, never of rows. Shape, not contents.":
        "# 数えるのはオブジェクトで、行ではない。中身ではなく形。",

      "# The tables already describe the API that reads them.":
        "# テーブルは、それを読む API をすでに記述している。",
      "# The last field is the foreign key, read as a relation.":
        "# 最後のフィールドは外部キーで、リレーションとして読まれている。",

      "# The tables also describe the payloads that carry them.":
        "# テーブル定義は、その行を運ぶペイロードの形も決めている。",
      "# NOT NULL became required. The two cannot disagree.":
        "# NOT NULL は required になった。両者がずれることはない。",

      "# The same schema as a wire contract.": "# 同じスキーマを、ワイヤ契約として。",
      "# The warning is the point: field numbers are a promise.":
        "# 警告こそが要点。フィールド番号は約束である。",
      "# A later export reuses these numbers, or refuses to write.":
        "# 次のエクスポートは、この番号を再利用するか、書き込みを拒否する。",

      "# A diagramming tool wants DBML instead. Change one flag.":
        "# 作図ツールが求めるのは DBML。フラグを 1 つ変えるだけ。",
      "# Nothing was described twice to get this.":
        "# これを得るために二重に記述したものは何もない。",

      "# The reference page nobody keeps up to date by hand.":
        "# 誰も手では最新に保てないリファレンスページ。",
      "# HTML is the same command with a different --to.":
        "# HTML は、--to を変えただけの同じコマンド。",

      "# The declaration is also a diagram.": "# 宣言は、そのまま図でもある。",
      "# The relationship is read off the foreign key, not a second file.":
        "# 関連は外部キーから読まれる。2 つ目のファイルからではない。",

      "# Publish the schema itself, as an artifact with a digest.":
        "# スキーマそのものを、ダイジェスト付きのアーティファクトとして公開する。",
      "# Two tags now point at it, and only the two that were asked for.":
        "# 2 つのタグがそれを指している。指定した 2 つだけ。",
      "# A moving tag resolves to the digest that cannot move.":
        "# 動くタグは、動かないダイジェストに解決される。",

      "# What does that artifact declare? Ask without downloading it.":
        "# そのアーティファクトは何を宣言しているのか。ダウンロードせずに尋ねる。",
      "# 843 bytes of manifest answered that. The payload stayed put.":
        "# 答えたのは 843 バイトのマニフェスト。ペイロードは動いていない。",

      "# A registry reference is a schema source like a file is.":
        "# レジストリ参照は、ファイルと同じくスキーマの入力元である。",
      "# Or take the artifact down as the canonical HCL it was stored as.":
        "# あるいは、保存されたままの正規形の HCL として取り出す。",

      "# An existing Atlas pipeline, and the same flags.":
        "# 既存の Atlas パイプラインと、同じフラグ。",
      "# It wrote an Atlas directory: the timestamped file, and atlas.sum.":
        "# 書かれたのは Atlas のディレクトリ。タイムスタンプ付きファイルと atlas.sum。",
      "# And apply reads that same directory.":
        "# apply は、その同じディレクトリを読む。",
      "# No script changed. The native surface is still there underneath.":
        "# スクリプトは 1 つも変えていない。下にはネイティブのコマンド体系がそのままある。"
    }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = JA;
  else root.PTAH_RUNS_JA = JA;
})(typeof globalThis !== "undefined" ? globalThis : this);

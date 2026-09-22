/* Interface text shared by every page: the header, the footer, the player's
 * controls and the in-practice page. Page copy lives beside the page that
 * uses it (src/i18n/home.mjs) or in the authored fragments
 * (src/fragments/<lang>/*.html).
 *
 * Every language has every key. A hole fails the build instead of falling
 * back to English on a page that says it is in another language.
 */

import { LANGS } from "../lib/site.mjs";

export const UI = {
  en: {
    skip: "Skip to content",
    navLabel: "Site",
    docs: "Docs",
    install: "Install",
    inPractice: "In practice",
    playground: "Playground",
    operator: "Operator",
    blog: "Blog",
    theme: "Dark theme",
    menu: "Menu",
    footIssues: "Issues",
    footCommunity: "Community",
    footChangelog: "Changelog",
    footLicense: "License",
    footNote: "",
    imageAlt: "The Ptah ASCII wordmark above the line: Database migrations without surprises.",
    // The in-practice page.
    ipTitle: "Ptah in practice",
    ipDescription:
      "Twenty-four recorded runs of Ptah: schema drift, versioned migrations, embedding cutover, OCI artifacts, format conversion and the Atlas-compatible surface. Read one, or watch it typed.",
    ipOgDescription: "Twenty-four recorded runs of Ptah. Read one, or watch it typed.",
    ipH1: "Ptah in practice",
    ipLede: (n) =>
      `${n} runs of Ptah, recorded at the terminal. Nothing here was written for the page. Open one to read it; Play types it out.`,
    quickStart: "Next: Quick start →",
    installPtah: "Install Ptah",
    // The player.
    speedLabel: "Playback speed, 1×. Press to change.",
    speedTitle: "Speed",
    play: "Play",
    playAria: "Play the demo",
    pause: "Pause",
    replay: "Replay",
    replayAria: "Replay the demo",
    expand: "Expand",
    expandAria: "Expand the demo",
    close: "Close",
    counts: (commands, lines) => `${commands} command${commands === 1 ? "" : "s"} · ${lines} lines`,
    transcriptLabel: (label) => `${label} transcript`,
  },
  ja: {
    skip: "本文へスキップ",
    navLabel: "サイト",
    docs: "ドキュメント",
    install: "インストール",
    inPractice: "実践例",
    playground: "プレイグラウンド",
    operator: "オペレーター",
    blog: "ブログ",
    theme: "ダークテーマ",
    menu: "メニュー",
    footIssues: "Issue",
    footCommunity: "コミュニティ",
    footChangelog: "変更履歴",
    footLicense: "ライセンス",
    footNote: "ドキュメント、プレイグラウンド、リポジトリのリンク先は英語です。",
    imageAlt: "Ptah の ASCII ロゴと、データベースのマイグレーションについての英語の見出し。",
    ipTitle: "Ptah 実践例",
    ipDescription:
      "端末で記録した Ptah の実行 24 件。スキーマのドリフト、バージョン管理型マイグレーション、埋め込みの切り替え、OCI アーティファクト、フォーマット変換、Atlas 互換のコマンド体系。読むこともできるし、打ち込まれる様子を見ることもできる。",
    ipOgDescription: "端末で記録した Ptah の実行 24 件。読んでもよいし、打ち込まれる様子を見てもよい。",
    // The one place プタハ appears on this page. Everywhere after it, Ptah.
    ipH1: "Ptah（プタハ）の実践例",
    // 再生 is what the button in the player says; naming it Play here would
    // send the reader looking for a control that is not on the page.
    ipLede: (n) =>
      `端末で記録した Ptah の実行 ${n} 件。ページのために書かれたものは一つもない。開けば読めるし、再生を押せば打ち込まれていく。`,
    quickStart: "次はクイックスタート →",
    installPtah: "Ptah をインストール",
    speedLabel: "再生速度 1×。押すと変わります。",
    speedTitle: "速度",
    play: "再生",
    playAria: "デモを再生",
    pause: "一時停止",
    replay: "最初から",
    replayAria: "デモを最初から再生",
    expand: "拡大",
    expandAria: "デモを拡大",
    close: "閉じる",
    counts: (commands, lines) => `コマンド ${commands} 件 · ${lines} 行`,
    // Quote the session name before adding the Japanese suffix.
    transcriptLabel: (label) => `「${label}」のトランスクリプト`,
  },
  de: {
    skip: "Zum Inhalt springen",
    navLabel: "Website",
    docs: "Dokumentation",
    install: "Installation",
    inPractice: "Praxisbeispiele",
    playground: "Testumgebung",
    operator: "Operator",
    blog: "Blog",
    theme: "Dunkles Design",
    menu: "Menü",
    footIssues: "Fehlerberichte",
    footCommunity: "Community",
    footChangelog: "Änderungsprotokoll",
    footLicense: "Lizenz",
    footNote: "",
    imageAlt: "Der Ptah-Schriftzug in ASCII über einer englischen Überschrift zu Datenbankmigrationen.",
    ipTitle: "Ptah in der Praxis",
    ipDescription:
      "24 aufgezeichnete Ptah-Abläufe: Schema-Drift, versionierte Migrationen, Embedding-Umschaltung, OCI-Artefakte, Formatkonvertierung und Atlas-kompatible Befehle. Als Text oder Wiedergabe.",
    ipOgDescription: "24 aufgezeichnete Ptah-Abläufe. Als Text lesen oder im Terminal abspielen.",
    ipH1: "Ptah in der Praxis",
    ipLede: (n) =>
      `${n} im Terminal aufgezeichnete Ptah-Abläufe. Die Ausgaben stammen aus echten Ausführungen. Öffnen Sie ein Beispiel zum Lesen oder wählen Sie Abspielen für die Wiedergabe.`,
    quickStart: "Weiter zum Schnellstart →",
    installPtah: "Ptah installieren",
    speedLabel: "Wiedergabegeschwindigkeit: 1×. Zum Ändern drücken.",
    speedTitle: "Geschwindigkeit",
    play: "Abspielen",
    playAria: "Demo abspielen",
    pause: "Pause",
    replay: "Erneut abspielen",
    replayAria: "Demo erneut abspielen",
    expand: "Vergrößern",
    expandAria: "Demo vergrößern",
    close: "Schließen",
    counts: (commands, lines) => `${commands} ${commands === 1 ? "Befehl" : "Befehle"} · ${lines} Zeilen`,
    transcriptLabel: (label) => `Transkript: ${label}`,
  },
  fr: {
    skip: "Aller au contenu",
    navLabel: "Navigation du site",
    docs: "Documentation",
    install: "Installation",
    inPractice: "En pratique",
    playground: "Bac à sable",
    operator: "Operator",
    blog: "Blog",
    theme: "Thème sombre",
    menu: "Menu",
    footIssues: "Signalements",
    footCommunity: "Communauté",
    footChangelog: "Historique des versions",
    footLicense: "Licence",
    footNote: "",
    imageAlt: "Le nom Ptah en ASCII au-dessus d’un titre en anglais sur les migrations de bases de données.",
    ipTitle: "Ptah en pratique",
    ipDescription:
      "24 exécutions enregistrées de Ptah : dérive de schéma, migrations versionnées, bascule d’embeddings, artefacts OCI, conversion de formats et commandes compatibles Atlas. À lire ou à regarder.",
    ipOgDescription: "24 exécutions enregistrées de Ptah. Lisez-les ou regardez-les dans le terminal.",
    ipH1: "Ptah en pratique",
    ipLede: (n) =>
      `${n} exécutions de Ptah enregistrées dans le terminal. Les sorties proviennent d’exécutions réelles. Ouvrez un exemple pour le lire ou appuyez sur Lire pour le regarder.`,
    quickStart: "Suite : démarrage rapide →",
    installPtah: "Installer Ptah",
    speedLabel: "Vitesse de lecture : 1×. Appuyez pour changer.",
    speedTitle: "Vitesse",
    play: "Lire",
    playAria: "Lire la démonstration",
    pause: "Pause",
    replay: "Relancer",
    replayAria: "Relancer la démonstration",
    expand: "Agrandir",
    expandAria: "Agrandir la démonstration",
    close: "Fermer",
    counts: (commands, lines) => `${commands} commande${commands === 1 ? "" : "s"} · ${lines} lignes`,
    transcriptLabel: (label) => `Transcription : ${label}`,
  },
};

// footNote is the one key allowed to be empty: only the Japanese tree says
// where its links lead.
const MAY_BE_EMPTY = new Set(["footNote"]);
for (const lang of LANGS) {
  for (const [key, value] of Object.entries(UI.en)) {
    const got = UI[lang]?.[key];
    if (typeof got !== typeof value || (got === "" && !MAY_BE_EMPTY.has(key))) {
      throw new Error(`src/i18n/ui.mjs: ${lang} is missing ${key}`);
    }
  }
}

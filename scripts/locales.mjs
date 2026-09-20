// Shared URL and language-switch contract for authored and generated pages.
export const LOCALES = {
  en: { name: "English", switchLabel: "Language" },
  ja: { name: "日本語", switchLabel: "言語" },
  de: { name: "Deutsch", switchLabel: "Sprache" },
  fr: { name: "Français", switchLabel: "Langue" }
};

export const prefix = (lang) => lang === "en" ? "" : `/${lang}`;
export const localizedPath = (lang, path) => `${prefix(lang)}${path}`;

export function alternates(path) {
  return [...Object.keys(LOCALES).map((lang) =>
    `<link rel="alternate" hreflang="${lang}" href="https://ptah.run${localizedPath(lang, path)}">`
  ), `<link rel="alternate" hreflang="x-default" href="https://ptah.run${path}">`].join("\n");
}

export function langSwitch(lang, path) {
  const selected = LOCALES[lang];
  if (!selected) throw new Error(`Unknown locale: ${lang}`);
  return `      <details class="lang-picker">
        <summary class="icon-btn lang-btn" aria-label="${selected.switchLabel}">${selected.name}</summary>
        <ul class="language-links">
${Object.entries(LOCALES).map(([code, locale]) =>
  `          <li><a href="${localizedPath(code, path)}" hreflang="${code}" lang="${code}"${code === lang ? ' aria-current="page"' : ""}>${locale.name}</a></li>`
).join("\n")}
        </ul>
      </details>`;
}

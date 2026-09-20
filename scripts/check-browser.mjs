#!/usr/bin/env node
// Render the localized pages with the shared stylesheet and player. Screenshots
// are review artifacts; assertions measure layout and interactions, not pixels.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { LOCALES, localizedPath } from "./locales.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(process.env.SCREENSHOT_DIR || join(root, "artifacts/locales"));
await mkdir(output, { recursive: true });
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".ico": "image/x-icon" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let path = resolve(root, "." + pathname);
    if (!path.startsWith(root + "/") && path !== root) throw new Error("outside site");
    if ((await stat(path)).isDirectory()) path = join(path, "index.html");
    response.setHeader("Content-Type", types[extname(path)] || "application/octet-stream");
    response.end(await readFile(path));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const readings = [];
try {
  browser = await chromium.launch();
  for (const javaScriptEnabled of [true, false]) {
    for (const colorScheme of ["light", "dark"]) {
      const context = await browser.newContext({ javaScriptEnabled, colorScheme, reducedMotion: "reduce" });
      // Release refresh is unrelated to translation and must not change screenshots.
      await context.route("https://api.github.com/**", (route) => route.fulfill({ status: 200, json: { tag_name: "v0.4.0" } }));
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const width of javaScriptEnabled ? [320, 390, 768, 1024, 1280, 1440] : [390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const lang of Object.keys(LOCALES)) {
          for (const path of ["/", "/install/", "/in-practice/", "/community/"]) {
            const route = localizedPath(lang, path);
            const response = await page.goto(origin + route);
            assert.equal(response.status(), 200, route);
            await page.evaluate(() => document.fonts.ready);
            const reading = await page.evaluate(() => {
              const clipped = [...document.querySelectorAll("h1, h2, h3, .btn, .nav-links a, .demo-btn")]
                .filter((element) => element.getClientRects().length)
                .filter((element) => element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2)
                .map((element) => element.textContent.trim());
              const outside = [...document.querySelectorAll("h1, h2, h3, .btn, .brand, .nav, .site-footer")]
                .filter((element) => element.getClientRects().length)
                .filter((element) => { const box = element.getBoundingClientRect(); return box.left < -1 || box.right > innerWidth + 1; })
                .map((element) => element.className || element.tagName);
              return { lang: document.documentElement.lang, width: innerWidth,
                scrollWidth: document.documentElement.scrollWidth, clipped, outside };
            });
            readings.push({ route, javaScriptEnabled, colorScheme, ...reading });
            assert.equal(reading.lang, lang, route);
            assert(reading.scrollWidth <= width + 1, `${route} at ${width}: page width ${reading.scrollWidth}`);
            assert.deepEqual(reading.clipped, [], `${route} at ${width}: clipped text`);
            assert.deepEqual(reading.outside, [], `${route} at ${width}: content outside viewport`);
            assert.deepEqual(errors, [], `${route}: browser errors`);
            await page.locator(".lang-picker summary").click();
            for (const code of Object.keys(LOCALES)) {
              assert.equal(await page.locator(`.language-links a[lang="${code}"]`).getAttribute("href"), localizedPath(code, path));
            }
            const menuBox = await page.locator(".language-links").boundingBox();
            assert(menuBox.x >= 0 && menuBox.x + menuBox.width <= width, `${route}: language menu outside viewport`);
            if (javaScriptEnabled) {
              await page.keyboard.press("Escape");
              assert.equal(await page.locator(".lang-picker").getAttribute("open"), null);
            } else {
              await page.locator(".lang-picker summary").click();
            }
            if (javaScriptEnabled && width < 1200) {
              await page.locator(".menu-btn").click();
              assert.equal(await page.locator(".nav-links").isVisible(), true);
              const navBox = await page.locator(".nav-links").boundingBox();
              assert(navBox.x >= 0 && navBox.x + navBox.width <= width, `${route}: mobile navigation outside viewport`);
              await page.keyboard.press("Escape");
              assert.equal(await page.locator(".menu-btn").getAttribute("aria-expanded"), "false");
            }
            if (javaScriptEnabled && ["de", "fr"].includes(lang) && path === "/" && [390, 1280].includes(width)) {
              await page.evaluate(() => document.activeElement.blur());
              await page.screenshot({ path: join(output, `${lang}-${width}-${colorScheme}.png`), fullPage: true });
            }
          }
        }
      }
      // Follow the actual switch links, including from English and Japanese.
      for (const code of Object.keys(LOCALES)) {
        await page.goto(origin + localizedPath(code, "/"));
        for (const target of Object.keys(LOCALES)) {
          await page.locator(".lang-picker summary").click();
          await page.locator(`.language-links a[lang="${target}"]`).click();
          assert.equal(new URL(page.url()).pathname, localizedPath(target, "/"));
        }
      }
      if (javaScriptEnabled) {
        for (const lang of ["de", "fr"]) {
          await page.goto(origin + `/${lang}/install/`);
          await page.locator('[data-tab="windows"]').click();
          assert.equal(await page.locator('#panel-windows').isVisible(), true);
          await page.locator('[data-copy="cmd-windows"]').click();
          await page.waitForFunction(() => document.querySelector('#copy-status').textContent.length > 0);
          assert.match(await page.locator('#copy-status').textContent(), lang === "de" ? /Zwischenablage/ : /presse-papiers/);
          await page.goto(origin + `/${lang}/in-practice/`);
          await page.locator('[data-demo-tile][data-demo-scenario="change"]').click();
          assert.equal(await page.locator('.demo-modal').isVisible(), true);
          assert.equal(await page.locator('[data-demo-title]').textContent(), lang === "de" ? "Ein Schema ändern" : "Modifier un schéma");
          await page.keyboard.press('Escape');
        }
      }
      await context.close();
      console.log(`Layout and interactions passed: JavaScript ${javaScriptEnabled ? "on" : "off"}, ${colorScheme}`);
    }
  }
  // A broken dictionary must report an error and preserve the static localized
  // transcript. It must never start an English player on the translated page.
  for (const lang of ["de", "fr"]) {
    for (const missing of ["interface", "narration"]) {
      const context = await browser.newContext({ reducedMotion: "reduce" });
      const script = missing === "interface" ? "site.js" : `runs.${lang}.js`;
      let body = await readFile(join(root, "assets", script), "utf8");
      if (missing === "interface") {
        body = body.replace(lang === "de" ? 'command: "Befehl",' : 'command: "commande",', '');
      } else {
        body += `;delete window.PTAH_RUNS_${lang.toUpperCase()}.scenarios.change.caption;`;
      }
      await context.route(`**/assets/${script}`, (route) => route.fulfill({ contentType: "text/javascript", body }));
      const page = await context.newPage();
      const error = page.waitForEvent("pageerror", { timeout: 5000 });
      await page.goto(origin + `/${lang}/`);
      assert.match((await error).message, new RegExp(`Missing ${lang}`));
      assert.equal(await page.locator('[data-demo-transcript]').isVisible(), true);
      assert.equal(await page.locator('[data-demo-screen]').isVisible(), false);
      assert.match(await page.locator('[data-demo-transcript]').textContent(), lang === "de" ? /Schema der Datenbank/ : /schéma de la base/);
      await context.close();
    }
  }
  await writeFile(join(output, "readings.json"), JSON.stringify(readings, null, 2) + "\n");
  console.log(`${readings.length} layout readings passed; switches, mobile navigation, copy controls, install tabs, player and missing-translation refusals passed`);
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}

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
    var replayBtn = $("[data-demo-replay]", demo);
    var expandBtn = $("[data-demo-expand]", demo);
    var progress = $("[data-demo-progress]", demo);
    var progressFill = $("span", progress);
    var modal = $("[data-demo-modal]");
    var where = $(".demo-where", demo);
    var pick = $("[data-demo-pick]");
    var pickBtns = $$("[data-demo-scenario]");
    var caption = $("[data-demo-caption]");

    // Kinds: cmd and cont are typed, everything else arrives whole. `new`
    // marks the added column, in the file and again in the database.
    var CHANGE = [
      ["sync", "no drift"],
      ["cmd", "cat schema.sql"],
      ["out", "CREATE TABLE users ("],
      ["out", "    id         INTEGER PRIMARY KEY,"],
      ["out", "    email      TEXT NOT NULL"],
      ["out", ");"],
      ["blank"],
      ["cmd", "ptah schema drift --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db"],
      ["out", "No schema drift detected."],
      ["wait", 1200],
      ["blank"],
      ["cmd", "cat > schema.sql <<'SQL'"],
      ["out", "CREATE TABLE users ("],
      ["out", "    id         INTEGER PRIMARY KEY,"],
      ["out", "    email      TEXT NOT NULL,"],
      ["new", "    created_at TEXT"],
      ["out", ");"],
      ["out", "SQL"],
      ["sync", "drift"],
      ["wait", 900],
      ["blank"],
      ["cmd", "ptah schema apply --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db --dry-run"],
      ["mute", "Planned schema changes:"],
      ["sql", 'ALTER TABLE "users" ADD COLUMN "created_at" TEXT;'],
      ["wait", 1400],
      ["blank"],
      ["cmd", "ptah schema apply --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db --auto-approve"],
      ["mute", "Planned schema changes:"],
      ["sql", 'ALTER TABLE "users" ADD COLUMN "created_at" TEXT;'],
      ["mute", "Auto-approval enabled; applying schema changes."],
      ["wait", 500],
      ["out", "Schema apply completed successfully."],
      ["wait", 900],
      ["blank"],
      ["cmd", "ptah db read --db-url sqlite://app.db"],
      ["sql", 'CREATE TABLE "users" ('],
      ["sql", '  "id" INTEGER PRIMARY KEY,'],
      ["sql", '  "email" TEXT NOT NULL,'],
      ["new", '  "created_at" TEXT'],
      ["sql", ");"],
      ["wait", 1200],
      ["blank"],
      ["cmd", "ptah schema drift --schema-file schema.sql \\"],
      ["cont", "    --db-url sqlite://app.db"],
      ["out", "No schema drift detected."],
      ["sync", "no drift"]
    ];

    // The other half of "without surprises": the change that does not run.
    // Captured from `ptah migrations lint` over a directory whose one file
    // drops a column, exit code 1. The diagnostic is long because it names the
    // consequence and the safer order; that length is the point, so it wraps
    // here rather than being trimmed into a slogan.
    var GUARD = [
      ["sync", "review"],
      ["cmd", "cat migrations/1700000100_drop_email.up.sql"],
      ["sql", 'ALTER TABLE "users" DROP COLUMN "email";'],
      ["wait", 900],
      ["blank"],
      ["cmd", "ptah migrations lint --dir ./migrations \\"],
      ["cont", "    --dialect postgres"],
      ["wait", 400],
      ["mute", "migrations/1700000100_drop_email.up.sql:1 [warning] BC104: dropping a column retires a name application versions already deployed against the old schema still select and insert, so each of them starts failing the moment this migration commits, whether or not the column held any rows; deploy readers that no longer use the column first, then drop it in a later release (dropped column breaks deployed code)"],
      ["err", "migrations/1700000100_drop_email.up.sql:1 [error] DS102: DROP COLUMN permanently deletes the column's data; deploy readers that no longer use the column first, then drop it in a later release (column dropped)"],
      ["blank"],
      ["out", "2 finding(s)."],
      ["mute", "warning: DS110P ran without the baseline schema it reads, so this analysis is thinner than the same directory would get against a dev database the run can read"],
      ["sync", "blocked"],
      ["wait", 700],
      ["cmd", "echo $?"],
      ["out", "1"]
    ];

    var SCENARIOS = {
      change: {
        script: CHANGE,
        where: "sh · ptah-quick-start",
        caption:
          "Know exactly what your migration will do before it touches the " +
          "database. The plan is the review surface; drift is the proof."
      },
      guard: {
        script: GUARD,
        where: "sh · ptah-ci",
        caption:
          "A migration that would delete data is refused before it runs, with " +
          "the reason and the safer order. Exit code 1 fails the build."
      }
    };

    var SCRIPT = CHANGE;

    var CLASS = { mute: "m", sql: "a", new: "n", err: "e" };

    // What each event is expected to cost. The typing jitter makes the real
    // figure vary by a few per cent, which is invisible on a two-pixel rule and
    // much cheaper than measuring a duration nobody knows before it runs.
    function cost(event) {
      var kind = event[0];
      if (kind === "wait") return event[1];
      if (kind === "cmd" || kind === "cont") return 460 + event[1].length * 32;
      if (kind === "blank") return 60;
      if (kind === "sync") return 120;
      return 70;
    }

    function total(script) {
      var sum = 0;
      for (var i = 0; i < script.length; i++) sum += cost(script[i]);
      return sum;
    }

    var elapsed = 0;
    var duration = 0;

    // Set where the rule is going and how long it has to get there, so the
    // browser animates between events and the script never has to tick.
    function advance(ms) {
      var to = duration ? Math.min(1, (elapsed + ms) / duration) : 0;
      progressFill.style.transition = ms && !still.matches ? "width " + ms + "ms linear" : "none";
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
    var lines = [];
    var typing = null;

    function paint() {
      var html = lines.join("\n");
      if (typing !== null) {
        if (html) html += "\n";
        html +=
          (typing.cont ? "" : '<span class="p">$</span> ') +
          esc(typing.text) +
          '<span class="demo-cursor" data-on="1">\u258d</span>';
      }
      // Whether to follow is decided before the write, because writing is what
      // moves the bottom. A reader who scrolled up to re-read a finding is not
      // dragged back down by the next line; returning to the bottom re-arms it.
      var following = screen.scrollHeight - screen.scrollTop - screen.clientHeight < 24;
      screen.innerHTML = html;
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

    function after(ms, fn) {
      timer = setTimeout(fn, ms);
    }

    function type(kind, text, n) {
      if (paused) return;
      if (n > text.length) {
        return after(320, function () {
          commit(kind, text);
          after(140, step);
        });
      }
      typing = { text: text.slice(0, n), cont: kind === "cont" };
      paint();
      var ch = text.charAt(n - 1);
      after(ch === " " ? 34 : 20 + Math.random() * 34, function () {
        type(kind, text, n + 1);
      });
    }

    function step() {
      if (paused) return;
      var event = SCRIPT[at];
      if (!event) {
        // A reader who pressed Play, or who expanded it, asked for one run.
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
      advance(cost(event));
      if (kind === "wait") return after(event[1], step);
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
      clearTimeout(timer);
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
      clearTimeout(timer);
      at = 0;
      lines = [];
      typing = null;
      playing = true;
      paused = false;
      elapsed = 0;
      duration = total(SCRIPT);
      advance(0);
      demo.classList.add("is-playing");
      label();
      paint();
      step();
    }

    function label() {
      var next = !playing || paused ? "Play" : "Pause";
      toggleBtn.textContent = next;
      toggleBtn.setAttribute("aria-label", next + " the demo");
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

    function setOpen(open) {
      expandBtn.setAttribute("aria-expanded", open ? "true" : "false");
      expandBtn.textContent = open ? "Close" : "Expand";
      demo.classList.toggle("is-open", open);
      if (open) {
        modal.appendChild(demo);
        modal.showModal();
      } else {
        homeParent.insertBefore(demo, home);
        if (modal.open) modal.close();
        // Back in the hero it is ambient again. A run that ended under the
        // overlay's one-shot rule starts over; one still playing carries on.
        if (!playing && autoplays()) start();
      }
      // The height changed under a stream that may be mid-scroll.
      screen.scrollTop = screen.scrollHeight;
    }

    expandBtn.addEventListener("click", function () {
      setOpen(expandBtn.getAttribute("aria-expanded") !== "true");
    });
    // Escape and the backdrop both close it, and both arrive here as `close`,
    // so the button label and the moved node are put back in one place.
    modal.addEventListener("close", function () {
      if (demo.parentNode === modal) setOpen(false);
    });
    modal.addEventListener("click", function (event) {
      if (event.target === modal) modal.close();
    });

    replayBtn.addEventListener("click", start);
    toggleBtn.addEventListener("click", function () {
      if (!playing) return start();
      paused = !paused;
      clearTimeout(timer);
      if (paused) freezeProgress();
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
          clearTimeout(timer);
          if (!visible) return freezeProgress();
          step();
        }, { threshold: 0.25 }).observe(demo);
      }
    }

    blink = setInterval(function () {
      var cursor = $(".demo-cursor", screen);
      if (cursor) cursor.setAttribute("data-on", cursor.getAttribute("data-on") === "1" ? "0" : "1");
    }, 530);
    void blink;
  }
})();

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
  function labelTheme() {
    if (!themeBtn) return;
    // Fixed name ("Dark theme") plus a pressed state, never a changing verb.
    themeBtn.setAttribute("aria-pressed", root.getAttribute("data-theme") === "dark" ? "true" : "false");
  }
  if (themeBtn) {
    labelTheme();
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
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
})();

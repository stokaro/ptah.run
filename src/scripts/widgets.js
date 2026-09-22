/* The homepage's switchers. Every interactive block renders all of its states
 * at build time; this script only decides which one shows.
 *
 * A block is an element with data-widget and a state such as
 * data-state="mode=walk edit=add dialect=sqlite". A control inside it says
 * what it sets (data-set="edit=drop"); an element shows while every condition
 * in its data-when holds, and one with data-hl takes .is-on the same way
 * without being hidden (the export fan's arrows). Blocks can nest; a control
 * belongs to the nearest block around it.
 */

function parse(text) {
  const state = {};
  for (const pair of (text || "").trim().split(/\s+/)) {
    if (!pair) continue;
    const [key, value] = pair.split("=");
    state[key] = value;
  }
  return state;
}

function holds(conditions, state) {
  const want = parse(conditions);
  return Object.keys(want).every((key) => state[key] === want[key]);
}

function own(root, selector) {
  return [...root.querySelectorAll(selector)].filter((el) => el.closest("[data-widget]") === root);
}

function apply(root) {
  const state = parse(root.dataset.state);
  for (const el of own(root, "[data-when]")) el.classList.toggle("is-on", holds(el.dataset.when, state));
  for (const el of own(root, "[data-hl]")) el.classList.toggle("is-on", holds(el.dataset.hl, state));
  for (const control of own(root, "[data-set]")) {
    const on = holds(control.dataset.set, state);
    control.setAttribute(control.getAttribute("role") === "tab" ? "aria-selected" : "aria-pressed", on ? "true" : "false");
    if (control.getAttribute("role") === "tab") control.tabIndex = on ? 0 : -1;
  }
  // A lifecycle marks the steps before the current one as done.
  if (root.dataset.steps) {
    const order = root.dataset.steps.split(" ");
    const at = order.indexOf(state.step);
    for (const control of own(root, "[data-set^='step=']")) {
      const index = order.indexOf(parse(control.dataset.set).step);
      control.classList.toggle("is-done", index < at);
    }
  }
}

function set(root, assignment) {
  const state = parse(root.dataset.state);
  const before = { ...state };
  Object.assign(state, parse(assignment));
  root.dataset.state = Object.entries(state)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  apply(root);
  root.dispatchEvent(new CustomEvent("widget:change", { detail: { before, after: state } }));
}

for (const root of document.querySelectorAll("[data-widget]")) {
  apply(root);
  root.addEventListener("click", (event) => {
    const control = event.target.closest("[data-set]");
    if (!control || control.closest("[data-widget]") !== root) return;
    set(root, control.dataset.set);
  });
  // Arrow keys move along a tab list, the way a tab list is expected to work.
  root.addEventListener("keydown", (event) => {
    const tab = event.target.closest("[role='tab'][data-set]");
    if (!tab || tab.closest("[data-widget]") !== root) return;
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !back) return;
    const tabs = own(root, "[role='tab'][data-set]").filter((el) => el.parentElement === tab.parentElement);
    const next = tabs[(tabs.indexOf(tab) + (forward ? 1 : tabs.length - 1)) % tabs.length];
    event.preventDefault();
    next.focus();
    set(root, next.dataset.set);
  });
}

// The hero: leaving the walkthrough for "Try it" holds the session where it
// was, and coming back lets it carry on.
const hero = document.querySelector(".hframe[data-widget]");
if (hero) {
  hero.addEventListener("widget:change", (event) => {
    const { before, after } = event.detail;
    if (before.mode === after.mode) return;
    hero.dispatchEvent(new Event(after.mode === "try" ? "demo:hold" : "demo:carry-on"));
  });
}

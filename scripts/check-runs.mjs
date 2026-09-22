#!/usr/bin/env node
/* The recorded runs and their narration.
 *
 * src/lib/runs.mjs refuses a narration dictionary with a hole or an orphan in
 * it, which stops the build. This proves that refusal still refuses: each
 * mutation below breaks a valid dictionary in one way, and every one of them
 * has to be reported.
 *
 *   node scripts/check-runs.mjs --selftest
 */
import assert from "node:assert/strict";
import { NARRATIONS, narrationProblems, RUNS } from "../src/lib/runs.mjs";

let checks = 0;
for (const lang of Object.keys(NARRATIONS)) {
  const valid = NARRATIONS[lang];
  assert.deepEqual(narrationProblems(lang, valid), [], `${lang}: the committed narration must be complete`);
  const mutations = [
    (n) => { delete n.scenarios.change; },
    (n) => { n.scenarios.change.caption = ""; },
    (n) => { n.scenarios.change.label = "   "; },
    (n) => { delete n.notes[Object.keys(n.notes)[0]]; },
    (n) => { n.notes[Object.keys(n.notes)[0]] = ""; },
    (n) => { n.notes["# Removed source line"] = "Orphan"; },
    (n) => { delete n.sync["no drift"]; },
    (n) => { n.sync["no drift"] = ""; },
  ];
  for (const mutate of mutations) {
    const broken = structuredClone(valid);
    mutate(broken);
    assert(narrationProblems(lang, broken).length > 0, `${lang}: a missing or orphaned narration must be reported`);
    checks++;
  }
}
assert(RUNS.order.length >= 20, `only ${RUNS.order.length} runs in the grid`);
console.log(`check-runs: ${checks} narration refusal checks passed over ${RUNS.order.length} runs`);

import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeWorkspace, sanitizePrefs, sanitizeLastVisit, encodeLayout, decodeLayout, PRESETS, VIEW_IDS } from "../lib/optionsWorkspace.mjs";

test("workspaces keep layout configuration only", () => {
  const w = sanitizeWorkspace({ id: "x", name: "<b>Mine</b>", cols: 9, panes: [{ view: "gex-strike", span: 2, symbol: "NIFTY", data: [1, 2], token: "secret" }, { view: "nope" }] });
  assert.deepEqual(w, { id: "x", name: "bMine/b", cols: 2, panes: [{ view: "gex-strike", span: 2, symbol: "NIFTY" }] });
  assert.equal(sanitizeWorkspace({ panes: [] }), null);
  assert.equal(sanitizeWorkspace({ panes: [{ view: "gex-strike", symbol: "x;drop" }] }).panes[0].symbol, undefined);
});
test("share codes round-trip and never carry extra fields", () => {
  const code = encodeLayout({ name: "Expiry", cols: 3, panes: [{ view: "pin-pressure", apiKey: "k" }] });
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  const back = decodeLayout(code);
  assert.deepEqual(back.panes, [{ view: "pin-pressure", span: 1 }]);
  assert.equal(decodeLayout("@@@"), null);
});
test("presets are valid layouts and only reference known views", () => {
  for (const p of PRESETS) {
    assert.ok(sanitizeWorkspace(p), p.name);
    for (const pane of p.panes) assert.ok(VIEW_IDS.includes(pane.view), pane.view);
  }
});
test("prefs and last-visit markers are whitelisted", () => {
  assert.deepEqual(sanitizePrefs({ theme: "contrast", palette: "x", heat: 5, pin: "#ff0000", evil: 1 }), { theme: "contrast", heat: 1, pin: "#ff0000" });
  assert.deepEqual(sanitizeLastVisit({ NIFTY: { t: 1, netGex: 2, expiry: "2026-12-01" }, "bad sym": { t: 1, netGex: 1 } }), { NIFTY: { t: 1, netGex: 2, expiry: "2026-12-01" } });
});

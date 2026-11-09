import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const home = read("app/premium-editorial.css");
const previews = read("app/library/series/preview.css");

test("public research previews reuse the exact effective homepage dark/light palette", () => {
  for (const [homeVariable,previewVariable,dark,light] of [
    ["bg","bg","#090c13","#f7f5f0"],
    ["panel","panel","#131924","#fffdf9"],
    ["text","text","#f2efe9","#17212d"],
    ["muted","muted","#a5a9b4","#566372"],
    ["border","border","#303946","#d6d8d7"],
    ["gold","accent","#d7b477","#88632d"]
  ]) {
    assert.ok(home.includes(`--pr-${homeVariable}:${dark}`), `homepage dark ${homeVariable} palette changed`);
    assert.ok(previews.includes(`--rp-${previewVariable}: ${dark}`), `preview dark ${homeVariable} mismatch`);
    assert.ok(home.includes(`--pr-${homeVariable}:${light}`), `homepage light ${homeVariable} palette changed`);
    assert.ok(previews.includes(`--rp-${previewVariable}: ${light}`), `preview light ${homeVariable} mismatch`);
  }
  assert.ok(previews.includes('html[data-theme="light"] .rl-site.rp-site'), "light mode missing");
});

test("research styling remains scoped and uses a contained pencil-paper reading surface", () => {
  assert.match(previews,/\.rl-site\.rp-site\s*\{/);
  assert.match(previews,/\.rp-paper\s*\{\s*background:\s*var\(--rp-bg\)/);
  assert.match(previews,/\.rp-paper-shell\s*\{[\s\S]*?width:\s*min\(1050px/);
  assert.match(previews,/\.rp-paper-shell\s*\{[\s\S]*?background:[\s\S]*?var\(--rp-paper\)/);
  assert.match(previews,/\.rp-lock-mark/);
  assert.match(previews,/\.rp-unlock-primary/);
  assert.doesNotMatch(previews,/#93bce6|#eaf0f5|#05070b/i, "old off-brand blue/black overrides remain");
  assert.doesNotMatch(previews,/(?:^|\n)\s*(?:html|body|:root)\s*\{/m, "research preview changed global styles");
});

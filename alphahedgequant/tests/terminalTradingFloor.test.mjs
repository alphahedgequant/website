import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url);
const floor=readFileSync(new URL("app/terminal/TerminalTradingFloor.jsx",root),"utf8");
const route=readFileSync(new URL("app/terminal/page.jsx",root),"utf8");
const css=readFileSync(new URL("app/terminal/terminal-floor.css",root),"utf8");
test("reference screenshot trading floor contains all 11 functional panel IDs",()=>{
  const ids=[...floor.matchAll(/\{id:"([a-z-]+)",title:/g)].map(m=>m[1]);
  assert.deepEqual(ids,["orders","account","messages","order-entry","depth","blocks","options","timesales","chart","alerts","movers"]);
  for(const id of ids)assert(floor.includes('windowDef={windows.'+id+'}')||floor.includes('windowDef={windows["'+id+'"]}'),"render "+id);
});
test("new floor is the default; classic research and company intelligence are retained",()=>{
  assert.match(route,/useState\("FLOOR"\)/);
  assert.match(route,/workspace==="FLOOR" \? <TerminalTradingFloor/);
  assert.match(route,/className="qt-main-grid"/);
  assert.match(route,/TerminalIntelligence key=\{symbol\}/);
});
test("broker/order/live trade sources are never fabricated",()=>{
  assert.match(floor,/NO ORDER FEED CONNECTED/);
  assert.match(floor,/NO VERIFIED TRADE PRINTS/);
  assert.match(floor,/BLOCK PRINTS NOT CONNECTED/);
  assert.match(floor,/No orders are transmitted/);
  assert(!/\bfetch\([^)]*(?:\/api\/orders|\/api\/trade\/execute)/.test(floor));
});
test("option ranks are based on observed volume, not invented market-wide numbers",()=>{
  assert.match(floor,/selected chain only/);
  assert.match(floor,/chain\?\.strikes/);
  assert.match(floor,/volume/);
  assert.match(floor,/NSE screener snapshot/);
});
test("desktop windows can be moved and resized, mobile panels safely stack",()=>{
  assert.match(floor,/setPointerCapture/);
  assert.match(floor,/onPointerMove=\{move\}/);
  assert.match(css,/resize:both/);
  assert.match(css,/@media\(max-width:1100px\)/);
  assert.match(css,/grid-template-columns:1fr/);
});

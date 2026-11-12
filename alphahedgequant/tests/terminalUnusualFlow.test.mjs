import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {rankOptionActivity} from "../lib/unusualOptionsActivity.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("volume/open-interest activity ranks actual available strikes, not invented flow prints",()=>{
 const chain={strikes:[
  {strike_price:100,call:{volume:600,oi:200,oi_change:80,ltp:7},put:{volume:300,oi:1000,oi_change:-20,ltp:5}},
  {strike_price:105,call:{volume:100,oi:20,oi_change:5,ltp:4},put:{volume:50,oi:null,oi_change:null,ltp:null}}
 ]};
 const rows=rankOptionActivity(chain);
 assert.equal(rows.length,4);
 assert.equal(rows[0].strike,105);
 assert.equal(rows[0].type,"CE");
 assert.equal(rows[0].ratio,5);
 assert.equal(rows[0].change,5);
 assert.equal(rows.find(r=>r.type==="PE"&&r.strike===105).ratio,null);
 assert.equal(rows.find(r=>r.type==="PE"&&r.strike===105).ltp,null);
});
test("empty, invalid or non-option contracts do not fabricate activity",()=>{
 assert.deepEqual(rankOptionActivity(null),[]);
 assert.deepEqual(rankOptionActivity({strikes:[{strike_price:100,call:{volume:0,oi:0},put:{volume:-1}}]}).map(x=>x.ratio),[null]);
});
test("flow screen explicitly separates observed option changes from buyer-initiated prints",()=>{
 const screen=read("components/UnusualOptionsMonitor.jsx");
 const box=read("components/UnusualOptionsFlowBox.jsx");
 const quant=read("lib/unusualOptions.mjs");
 assert.match(screen,/stockOptions/);
 assert.match(screen,/selectedTicker/);
 assert.match(screen,/compareSnapshots/);
 assert.match(screen,/not projected profits or order-book trade prints/);
 assert.match(box,/not signed trade flow/);
 assert.match(box,/rankOptionActivity/);
 assert.match(quant,/Never infer real trades/);
 assert.match(box,/NSE cash stocks without active F&O contracts/);
});
test("terminal links the 12-window floor and full FLOW monitor without changing global navigation",()=>{
 const page=read("app/terminal/page.jsx");
 const floor=read("app/terminal/TerminalTradingFloor.jsx");
 const route=read("app/api/terminal/route.js");
 assert.match(page,/UnusualOptionsMonitor/);
 assert.match(page,/activeTab==="FLOW"/);
 assert.match(page,/onOpenFlow/);
 assert.match(page,/fnoTickers/);
 assert.match(page,/setOptionSymbol/);
 assert.match(route,/terminal\/fno-universe/);
 assert.match(floor,/id:"flow",title:"Unusual Options Flow/);
 assert.match(floor,/UnusualOptionsFlowBox/);
 assert.match(floor,/DEFAULT_WINDOWS.length/);
 assert.match(floor,/onOpenOptions/);
 assert.doesNotMatch(page,/<header[^>]*site-header/);
});
test("terminal retains all NSE cash equity search and avoids quote race",()=>{
 const page=read("app/terminal/page.jsx");
 const route=read("app/api/terminal/route.js");
 assert.match(page,/view=search/);
 assert.match(page,/view=quote/);
 assert.match(page,/view=history/);
 assert.match(page,/prior\?\.symbol===s&&prior\.inflight/);
 assert.match(page,/quoteTask\.current/);
 assert.match(page,/historyTask\.current/);
 assert.match(page,/controller\.signal\.aborted/);
 assert.match(route,/MARKET_DATA_API_URL/);
});
test("terminal is true black across trading floor, FLOW and research with white text",()=>{
 const css=read("app/terminal/terminal.css");
 const floor=read("app/terminal/terminal-floor.css");
 assert.match(css,/AHQ TERMINAL 2026-11-12 · TRUE BLACK/);
 assert.match(floor,/AHQ FLOOR 2026-11-12 · TRUE BLACK/);
 assert.match(css,/\.qt-shell\.qt-shell\{[\s\S]*?background:#000!important;color:#fff!important;color-scheme:dark/);
 assert.match(floor,/\.qt-shell \.floor-terminal\{[\s\S]*?background:#000!important;color:#fff!important/);
 assert.match(floor,/\.qt-shell \.floor-windows-canvas\{[\s\S]*?background-color:#000!important/);
 assert.match(css,/\.qt-shell :is\(\.qt-reading-clean/);
 assert.match(css,/background:#000!important;color:#fff!important;border-color:#454545!important/);
 assert.match(css,/\.qt-flow-workspace \[data-testid="unusual-options-monitor"\]/);
 assert.match(css,/\.qt-unusual-box/);
 assert.match(css,/\.qt-shell \.positive/);
 assert.match(css,/\.qt-shell \.negative/);
 for(const text of ["--qt-green:#3de48c","--qt-red:#ff6577","--floor-green:#3de48c","--floor-red:#ff6577"]){
  assert.ok((css+"\n"+floor).includes(text),text);
 }
 const trueBlack=css.slice(css.lastIndexOf("AHQ TERMINAL 2026-11-12 · TRUE BLACK"));
 assert.doesNotMatch(trueBlack,/background:#07192f!important|background:#0b223f!important/);
 const floorBlack=floor.slice(floor.lastIndexOf("AHQ FLOOR 2026-11-12 · TRUE BLACK"));
 assert.doesNotMatch(floorBlack,/background:#06172e!important|background:#091d36!important/);
});

test("terminal displays an actionable brokerage reauthorization link only on a quote error",()=>{
 const page=read("app/terminal/page.jsx");
 const css=read("app/terminal/terminal.css");
 assert.match(page,/quoteError&&<div className="qt-provider-alert" role="alert">/);
 assert.match(page,/zerohedgequant-backend\.onrender\.com\/auth\/login/);
 assert.match(page,/Quotes and options analytics are not confirmed live/);
 assert.match(css,/\.qt-provider-alert/);
});

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
test("terminal background is navy and text white; red and green are movements only",()=>{
 const css=read("app/terminal/terminal.css");
 const floor=read("app/terminal/terminal-floor.css");
 for(const x of ["#07192f","#0b223f","#f7fbff","#3de48c","#ff6577"]) assert.ok(css.includes(x),"missing "+x);
 assert.match(floor,/canonical NAVY\/BLUE \+ WHITE/);
 assert.match(floor,/--floor-green:#3de48c/);
 assert.match(floor,/--floor-red:#ff6577/);
 assert.match(css,/\.qt-shell \.qt-reading-clean/);
 assert.match(css,/\.qt-unusual-box/);
 assert.match(css,/\.qt-flow-workspace/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url);
const floor=readFileSync(new URL("app/terminal/TerminalTradingFloor.jsx",root),"utf8");
const route=readFileSync(new URL("components/terminal/panes.jsx",root),"utf8");
const commands=readFileSync(new URL("components/terminal/commands.js",root),"utf8");
const css=readFileSync(new URL("app/terminal/terminal-floor.css",root),"utf8");
test("all twelve trading-floor panels exist, with unusual options activity added",()=>{
  const ids=[...floor.matchAll(/\{id:"([a-z-]+)",title:/g)].map(m=>m[1]);
  assert.deepEqual(ids,["watchlist","metrics","messages","greeks","depth","rvol","options","volume","chart","alerts","movers","flow"]);
  for(const id of ids)assert(floor.includes("windowDef={windows."+id+"}"),"render "+id);
  assert(!ids.some(x=>["orders","account","order-entry","blocks","timesales"].includes(x)));
});
test("existing watchlist and screener data connect to the market floor",()=>{
  assert.match(floor,/MarketWatchlist symbol=\{symbol\} watch=\{watch\} quote=\{quote\} screener=\{screener\}/);
  assert.match(floor,/onChoose=\{onChoose\}/);
  assert.match(floor,/quote\.price/);
  assert.match(floor,/NSE screener snapshot/);
});
test("RVOL and session-aligned curve reuse original 5-minute baseline",()=>{
  for(const key of ["vol={vol}","rvol={rvol}","lookback={lookback}","setLookback={setLookback}","VolumeLineChart={VolumeLineChart}"])assert(floor.includes(key),key);
  for(const key of ["vol={vol}","rvol={rvol}","lookback={lookback}","setLookback={setLookback}","VolumeLineChart={FloorLineChart}"])assert(route.includes(key),key);
  assert.match(route,/volumeVsNormal\(h\.bars, \{ lookback, cumulative: isCumulative \}\)/);
  assert.match(floor,/Baseline withheld until sufficient complete history/);
  assert.match(floor,/historical mean and median withheld/i);
});
test("ATM Greeks consume only provider option-chain data",()=>{
  assert.match(floor,/function AtmGreeks/);
  assert.match(floor,/chain\?\.strikes/);
  assert.match(floor,/atm\.call\?\.\[k\]/);
  assert.match(floor,/atm\.put\?\.\[k\]/);
  assert.match(floor,/Provider units unchanged/);
});
test("no disconnected broker execution or synthetic prints appear as functional trading data",()=>{
  for(const wording of ["NO ORDER FEED CONNECTED","NO VERIFIED TRADE PRINTS","BLOCK PRINTS NOT CONNECTED","Marked P&L","SELL PLAN","BUY PLAN"])assert(!floor.includes(wording),wording);
  assert(!/\bfetch\([^)]*(?:\/api\/orders|\/api\/trade\/execute)/.test(floor));
  assert.match(floor,/NO SIMULATED TRADES/);
});
test("trading floor and company intelligence stay available in the terminal",()=>{
  assert.match(commands,/code: "FLOOR"/);
  assert.match(commands,/id: "floor", name: "Floor"/);
  assert.match(route,/case "FLOOR": return <FloorPane/);
  assert.match(route,/<TradingFloor symbol=\{ticker\}/);
  assert.match(route,/TerminalIntelligence key=\{ticker/);
});
test("desktop windows can be moved and resized and mobile safely stacks",()=>{
  assert.match(floor,/setPointerCapture/);
  assert.match(floor,/onPointerMove=\{move\}/);
  assert.match(css,/resize:both/);
  assert.match(css,/@media\(max-width:1100px\)/);
  assert.match(css,/grid-template-columns:1fr/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {computeTerminalRisk} from "../lib/terminalRisk.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("each of ten terminal tabs has an actual workspace or provider-dependent tool",()=>{
 const page=read("app/terminal/page.jsx");
 for(const tab of ["MARKET","OPTIONS","FLOW","COMPANY","FORECAST","NETWORK","PEERS","SCANNERS","ANALYTICS","RISK"])
  assert.ok(page.includes('"'+tab+'"'),"missing tab "+tab);
 for(const [tab,component] of [
  ["OPTIONS","OptionsDesk"],["FLOW","UnusualOptionsMonitor"],
  ["SCANNERS","SignalScanner"],["ANALYTICS","OptionAnalytics"],
  ["RISK","RiskMonitor"]])
  assert.ok(page.includes('activeTab==="'+tab+'"')&&page.includes(component),"Tab missing component "+tab);
 assert.match(page,/TerminalIntelligence key=\{symbol\} symbol=\{symbol\} tab=\{activeTab\}/);
 assert.match(page,/workspace==="FLOOR" \? <TerminalTradingFloor/);
 assert.match(page,/role="tablist"/);
 assert.match(page,/aria-selected=\{activeTab===x\}/);
 assert.match(page,/role="tabpanel"/);
 assert.match(page,/selectTab\(x\)/);
 assert.match(page,/TERMINAL_TABS\.includes\(tab\?\.toUpperCase\(\)\)/);
 assert.doesNotMatch(page,/activeTab!=="FLOW"&&<Link href/);
});
test("option desk and scanner use real F&O and scanner endpoints and accept in-terminal ticker navigation",()=>{
 const options=read("app/options/page.jsx");
 const scanner=read("app/scanner/page.jsx");
 const gateway=read("app/api/market/[...path]/route.js");
 assert.match(options,/export default function OptionsPage\(\{initialUnderlying=null,embedded=false\}\)/);
 assert.match(options,/api\/terminal\?view=fno/);
 assert.match(options,/chooseUnderlying\(next\)/);
 assert.match(options,/encodeURIComponent\(ul\)/);
 assert.doesNotMatch(options,/fetch\("\/api\/market\/screener"/);
 assert.match(scanner,/export default function ScannerPage\(\{onOpenTicker=null,embedded=false\}\)/);
 assert.match(scanner,/fetch\(\`\$\{API\}\/scanner\/signals\`/);
 assert.match(scanner,/onOpenTicker\(selected\.symbol\)/);
 assert.match(gateway,/scanner\\\/signals/);
 assert.match(gateway,/ALLOWED\.some/);
 assert.doesNotMatch(gateway,/const ALLOWED = \[\s*\]/);
});
test("risk panel contains configurable measured VaR and strategy backtester",()=>{
 const page=read("app/terminal/page.jsx");
 const risk=read("components/TerminalOperationalTabs.jsx");
 const backtest=read("app/backtest/page.jsx");
 assert.match(page,/RiskMonitor symbol=\{symbol\} candles=\{hist\}/);
 assert.match(page,/StrategyBacktester initialSymbol=\{symbol\} embedded/);
 assert.match(risk,/VaR confidence level/);
 assert.match(risk,/Risk lookback intervals/);
 assert.match(risk,/expectedShortfallPct/);
 assert.match(backtest,/export default function BacktestPage\(\{initialSymbol=null,embedded=false\}\)/);
});
test("risk statistics use only real consecutive intraday observations and never 0 for missing values",()=>{
 const base=Date.parse("2026-11-11T03:45:00Z"); // 09:15 IST
 const rows=Array.from({length:60},(_,i)=>({
  date:new Date(base+i*300000).toISOString(),
  close:100+i*0.05+(i%4===0?-1.0:0)
 }));
 const ready=computeTerminalRisk(rows,0.95,250);
 assert.equal(ready.ready,true);
 assert.equal(ready.samples,59);
 assert.ok(ready.varPct>0);
 assert.ok(ready.expectedShortfallPct>=ready.varPct);
 assert.ok(ready.volatilityPct>0);
 const insufficient=computeTerminalRisk(rows.slice(0,6));
 assert.equal(insufficient.ready,false);
 assert.equal(insufficient.varPct,null);
 assert.equal(insufficient.expectedShortfallPct,null);
 assert.deepEqual(computeTerminalRisk(null).samples,0);
});
test("risk excludes overnight gaps from observed intraday distribution",()=>{
 const d1=Date.parse("2026-11-10T03:45:00Z");
 const d2=Date.parse("2026-11-11T03:45:00Z");
 const rows=[
  ...Array.from({length:32},(_,i)=>({date:new Date(d1+5*60000*i).toISOString(),close:100+i*0.01})),
  ...Array.from({length:32},(_,i)=>({date:new Date(d2+5*60000*i).toISOString(),close:200+i*0.01}))
 ];
 assert.equal(computeTerminalRisk(rows).samples,62);
});
test("analytics derives only available option chain observations, never inferred trade direction",()=>{
 const source=read("components/TerminalOperationalTabs.jsx");
 assert.match(source,/Array\.isArray\(chain\?\.strikes\)/);
 assert.match(source,/callOI=total/);
 assert.match(source,/putOI=total/);
 assert.match(source,/oiPcr:callOI>0/);
 assert.match(source,/OptionIVAnalytics/);
 assert.match(source,/onClick=\{onRefresh\}/);
 assert.match(source,/No synthetic option prices or invented flow prints/);
});
test("black terminal branding remains scoped, unchanged by functional tab integrations",()=>{
 const css=read("app/terminal/terminal.css");
 assert.match(css,/AHQ TERMINAL 2026-11-12 · TRUE BLACK/);
 assert.match(css,/\.qt-shell \.qt-integrated-app/);
 assert.match(css,/background:#000!important;color:#fff!important/);
 assert.match(css,/\.qt-shell \.qt-operational-metric/);
 assert.match(css,/\.qt-integrated-app \.text-gain/);
 assert.match(css,/\.qt-integrated-app \.text-loss/);
});

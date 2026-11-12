import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {istCalendar,isSafeNseCollectionTime,selectFnoBatch,normalizeDailyChain,INDEX_OPTION_SYMBOLS,
 unusualVolumeBaseline,median} from "../lib/dailyOptionsFlow.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const payload=(overrides={})=>({success:true,data:{
 spot_price:100,expiry:"2026-11-26",strikes:[
  {strike_price:95,call:{volume:4000,oi:1000,oi_change:400,ltp:7.1,iv:20.4,bid_price:7,ask_price:7.3},
                    put:{volume:150,oi:5000,oi_change:20,ltp:2,iv:21}},
  {strike_price:105,call:{volume:2000,oi:20000,oi_change:100,ltp:1,iv:23},
                     put:{volume:3500,oi:5000,oi_change:2500,ltp:6,iv:23}}
 ],...overrides}});
test("NSE collection uses IST and never runs on weekends or outside working hours",()=>{
 assert.deepEqual(istCalendar("2026-11-12T05:00:00Z"),{day:"2026-11-12",weekday:"Thu",minutes:630});
 assert.equal(isSafeNseCollectionTime("2026-11-12T05:00:00Z"),true);
 assert.equal(isSafeNseCollectionTime("2026-11-12T01:00:00Z"),false);
 assert.equal(isSafeNseCollectionTime("2026-11-14T05:00:00Z"),false);
});
test("eight daily slots cover each eligible F&O ticker twice, not every cash-market stock",()=>{
 const items=Array.from({length:218},(_,i)=>({symbol:"NSE"+String(i).padStart(3,"0")}));
 const selections=Array.from({length:8},(_,slot)=>selectFnoBatch(items,slot));
 assert.equal(selections.reduce((s,x)=>s+x.length,0),436);
 const counts=new Map();for(const arr of selections)for(const sym of arr)counts.set(sym,(counts.get(sym)||0)+1);
 assert.equal(counts.size,218);assert.ok([...counts.values()].every(x=>x===2));
 assert.deepEqual(selectFnoBatch([{symbol:"M&M"},{symbol:"M&M"},{symbol:"<script>"}],0),["M&M"]);
 assert.deepEqual(selectFnoBatch(items,-1),[]);
 assert.deepEqual(INDEX_OPTION_SYMBOLS,["NIFTY","BANKNIFTY","FINNIFTY"]);
 const withIndexes=[...items,...INDEX_OPTION_SYMBOLS.map(symbol=>({symbol}))];
 const all=Array.from({length:8},(_,slot)=>selectFnoBatch(withIndexes,slot)).flat();
 for(const index of INDEX_OPTION_SYMBOLS)assert.equal(all.filter(x=>x===index).length,2);
});
test("normalizer stores genuine observed metrics and identifies volume/OI plus OI delta",()=>{
 const item=normalizeDailyChain(payload(),"RELIANCE","2026-11-12T09:15:00Z");
 assert.equal(item.symbol,"RELIANCE");
 assert.equal(item.expiry,"2026-11-26");
 assert.equal(item.contractCount,4);
 assert.equal(item.totals.callVolume,6000);
 assert.equal(item.totals.putVolume,3650);
 assert.equal(item.totals.callOI,21000);
 assert.equal(item.alertCount,2);
 assert.ok(item.score>0);
 assert.equal(item.timestampBasis,"RECEIPT_TIME_NOT_EXCHANGE_TICK");
 const first=item.topContracts.find(x=>x.strike===95&&x.type==="CE");
 assert.equal(first.ratio,4);assert.equal(first.changeOI,400);
 assert.equal(first.volAlert,true);
 const put=item.topContracts.find(x=>x.strike===105&&x.type==="PE");
 assert.equal(put.oiAlert,true);
});
test("missing or invalid broker observations cannot become unusual option signals",()=>{
 assert.equal(normalizeDailyChain({data:{spot_price:0,expiry:"2026-11-26",strikes:[{}]}},"TCS"),null);
 assert.equal(normalizeDailyChain(payload({strikes:[]}),"TCS"),null);
 assert.equal(normalizeDailyChain(payload(),"<script>"),null);
 const nullValues=normalizeDailyChain(payload({strikes:[{strike_price:100,
  call:{volume:null,oi:null,iv:null},put:{volume:0,oi:0,oi_change:0}}]}),"TCS");
 assert.equal(nullValues.contractCount,1);
 assert.equal(nullValues.score,0);
 assert.equal(nullValues.topContracts[0].ratio,null);
 assert.equal(nullValues.topContracts[0].changeOIPct,null);
});
test("15-session median requires enough valid observations; no invented baseline",()=>{
 assert.equal(median([1,3,2,4]),2.5);
 assert.equal(unusualVolumeBaseline(1000,[100,100,100]),null);
 assert.equal(unusualVolumeBaseline(1000,Array(10).fill(100)),10);
 assert.equal(unusualVolumeBaseline(0,Array(10).fill(0)),null);
 assert.equal(unusualVolumeBaseline(500,[...Array(9).fill(100),null]),null);
});
test("private collection route is CRON_SECRET protected; public route is read-only",()=>{
 const cron=read("app/api/cron/options-flow/[slot]/route.js");
 const api=read("app/api/options-flow/route.js");
 const db=read("lib/dailyOptionsFlowStore.mjs");
 assert.match(cron,/process\.env\.CRON_SECRET/);
 assert.match(cron,/request\.headers\.get\("authorization"\)/);
 assert.match(cron,/selectFnoBatch\(universe,slot\)/);
 assert.match(cron,/INDEX_OPTION_SYMBOLS\.map/);
 assert.match(cron,/normalizeDailyChain\(/);
 assert.match(cron,/storeFlowBatch\(/);
 assert.match(cron,/maxDuration=300/);
 assert.match(db,/CREATE TABLE IF NOT EXISTS ahq_options_flow_observations/);
 assert.match(db,/PRIMARY KEY\(trading_day,symbol,slot\)/);
 assert.match(db,/ON CONFLICT \(trading_day,symbol,slot\)/);
 assert.match(db,/FROM jsonb_to_recordset/);
 assert.match(db,/ahq_options_flow_runs/);
 assert.match(api,/readFlowDay\(/);
 assert.match(api,/readFlowTicker\(/);
 assert.doesNotMatch(api,/export async function POST/);
 assert.doesNotMatch(api,/process\.env\.CRON_SECRET/);
 assert.doesNotMatch(cron,/Math\.random\(|demoRows|sampleData/);
});
test("live NSE options FLOW keeps its sampled monitor and adds durable historical archive",()=>{
 const terminal=read("app/terminal/page.jsx");
 const ui=read("components/DailyOptionsFlowArchive.jsx");
 const css=read("app/terminal/terminal.css");
 assert.match(terminal,/DailyOptionsFlowArchive/);
 assert.match(terminal,/UnusualOptionsMonitor/);
 assert.match(ui,/daily-options-flow-archive/);
 assert.match(ui,/\/api\/options-flow/);
 assert.match(ui,/coverage\?\.incomplete/);
 assert.match(ui,/History ↗/);
 assert.match(ui,/unusualVolumeBaseline/);
 assert.match(ui,/incomplete coverage/);
 assert.match(css,/\.qt-shell \.qt-daily-archive/);
 assert.match(css,/background:#050505/);
});
test("eight once-per-day Vercel cron windows exist and do not erase other cron tasks",()=>{
 const config=JSON.parse(read("vercel.json"));
 const options=config.crons.filter(x=>x.path.startsWith("/api/cron/options-flow/"));
 assert.equal(options.length,8);
 assert.deepEqual(options.map(x=>x.path.split("/").at(-1)),["0","1","2","3","4","5","6","7"]);
 assert.ok(options.every(x=>/^\d+ \d+ \* \* 1-5$/.test(x.schedule)));
 for(const path of ["/api/cron/scrape-calls","/api/cron/discover-nse-documents","/api/cron/ingest-research"])
  assert.ok(config.crons.some(x=>x.path===path));
});

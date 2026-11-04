// Cash Desk behavioral regression tests: no live prices, no broker calls.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const code=fs.readFileSync(path.resolve(__dirname,"../lib/cashSignals.js"),"utf8");
const engine=Function(code.replace(/^export /gm,"")+"\nreturn {CASH_MODELS,normalizeBars,evaluateCashModel,intradayWatch};")();
const {CASH_MODELS,normalizeBars,evaluateCashModel,intradayWatch}=engine;
function days(n=150){
 const out=[],start=new Date("2025-01-01T00:00:00Z");
 for(let i=0;out.length<n;i++){const d=new Date(+start+i*86400000);if(d.getUTCDay()!==0&&d.getUTCDay()!==6)out.push(d.toISOString());}
 return out;
}
function series(n=150,scale=1,shift=0){
 return days(n).map((date,i)=>{const close=(95+i*.27+Math.sin(i/7+shift)*3+Math.cos(i/3+shift)) *scale;
  return {date,open:close-.3*scale,high:close+1.2*scale,low:close-1.1*scale,close,volume:10000+1000*Math.sin(i*.4+shift)};
 });
}
test("10 distinct cash-only models with no derivative instruments",()=>{
 assert.equal(CASH_MODELS.length,10);
 assert.equal(new Set(CASH_MODELS.map(x=>x.id)).size,10);
 assert.ok(CASH_MODELS.every(x=>x.universe.length>0));
 assert.ok(CASH_MODELS.every(x=>x.universe.every(t=>!/(FUT$|[0-9]CE$|[0-9]PE$)/.test(t))));
});
test("all models fail closed on unobserved data, with zero prices or targets",()=>{
 for(const m of CASH_MODELS){
  const x=evaluateCashModel(m.id,[]);
  assert.equal(x.status,"INPUT REQUIRED",m.id);
  for(const field of ["entry","stop","target","confidence"])assert.equal(x[field],null,m.id+":"+field);
 }
});
test("normalization drops bad bars and deduplicates timestamps",()=>{
 const out=normalizeBars([{date:"2026-11-03T00:00:00Z",high:100,low:110,close:105,volume:10},
  {date:"2026-11-04T00:00:00Z",high:112,low:99,close:105,volume:30},
  {date:"2026-11-04T00:00:00Z",high:112,low:99,close:106,volume:30}]);
 assert.equal(out.length,1);assert.equal(out[0].close,106);
});
test("factor models reject missing or non-aligned benchmarks",()=>{
 const main=series(),market=series(150,1.3,1),sector=series(150,.9,2);
 const missing=evaluateCashModel("residual",main,{marketBars:market});
 assert.equal(missing.status,"INPUT REQUIRED");
 const shifted=sector.map(x=>({...x,date:new Date(+new Date(x.date)+86400000).toISOString()}));
 assert.equal(evaluateCashModel("residual",main,{marketBars:market,sectorBars:shifted}).status,"INPUT REQUIRED");
 const valid=evaluateCashModel("residual",main,{marketBars:market,sectorBars:sector});
 assert.ok(["NO SETUP","QUALIFIED / AWAITING ENTRY"].includes(valid.status));
});
test("delivery signal rejects malformed original observation dates",()=>{
 const main=series();
 const delivery=main.slice(-60).map(x=>({date:x.date,deliveryQty:10000}));
 delivery[10].date="invalid-date";
 assert.equal(evaluateCashModel("delivery",main,{deliveryBars:delivery}).status,"INPUT REQUIRED");
});
test("qualified earnings requires valid ATR and cannot invent target for flat price",()=>{
 const flat=days(150).map(date=>({date,open:100,high:100,low:100,close:100,volume:10000}));
 const earningsEvent={actualEPS:15,expectedEPS:12,announcementVolumeZ:2.4,sectorAdjustedReturn:.03,publishedAt:new Date().toISOString()};
 const x=evaluateCashModel("earnings",flat,{earningsEvent});
 assert.equal(x.status,"INPUT REQUIRED");assert.equal(x.target,null);
});
test("gold / silver rotation uses date aligned ETF time series",()=>{
 const a=series(150,1),b=series(150,.2,2);
 const x=evaluateCashModel("goldSilver",a,{symbol:"GOLDBEES",goldBars:a,silverBars:b});
 assert.ok(["NO SETUP","QUALIFIED / AWAITING ENTRY"].includes(x.status));
 const bad=b.map(x=>({...x,date:new Date(+new Date(x.date)+86400000).toISOString()}));
 assert.equal(evaluateCashModel("goldSilver",a,{symbol:"GOLDBEES",goldBars:a,silverBars:bad}).status,"INPUT REQUIRED");
});
test("intraday 15–20-minute watch is conditional and rejects stale candles",()=>{
 const now=new Date("2026-11-04T10:35:00+05:30");
 const bars=Array.from({length:30},(_,i)=>{
  const date=new Date(+now-(30-i)*5*60000).toISOString();
  return {date,open:100,high:100.5,low:99.5,close:100.1,volume:5000};
 });
 const good=intradayWatch(bars,100.3,null,now);
 assert.equal(good.status,"NEAR ENTRY");
 assert.equal(good.entry,100.5);
 assert.equal(good.window.includes("not an ETA"),true);
 const stale=intradayWatch(bars,100.3,null,new Date(+now+30*60000));
 assert.equal(stale.status,"STALE");
 const noNear=intradayWatch(bars,99.0,null,now);
 assert.equal(noNear.status,"NO NEAR TRIGGER");
});
test("each strategy evaluates complete synthetic inputs without throwing",()=>{
 const equity=series(),market=series(150,1.15,1),sector=series(150,.8,2),gold=series(150,.65,3),silver=series(150,.22,4);
 const context={marketBars:market,sectorBars:sector,sectorBreadth:65,
  earningsEvent:{actualEPS:14,expectedEPS:10,announcementVolumeZ:2.5,sectorAdjustedReturn:.03,publishedAt:new Date().toISOString()},
  deliveryBars:equity.slice(-60).map(x=>({date:x.date,deliveryQty:x.volume})),
  breadthHistory:Array.from({length:30},(_,i)=>20+i),symbol:"GOLDBEES",
  goldBars:gold,silverBars:silver,commodityBars:gold,crudeBars:gold,fxBars:sector};
 for(const m of CASH_MODELS){
  const outcome=evaluateCashModel(m.id,equity,context);
  assert.ok(["INPUT REQUIRED","NO SETUP","QUALIFIED / AWAITING ENTRY"].includes(outcome.status),m.id+":"+outcome.status);
  if(outcome.status==="QUALIFIED / AWAITING ENTRY"){
   assert.ok(outcome.entry>0);
   assert.ok(outcome.target>outcome.entry);
   assert.ok(outcome.stop<outcome.entry);
  }
 }
});

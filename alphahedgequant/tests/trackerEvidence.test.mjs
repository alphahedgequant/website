import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {aggregateCallOutcomes,wilsonLowerBound,MIN_RANKED_CALLS} from "../lib/trackerMetrics.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const call=(house,analyst,verified,rating="BUY")=>({
 house,analyst_name:analyst,verification_status:verified?"verified":"unverified",rating
});
const success=c=>({resolved:c.rating!=="HOLD",madeMoney:true,returnPct:5,targetHit:true});
test("Wilson bound penalizes tiny samples and never masquerades as 100% certainty",()=>{
 assert.equal(wilsonLowerBound(0,0),null);
 assert.ok(wilsonLowerBound(5,5)<.6);
 assert.ok(wilsonLowerBound(90,100)>.8);
 assert.ok(wilsonLowerBound(20,20)>wilsonLowerBound(5,5));
 assert.equal(MIN_RANKED_CALLS,10);
});
test("do not rank source-unverified or unresolved calls, even if win rate appears high",()=>{
 const rows=[...Array.from({length:5},()=>call("Firm A","Analyst A",true)),
  ...Array.from({length:50},()=>call("Firm A","Analyst A",false)),
  ...Array.from({length:20},()=>call("Firm B","Analyst B",true))];
 const data=aggregateCallOutcomes(rows,success);
 const a=data.leaderboard.find(x=>x.house==="Firm A");
 const b=data.leaderboard.find(x=>x.house==="Firm B");
 assert.equal(a.totalCalls,55);assert.equal(a.verifiedCalls,5);
 assert.equal(a.resolvedCalls,5);assert.equal(a.trustScore,null);
 assert.equal(a.rankEligible,false);
 assert.equal(b.rankEligible,true);
 assert.equal(data.leaderboard[0].house,"Firm B");
 assert.equal(data.analysts.length,2);
});
test("rank compares sample-adjusted lower bound, not raw percentage alone",()=>{
 const perfect=Array.from({length:10},()=>call("Small Firm","Alice",true));
 const larger=Array.from({length:100},()=>call("Larger Firm","Bob",true));
 const data=aggregateCallOutcomes([...perfect,...larger],(c)=>{
  if(c.house==="Small Firm")return{resolved:true,madeMoney:true,targetHit:true,returnPct:2};
  // 85 wins out of 100; deterministic mocked evidence.
  const idx=larger.indexOf(c);
  return{resolved:true,madeMoney:idx<85,targetHit:idx<80,returnPct:idx<85?3:-6};
 });
 assert.equal(data.leaderboard.find(x=>x.house==="Small Firm").winRate,100);
 assert.equal(data.leaderboard.find(x=>x.house==="Larger Firm").winRate,85);
 assert.equal(data.leaderboard[0].house,"Larger Firm");
});
test("HOLD outcomes and missing price evidence do not become directional returns or target hits",()=>{
 const rows=[call("Firm C","",true,"HOLD"),call("Firm C","",true,"BUY")];
 const res=aggregateCallOutcomes(rows,c=>c.rating==="HOLD"?
  {resolved:false,status:"hold_unscored"}:{resolved:true,madeMoney:false,targetHit:null,returnPct:-5});
 const row=res.leaderboard[0];
 assert.equal(row.verifiedCalls,2);
 assert.equal(row.resolvedCalls,1);
 assert.equal(row.targetHitRate,null);
 assert.equal(row.targetEvidenceCount,0);
 assert.equal(row.avgReturn,-5);
 assert.equal(row.winRate,0);
});
test("public leaderboard filters out pending records; public calls respond only with reviewed records",()=>{
 const lb=read("app/api/tracker/leaderboard/route.js");
 const calls=read("app/api/tracker/calls/route.js");
 const middle=read("middleware.js");
 assert.match(lb,/verification_status='verified'/);
 assert.match(lb,/aggregateCallOutcomes/);
 assert.match(lb,/Math\.min\(6,symbols\.length\)/);
 assert.match(calls,/verification_status='verified' OR/);
 assert.match(calls,/isEditor/);
 assert.match(calls,/Cache-Control":"private,no-store/);
 assert.match(middle,/"\/tracker"/);
 assert.match(middle,/"\/api\/tracker\/leaderboard"/);
 assert.match(middle,/"\/api\/tracker\/calls\(\.\*\)"/);
 assert.doesNotMatch(middle,/"\/tracker\/discovery"/);
});
test("editor review requires original evidence acknowledgement, guarded approval, and reversible audit trail",()=>{
 const review=read("app/api/tracker/calls/[id]/route.js");
 const add=read("app/api/tracker/calls/route.js");
 const role=read("app/api/tracker/editor/route.js");
 assert.match(review,/async function editorError/);
 assert.match(review,/body\.confirmedSource!==true/);
 assert.match(review,/verified_at/);
 assert.match(review,/verified_by/);
 assert.match(review,/deleted_at=NOW\(\)/);
 assert.match(review,/deleted_by/);
 assert.doesNotMatch(review,/DELETE FROM analyst_calls/);
 assert.match(add,/verification_status/);
 assert.match(add,/source_url/);
 assert.match(add,/RETURNING \*/);
 assert.match(role,/currentUser/);
 assert.match(role,/isInsightsOwner/);
 assert.match(role,/canEdit/);
 assert.doesNotMatch(role,/emailAddresses.*JSON\.stringify/);
});
test("source-attributed readable histories and firm/analyst filters are interactive on mobile",()=>{
 const page=read("app/tracker/page.jsx");
 const css=read("app/tracker/tracker.css");
 const seo=read("app/tracker/layout.jsx");
 const site=read("app/sitemap.js");
 for(const term of ["Original publication","Individual analyst outcomes","Research firm outcomes",
  "Recommendation evidence log","aria-selected","Confirm that you personally examined",
  "Sample eligible","Limited sample","Source reviewed"])
  assert.ok(page.includes(term),term);
 assert.match(page,/Source review recorded/);
 assert.match(page,/onClick=\{\(\)=>setSelected\(h\)\}/);
 assert.match(page,/onClick=\{\(\)=>onReview\(call\)\}/);
 assert.match(page,/onClick=\{\(\)=>onDelete\(call\)\}/);
 assert.match(css,/--tt-bg:#090c13/);
 assert.match(css,/html\[data-theme="light"\] \.tt-page/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(seo,/canonical:"\/tracker"/);
 assert.match(site,/"\/tracker"/);
});
test("never describe public confidence score as official PaRRVA/regulator-verified or guarantee results",()=>{
 const page=read("app/tracker/page.jsx");
 const scoring=read("lib/trackerMetrics.mjs");
 assert.match(page,/not a SEBI\/PaRRVA-certified performance record/);
 assert.match(scoring,/not regulator\/PaRRVA-verified/);
 assert.doesNotMatch(page,/Very Poor|Excellent|credit-score-style|Who Can You Trust/);
});

test("historical target hits never count publication-day highs or missing OHLC as factual hits",()=>{
 const scoring=read("lib/trackerScoring.js");
 assert.match(scoring,/afterPublication=path\.filter\(b=>utcDay\(b\.date\)>start\)/);
 assert.match(scoring,/v!==null&&v!==undefined&&v!==""/);
 assert.match(scoring,/afterPublication\.every\(b=>usable\(b\.high\)&&usable\(b\.low\)\)/);
 assert.match(scoring,/const verifiedHit=hit/);
});

test("new tracked calls require source-specified horizons and reject duplicate reports",()=>{
 const add=read("app/api/tracker/calls/route.js");
 const ui=read("app/tracker/page.jsx");
 assert.match(add,/const duplicate=await sql/);
 assert.match(add,/source_url=\$\{verifiedSource\}/);
 assert.match(add,/status:409/);
 assert.doesNotMatch(add,/horizon_days = 365, note/);
 assert.match(ui,/horizon_days:"",source_url/);
 assert.match(ui,/Published horizon \(days\)/);
});

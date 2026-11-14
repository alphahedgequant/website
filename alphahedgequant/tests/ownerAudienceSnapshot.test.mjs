import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseHistoricalAudienceSnapshot} from "../lib/ownerAudienceSnapshot.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("historical figures remain accurate, dated, and valid",()=>{
 const sample=JSON.stringify({traffic:327643,registeredAccounts:54879,dau:9348,period:"2026-09",approxDaysBefore:"2026-11-14"});
 assert.deepEqual(parseHistoricalAudienceSnapshot(sample),{
  traffic:327643,registeredAccounts:54879,dau:9348,
  period:"2026-09",relativeTo:"2026-11-14"
 });
 assert.equal(parseHistoricalAudienceSnapshot(undefined),null);
 for(const invalid of [
  JSON.stringify({traffic:"327643",registeredAccounts:54879,dau:9348,period:"2026-09",approxDaysBefore:"2026-11-14"}),
  JSON.stringify({traffic:327643,registeredAccounts:54879,dau:-9348,period:"2026-09",approxDaysBefore:"2026-11-14"}),
  JSON.stringify({traffic:327643,registeredAccounts:54879,dau:9348,period:"2026-11",approxDaysBefore:"2026-11-14"}),
  JSON.stringify({traffic:327643,registeredAccounts:54879,dau:9348,period:"2026-09",approxDaysBefore:"2026-11-35"}),
 ])assert.equal(parseHistoricalAudienceSnapshot(invalid),null);
});

test("only signed-in owner receives dated historical analytics section",()=>{
 const page=read("app/admin/analytics/page.jsx");
 const privateCheck=page.indexOf("if(!await isInsightsOwner())notFound()");
 const historicRead=page.indexOf("process.env.AHQ_HISTORICAL_AUDIENCE_SNAPSHOT");
 assert.ok(privateCheck>=0 && historicRead>privateCheck);
 assert.match(page,/return <OwnerInsightsDashboard historical=\{historical\}\/>/);
 assert.match(page,/robots:\{index:false,follow:false\}/);
 assert.doesNotMatch(page,/AHQ_OWNER_REPORTED_AUDIENCE_SNAPSHOT|ownerReported|parseOwnerAudienceSnapshot/);
 assert.doesNotMatch(page,/327643|54879|9348/);
});

test("retain only the three historical metric cards without their removed descriptions",()=>{
 const dashboard=read("components/OwnerInsightsDashboard.jsx");
 assert.match(dashboard,/historical&&<section/);
 assert.match(dashboard,/Historical website audience snapshot/);
 assert.match(dashboard,/September 2026 baseline/);
 assert.match(dashboard,/Site traffic · page views \/ visitors/);
 assert.match(dashboard,/Registered accounts/);
 assert.match(dashboard,/Daily active users/);
 assert.match(dashboard,/value=\{nf\(historical\.traffic\)\}/);
 assert.match(dashboard,/value=\{nf\(historical\.registeredAccounts\)\}/);
 assert.match(dashboard,/value=\{nf\(historical\.dau\)\}/);
 assert.doesNotMatch(dashboard,/Combined historical traffic figure|Historical account total|Historical daily activity/);
 assert.doesNotMatch(dashboard,/Historical snapshot for approximately September 2026/);
 assert.doesNotMatch(dashboard,/unique visitors and page views are not separately specified/);
 assert.doesNotMatch(dashboard,/Today's live visitor, account and activity counters remain below/);
});

test("November audience snapshot and all its accompanying text are absent",()=>{
 const dashboard=read("components/OwnerInsightsDashboard.jsx");
 const page=read("app/admin/analytics/page.jsx");
 for(const removed of [
  "November 2026 audience snapshot",
  "Audience snapshot · November 2026",
  "TOTAL USERS · SNAPSHOT",
  "Total users · snapshot",
  "Daily active users · snapshot",
  "Saved total · distinct from live Clerk account counts",
  "Saved daily count · distinct from live DAU",
  "Saved snapshots are dated reference points",
  "ownerReported"
 ]){
  assert.ok(!dashboard.toLowerCase().includes(removed.toLowerCase()),removed);
  assert.ok(!page.toLowerCase().includes(removed.toLowerCase()),removed);
 }
});

test("real-time visitor, Clerk account and analytics chart computations are unchanged",()=>{
 const dashboard=read("components/OwnerInsightsDashboard.jsx");
 const api=read("app/api/admin/analytics/route.js");
 assert.match(dashboard,/DAU · today \(IST\)/);
 assert.match(dashboard,/knownCount\(o\.registered_users_total\)/);
 assert.match(dashboard,/nf\(o\.dau\)/);
 assert.match(dashboard,/Visitor trend/);
 assert.match(dashboard,/Most-used functions/);
 assert.match(dashboard,/loading\?<p role="status"/);
 assert.match(dashboard,/error\?<div role="alert"/);
 assert.match(dashboard,/foot&&<p/);
 assert.match(api,/client\.users\.getCount\(\)/);
 assert.match(api,/COUNT\(DISTINCT visitor_hash\).*AS dau/);
 assert.doesNotMatch(api,/327643|54879|9348|287000|6348/);
 assert.doesNotMatch(dashboard,/327643|54879|9348|287000|6348/);
});

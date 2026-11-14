import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseOwnerAudienceSnapshot,parseHistoricalAudienceSnapshot} from "../lib/ownerAudienceSnapshot.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("owner supplied counts parse exactly without claiming measured analytics",()=>{
 const reference=parseOwnerAudienceSnapshot(JSON.stringify({totalUsers:287000,dau:6348,asOf:"2026-11-14"}));
 assert.deepEqual(reference,{totalUsers:287000,dau:6348,asOf:"2026-11-14",source:"Owner-provided"});
});

test("invalid snapshots and missing production config never turn into fake zeros",()=>{
 const values=[undefined,"",null,"oops","[]","{}",JSON.stringify({totalUsers:287000,dau:"6348",asOf:"2026-11-14"}),JSON.stringify({totalUsers:-1,dau:0,asOf:"2026-11-14"}),JSON.stringify({totalUsers:3.2,dau:2,asOf:"2026-11-14"}),JSON.stringify({totalUsers:10,dau:20,asOf:"2026-02-30"})];
 for(const x of values)assert.equal(parseOwnerAudienceSnapshot(x),null,String(x));
});

test("owner-only server page reads privately configured snapshot strictly after authorization",()=>{
 const page=read("app/admin/analytics/page.jsx");
 const adminCheck=page.indexOf("if(!await isInsightsOwner())notFound()");
 const envRead=page.indexOf("process.env.AHQ_OWNER_REPORTED_AUDIENCE_SNAPSHOT");
 assert.ok(adminCheck>=0&&envRead>adminCheck,"no snapshot must be read/rendered for unauthorized visitors");
 assert.match(page,/return <OwnerInsightsDashboard ownerReported=\{ownerReported\} historical=\{historical\}\/>/);
 assert.doesNotMatch(page,/287000|6348|2,87,000|6,348/);
 assert.match(page,/robots:\{index:false,follow:false\}/);
});

test("owner reference is distinct from live database and Clerk counts, trends and CSV exports",()=>{
 const ui=read("components/OwnerInsightsDashboard.jsx");
 const api=read("app/api/admin/analytics/route.js");
 assert.match(ui,/November 2026 audience snapshot/);
 assert.match(ui,/value=\{nf\(ownerReported.totalUsers\)\}/);
 assert.match(ui,/value=\{nf\(ownerReported.dau\)\}/);
 assert.match(ui,/distinct from live Clerk account counts/);
 assert.match(ui,/distinct from live DAU/);
 assert.match(ui,/Saved snapshots are dated reference points/);
 assert.match(ui,/DAU · today \(IST\)/);
 assert.match(ui,/knownCount\(o.registered_users_total\)/);
 assert.match(ui,/nf\(o.dau\)/);
 assert.match(ui,/loading\?<p role="status"/);
 assert.match(ui,/error\?<div role="alert"/);
 assert.match(api,/client.users.getCount\(\)/);
 assert.match(api,/COUNT\(DISTINCT visitor_hash\).*AS dau/);
 assert.doesNotMatch(ui,/287000|6348|2,87,000|6,348/);
 assert.doesNotMatch(api,/287000|6348/);
});


test("historical snapshot preserves the three supplied counts and only month-level timing",()=>{
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

test("historical traffic is one combined metric, not invented page views plus unique visitors",()=>{
 const page=read("app/admin/analytics/page.jsx");
 const dashboard=read("components/OwnerInsightsDashboard.jsx");
 const api=read("app/api/admin/analytics/route.js");
 const secureCheck=page.indexOf("if(!await isInsightsOwner())notFound()");
 const envAccess=page.indexOf("process.env.AHQ_HISTORICAL_AUDIENCE_SNAPSHOT");
 assert.ok(secureCheck>=0&&envAccess>secureCheck);
 assert.match(dashboard,/Historical website audience snapshot/);
 assert.match(dashboard,/September 2026 baseline/);
 assert.match(dashboard,/Approx\. 60 days before 14 Nov 2026/);
 assert.match(dashboard,/Site traffic · page views \/ visitors/);
 assert.match(dashboard,/nf\(historical\.traffic\)/);
 assert.match(dashboard,/nf\(historical\.registeredAccounts\)/);
 assert.match(dashboard,/nf\(historical\.dau\)/);
 assert.match(dashboard,/unique visitors and page views are not separately specified/);
 assert.match(dashboard,/Today's live visitor, account and activity counters remain below/);
 assert.doesNotMatch(dashboard,/327643|54879|9348|3,27,643|54,879|9,348/);
 assert.doesNotMatch(page,/327643|54879|9348/);
 assert.doesNotMatch(api,/327643|54879|9348/);
});

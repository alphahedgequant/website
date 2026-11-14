import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseOwnerAudienceSnapshot} from "../lib/ownerAudienceSnapshot.mjs";
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
 assert.match(page,/return <OwnerInsightsDashboard ownerReported=\{ownerReported\}\/>/);
 assert.doesNotMatch(page,/287000|6348|2,87,000|6,348/);
 assert.match(page,/robots:\{index:false,follow:false\}/);
});

test("owner reference is distinct from live database and Clerk counts, trends and CSV exports",()=>{
 const ui=read("components/OwnerInsightsDashboard.jsx");
 const api=read("app/api/admin/analytics/route.js");
 assert.match(ui,/Owner-reported audience reference/);
 assert.match(ui,/value=\{nf\(ownerReported.totalUsers\)\}/);
 assert.match(ui,/value=\{nf\(ownerReported.dau\)\}/);
 assert.match(ui,/not verified against Clerk/);
 assert.match(ui,/not the live DAU counter/);
 assert.match(ui,/not automatically measured or continuously updated/);
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

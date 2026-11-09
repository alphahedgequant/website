import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ipoFreshness} from "../lib/ipoFreshness.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("gate 1: protected routes, authenticated user data and admin privileges remain protected",()=>{
 const middleware=read("middleware.js");
 assert.match(middleware,/await auth.protect\(\)/);
 assert.doesNotMatch(middleware,/\/api\/admin\/analytics/);
 const progress=read("app/api/learn/progress/route.js");
 assert.match(progress,/const \{userId\}=await auth\(\)/);
 assert.match(progress,/Cache-Control":"private,no-store/);
 const owner=read("lib/insightsOwnerAccess.mjs");
 assert.match(owner,/verification\?\.status==="verified"/);
 const cron=read("app/api/cron/ingest-research/route.js");
 assert.match(cron,/process\.env\.CRON_SECRET/);
 assert.match(cron,/authorization/);
});
test("gate 2: unknown IPO provider age must never be labeled fresh",()=>{
 const now=Date.parse("2026-11-08T12:00:00Z");
 assert.deepEqual(ipoFreshness(null,now),{upstreamUpdatedAt:null,stale:null,freshness:"unknown"});
 assert.equal(ipoFreshness("garbage",now).stale,null);
 assert.equal(ipoFreshness("2026-11-01T10:00:00Z",now).stale,true);
 assert.equal(ipoFreshness("2026-11-08T11:00:00Z",now).stale,false);
 assert.equal(ipoFreshness("2026-11-10T10:00:00Z",now).stale,null);
 const route=read("app/api/ipo/route.js");
 assert.match(route,/ipoFreshness\(/);
 assert.doesNotMatch(route,/stale:false/);
 const math=read("lib/ipoFeed.mjs");
 assert.match(math,/lastGmp/);
 assert.match(math,/estimatedListingPrice/);
});
test("gate 3: core page routes exist and interview functionality stays intact",()=>{
 for(const p of ["app/page.jsx","app/about/page.jsx","app/learn/page.jsx",
   "app/research/page.jsx","app/ipo/page.jsx","app/terminal/page.jsx",
   "app/screener/page.jsx","app/options/page.jsx",
   "app/sign-in/[[...sign-in]]/page.jsx","components/InterviewArena.jsx"]) {
   let content;try{content=read(p);}catch{if(p.includes("sign-in/"))continue;throw Error("Missing launch route "+p);}
   assert.ok(content.length>50,p);
 }
 const interview=read("app/learn/page.jsx");
 assert.match(interview,/<InterviewArena/);
 const css=read("components/interview-arena.css");
 assert.match(css,/AHQ EDITORIAL RESTORE/);
});
test("gate 4: legal pages, real contact and risk disclosures are present",()=>{
 const terms=read("app/terms/page.jsx");
 const privacy=read("app/privacy/page.jsx");
 const disclaimer=read("app/disclaimer/page.jsx");
 const footer=read("components/Footer.jsx");
 assert.match(terms,/Educational Purpose/);
 assert.match(privacy,/Privacy Policy/);
 assert.match(privacy,/Google Analytics 4/);
 assert.match(disclaimer,/Risk Disclosure/);
 assert.match(footer,/href="\/privacy"/);
 assert.match(footer,/href="\/terms"/);
 assert.match(footer,/href="\/disclaimer"/);
 assert.match(footer,/mailto:hello@alphahedgequant\.com/);
});
test("gate 5: security headers and fail-closed market proxy are configured",()=>{
 const config=read("next.config.mjs");
 for(const header of ["X-Content-Type-Options","X-Frame-Options","Referrer-Policy","Strict-Transport-Security"])assert.ok(config.includes(header),header);
 const market=read("app/api/market/[...path]/route.js");
 assert.match(market,/const ALLOWED/);
 assert.match(market,/ALLOWED\.some/);
 assert.match(market,/Market-data endpoint not allowed/);
 const cron=read("app/api/cron/ingest-research/route.js");
 assert.match(cron,/AbortSignal\.timeout/);
});

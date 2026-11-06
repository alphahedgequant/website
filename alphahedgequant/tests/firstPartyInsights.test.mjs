import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CLIENT_EVENTS,validAnonymousId,validClientEvent,safePagePath,
  safeCampaign,isAllowedEventOrigin} from "../lib/firstPartyInsights.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const id1="00000000-0000-4000-8000-000000000001";
const id2="00000000-0000-4000-8000-000000000002";
const base={event:"pageview",visitor:id1,session:id2,path:"/reports/india-macro-monthly"};
test("event types are fixed and operational signup conversions cannot be faked publicly",()=>{
 assert.equal(CLIENT_EVENTS.includes("pageview"),true);
 assert.equal(CLIENT_EVENTS.includes("engagement"),true);
 assert.equal(CLIENT_EVENTS.includes("waitlist_signup"),false);
 assert.equal(validClientEvent({...base,event:"waitlist_signup"}),null);
 assert.equal(validClientEvent({...base,event:"arbitrary_custom"}),null);
});
test("untrusted payloads cannot insert user data or financial parameters",()=>{
 const event=validClientEvent({...base,email:"private@example.com",searchQuery:"BANKNIFTY",
   token:"secret",userId:"owner",referrer:"https://example.com/private?x=y"});
 assert.ok(event);
 for(const key of ["email","searchQuery","token","userId","referrer"])assert.equal(key in event,false);
 assert.deepEqual(Object.keys(event).sort(),["event","visitor","session","path","activeSeconds","source","utmSource","utmMedium","utmCampaign"].sort());
});
test("visitor/session identifiers are browser-generated UUID v4 and not freeform strings",()=>{
 assert.equal(validAnonymousId(id1),true);
 assert.equal(validAnonymousId("owner@example.com"),false);
 assert.equal(validAnonymousId("Clerk_123"),false);
 assert.equal(validClientEvent({...base,visitor:"INVALID"}),null);
});
test("URL pathname collection rejects personal account, admin, API and search inputs",()=>{
 assert.equal(safePagePath("/admin/analytics"),null);
 assert.equal(safePagePath("/api/waitlist"),null);
 assert.equal(safePagePath("/sign-in"),null);
 assert.equal(safePagePath("/terminal/import"),null);
 assert.equal(safePagePath("/research?q=private"),null);
 assert.equal(safePagePath("/r/../../password"),null);
 assert.equal(safePagePath("/"),"/");
 assert.equal(safePagePath("/learn/"),"/learn");
});
test("event durations and short campaign labels are validated",()=>{
 assert.equal(validClientEvent({...base,event:"engagement",activeSeconds:8}).activeSeconds,8);\n assert.equal(validClientEvent({...base,event:"engagement",activeSeconds:60}).activeSeconds,60);
 assert.equal(validClientEvent({...base,event:"engagement",activeSeconds:300}),null);
 assert.equal(validClientEvent({...base,event:"engagement",activeSeconds:0}),null);
 assert.equal(validClientEvent({...base,activeSeconds:9}),null);
 assert.equal(safeCampaign("x_october2026"),"x_october2026");
 assert.equal(safeCampaign("x?email=private@example.com"),null);
});
test("the anonymous endpoint requires same-origin browser request metadata",()=>{
 const req=(url,origin,site)=>({url,headers:new Headers({"Origin":origin,"Sec-Fetch-Site":site})});
 assert.equal(isAllowedEventOrigin(req("https://www.alphahedgequant.com/api/insights/event","https://www.alphahedgequant.com","same-origin")),true);
 assert.equal(isAllowedEventOrigin(req("https://www.alphahedgequant.com/api/insights/event","https://evil.example","cross-site")),false);
 assert.equal(isAllowedEventOrigin({url:"https://www.alphahedgequant.com/api/insights/event",headers:new Headers()}),false);
});
test("owner only access is enforced on both page and JSON route",()=>{
 const page=read("app/admin/analytics/page.jsx");
 const api=read("app/api/admin/analytics/route.js");
 const policy=read("lib/insightsOwnerAccess.mjs");
 assert.match(page,/await isInsightsOwner\(\)/);
 assert.match(page,/notFound\(\)/);
 assert.match(api,/await isInsightsOwner\(\)/);
 assert.match(api,/return reply\(\{error:"Not found"\},404\)/);
 assert.match(policy,/if\(!allowedId&&!allowedEmail\)return false/);
 assert.match(policy,/verification\?\.status==="verified"/);
 assert.doesNotMatch(read("components/Nav.jsx"),/href="\/admin\/analytics"/);
});
test("no PostHog external collection remains in the browser",()=>{
 const tracker=read("components/AnalyticsTracker.jsx");
 assert.doesNotMatch(tracker,/posthog|i\.posthog\.com/i);
 assert.match(tracker,/sendInsightsEvent/);
 const client=read("lib/insightsClient.mjs");
 assert.match(client,/navigator\.globalPrivacyControl/);
 assert.match(client,/navigator\.doNotTrack/);
 assert.match(client,/ahq_analytics_optout/);
});
test("server confirmations, bounded quotas and storage privacy are structurally enforced",()=>{
 const server=read("lib/firstPartyInsights.mjs");
 const publicApi=read("app/api/insights/event/route.js");
 const waitlist=read("app/api/waitlist/route.js");
 assert.match(server,/hashQuotaIdentity/);
 assert.match(server,/180 days/);
 assert.match(publicApi,/namespace:"insights-client-minute"/);
 assert.match(publicApi,/isAllowedEventOrigin/);
 assert.match(waitlist,/inserted\.length>0/);
 assert.match(waitlist,/recordConfirmedWaitlistSignup/);
});

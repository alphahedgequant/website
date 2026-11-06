import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {trustedClientIp,hashQuotaIdentity} from "../lib/serverRateLimit.mjs";

const waitlist = readFileSync(new URL("../app/api/waitlist/route.js",import.meta.url),"utf8");
const copilot = readFileSync(new URL("../app/api/copilot/route.js",import.meta.url),"utf8");
const limiter = readFileSync(new URL("../lib/serverRateLimit.mjs",import.meta.url),"utf8");
const headers = entries => ({get:name=>entries[name]??null});

test("client IP uses validated address, rejects spoof strings and split chains",()=>{
 assert.equal(trustedClientIp(headers({"x-vercel-forwarded-for":"203.0.113.7"})),"203.0.113.7");
 assert.equal(trustedClientIp(headers({"x-forwarded-for":"192.0.2.3, 10.0.0.1"})),"192.0.2.3");
 assert.equal(trustedClientIp(headers({"x-forwarded-for":"ignored-untrusted-identity"})),"unknown");
 assert.equal(trustedClientIp(headers({})),"unknown");
});

test("quota bucket storage holds a keyed digest, not a raw IP or Clerk identity",()=>{
 const a=hashQuotaIdentity("signup","203.0.113.7","private-salt");
 const b=hashQuotaIdentity("signup","203.0.113.7","private-salt");
 const c=hashQuotaIdentity("copilot","203.0.113.7","private-salt");
 assert.equal(a.length,64);
 assert.equal(a,b);
 assert.notEqual(a,c);
 assert.ok(!a.includes("203.0.113"));
 assert.throws(()=>hashQuotaIdentity("signup","203.0.113.7",""));
});

test("quota increments are atomic across serverless instances",()=>{
 assert.match(limiter,/ON CONFLICT \(bucket,period\) DO UPDATE SET hits=ahq_request_quotas\.hits\+1/);
 assert.match(limiter,/RETURNING hits/);
 assert.match(limiter,/PRIMARY KEY \(bucket,period\)/);
 assert.match(limiter,/DELETE FROM ahq_request_quotas WHERE expires_at/);
 assert.doesNotMatch(limiter,/new Map\(/);
});

test("public waitlist applies distributed quota and validates inputs",()=>{
 assert.match(waitlist,/useRequestQuota\(/);
 assert.match(waitlist,/namespace:"waitlist-ip"/);
 assert.match(waitlist,/limit:3,windowSeconds:3600/);
 assert.match(waitlist,/MAX_BODY_BYTES/);
 assert.doesNotMatch(waitlist,/recentIPs|isRateLimited\(/);
});

test("Copilot is authenticated and bounded by per-user plus global quotas",()=>{
 assert.match(copilot,/await auth\(\)/);
 assert.match(copilot,/namespace:"copilot-user-hour"/);
 assert.match(copilot,/namespace:"copilot-site-day"/);
 assert.match(copilot,/limit:150,windowSeconds:86400/);
 assert.match(copilot,/limit:5,windowSeconds:3600/);
 assert.doesNotMatch(copilot,/const ipHits = new Map/);
 assert.doesNotMatch(copilot,/detail: detail\.slice|error: String\(e\.message/);
});

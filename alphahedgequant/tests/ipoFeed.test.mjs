import test from "node:test";
import assert from "node:assert/strict";
import {numberOrNull,classifyIpoStatus,normalizeIpo,buildIpoBuckets} from "../lib/ipoFeed.mjs";

test("canonical, allocation and upcoming IPO status variants remain visible",()=>{
 for(const [raw,status] of [["OPEN","open"],["UPCOMING","upcoming"],["CLOSED","closed"],["LISTED","listed"],["ALLOTTED","closed"],["allotment pending","closed"],["SUBSCRIPTION_CLOSED","closed"],["listing soon","closed"],["opening soon","upcoming"]])assert.equal(classifyIpoStatus(raw),status);
 assert.equal(classifyIpoStatus("NEW_VENDOR_STATUS"),null);
});
test("status evolution never silently hides source records",()=>{
 const feed=[{slug:"one-ipo",status:"OPEN",name:"One"},{slug:"two-ipo",status:"ALLOTTED",name:"Two"},{slug:"three-ipo",status:"STALLED",name:"Three"}];
 const parsed=buildIpoBuckets(feed);
 assert.equal(parsed.accepted,3);
 assert.equal(parsed.buckets.open.length,1);
 assert.equal(parsed.buckets.closed.length,1);
 assert.equal(parsed.buckets.other.length,1);
 assert.equal(parsed.unknownStatuses.STALLED,1);
});
test("GMP missing is distinct from a reported zero and implies no invented gains",()=>{
 const a=normalizeIpo({slug:"sample-ipo",name:"Sample",status:"OPEN",priceMax:100,lastGmp:null});
 assert.equal(a.gmp,null);assert.equal(a.estimatedListingPrice,null);assert.equal(a.gmpPct,null);
 const b=normalizeIpo({slug:"sample-ipo",name:"Sample",status:"OPEN",priceMax:100,lastGmp:0});
 assert.equal(b.gmp,0);assert.equal(b.estimatedListingPrice,100);assert.equal(b.gmpPct,0);
 const c=normalizeIpo({slug:"sample-ipo",status:"OPEN",lastGmp:15});
 assert.equal(c.estimatedListingPrice,null);assert.equal(c.gmpPct,null);
});
test("calculated implied listing price stays distinct from actual listing gain",()=>{
 const a=normalizeIpo({slug:"test-ipo",status:"LISTED",priceMax:200,lastGmp:20,listingGainPct:2});
 assert.equal(a.estimatedListingPrice,220);
 assert.equal(a.gmpPct,10);
 assert.equal(a.listingGain,2);
});
test("feed de-duplicates identical provider slugs and rejects invalid identifiers",()=>{
 const p=buildIpoBuckets([{slug:"abc-ipo",status:"OPEN"},{slug:"abc-ipo",status:"OPEN"},{slug:"../oops",status:"OPEN"}]);
 assert.equal(p.accepted,1);assert.equal(p.duplicates,1);assert.equal(p.invalid,1);
});
test("missing numeric values do not become zero or NaN",()=>{
 for(const x of [undefined,null,"","not-a-number",Infinity])assert.equal(numberOrNull(x),null);
 assert.equal(numberOrNull("31.5"),31.5);
});

import {ipoFreshness} from "../lib/ipoFreshness.mjs";
test("timestamped IPO data must not be called fresh without upstream evidence",()=>{
 const t=Date.parse("2026-11-08T12:00:00Z");
 assert.equal(ipoFreshness(null,t).freshness,"unknown");
 assert.equal(ipoFreshness("invalid",t).stale,null);
 assert.equal(ipoFreshness("2026-11-01T12:00:00Z",t).stale,true);
 assert.equal(ipoFreshness("2026-11-08T09:00:00Z",t).stale,false);
 assert.equal(ipoFreshness("2026-11-09T16:00:00Z",t).stale,null);
});


test("expired provider OPEN and UPCOMING states cannot advertise a past bidding window",()=>{
 const today="2026-11-10";
 const feed=[
  {slug:"past-open",status:"OPEN",name:"Past issue",openDate:"2026-11-01T00:00:00Z",closeDate:"2026-11-05T00:00:00Z"},
  {slug:"past-upcoming",status:"UPCOMING",name:"Past announced issue",openDate:"2026-11-01",closeDate:"2026-11-05"},
  {slug:"new-open",status:"UPCOMING",name:"Current issue",openDate:"2026-11-09",closeDate:"2026-11-12"},
  {slug:"next-upcoming",status:"OPEN",name:"Next issue",openDate:"2026-11-12",closeDate:"2026-11-14"}
 ];
 const result=buildIpoBuckets(feed,today);
 assert.equal(result.buckets.open.length,1);
 assert.equal(result.buckets.upcoming.length,1);
 assert.equal(result.buckets.closed.length,2);
 assert.equal(result.correctedStatuses,4);
 assert.equal(result.accepted,4);
});
test("disputed GMP is never reported as a reliable premium or listing estimate",()=>{
 const ipo=normalizeIpo({
  slug:"disputed-premium",name:"Disputed GMP",status:"CLOSED",
  priceMin:95,priceMax:100,lotSize:100,lastGmp:65,
  gmpDisputed:true,gmpSources:3,gmpSpread:80
 },"2026-11-10");
 assert.equal(ipo.gmpDisputed,true);
 assert.equal(ipo.gmp,null);
 assert.equal(ipo.gmpPct,null);
 assert.equal(ipo.estimatedListingPrice,null);
 assert.equal(ipo.minimumInvestment,10000);
 assert.equal(ipo.issuePrice,100);
});
test("missing values, zero GMP and source date discrepancies stay distinguishable",()=>{
 const missing=normalizeIpo({slug:"no-lot",status:"OPEN",priceMax:0,lotSize:0,lastGmp:null},"2026-11-10");
 assert.equal(missing.issuePrice,null);
 assert.equal(missing.minimumInvestment,null);
 assert.equal(missing.estimatedListingPrice,null);
 const zero=normalizeIpo({slug:"reported-zero",status:"CLOSED",priceMax:100,lastGmp:0},"2026-11-10");
 assert.equal(zero.gmp,0);
 assert.equal(zero.estimatedListingPrice,100);
});
test("never classify an unknown or postponed source status as open",()=>{
 const x=buildIpoBuckets([{slug:"postponed-issue",name:"Postponed",status:"Issue postponed",openDate:"2026-11-09",closeDate:"2026-11-12"}],"2026-11-10");
 assert.equal(x.buckets.open.length,0);
 assert.equal(x.buckets.other.length,1);
});

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

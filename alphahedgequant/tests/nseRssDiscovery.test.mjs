import assert from "node:assert/strict";
import test from "node:test";
import {parseRss,discover,findIssuer,sourceLink,classify} from "../lib/nseRssDiscovery.mjs";
const xml='<?xml version="1.0"?><rss><channel><item><title>HINDUSTAN AERONAUTICS LIMITED - Transcript of conference call</title><link>https://nsearchives.nseindia.com/corporate/hal_call.pdf</link><pubDate>Tue, 20 Oct 2026 12:00:00 GMT</pubDate><description>Quarterly earnings call transcript</description></item><item><title>UNKNOWN INDUSTRIES LIMITED - Analyst transcript</title><link>https://nsearchives.nseindia.com/corporate/unknown.pdf</link><pubDate>Tue, 20 Oct 2026 12:00:00 GMT</pubDate></item></channel></rss>';
test("parses RSS items and extracts original links",()=>{assert.equal(parseRss(xml).length,2);});
test("classifies issuer-specific official concall discovery conservatively",()=>{
 const d=discover(xml,"announcements");
 assert.equal(d.length,1);assert.equal(d[0].symbol,"HAL");
 assert.equal(d[0].category,"concalls");assert.equal(d[0].verified,false);
});
test("rejects untrusted links and fuzzy issuer matching",()=>{
 assert.equal(sourceLink("https://nsearchives.nseindia.com.evil.org/doc.pdf"),null);
 assert.equal(findIssuer({title:"HALO INDUSTRIES LIMITED - filing"}),null);
});
test("annual report feed stays annual regardless of title",()=>{
 assert.equal(classify({title:"Annual report",description:""},"annual_reports"),"annual_reports");
});

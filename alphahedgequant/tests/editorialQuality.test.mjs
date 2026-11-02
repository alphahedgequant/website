import test from "node:test";
import assert from "node:assert/strict";
import {checkEditorialPacket,canPublish,experimentUrl,experimentMetrics} from "../lib/editorialQuality.mjs";
const good=()=>({
 id:"india-credit-2026-11",title:"India's credit cycle",thesis:"Separate nominal credit growth from real demand",stage:"approved",
 claims:[{id:"rbi-credit",statement:"Reported credit growth is 10%",sourceUrl:"https://www.rbi.org.in/",sourcePublishedOn:"2026-10-31",sourceCheckedOn:"2026-11-02",sourceType:"primary",numeric:true,value:10,unit:"% YoY",periodEnd:"2026-10-31",sourceVerified:true,verificationNote:"Manually reconciled with source table and date"}],
 assets:[{format:"carousel",copy:"How to read credit data",claimIds:["rbi-credit"],imageContainsData:true,sourceCaption:"RBI; observation as of 31 Oct 2026; illustration, not live data",altText:"Chart illustrating a percentage"}],
 distribution:[{platform:"linkedin",postingAllowed:false,campaignUrl:"https://www.alphahedgequant.com/research"}],
 approval:{editor:{kind:"human",userId:"editor-123",approvedOn:"2026-11-02"},owner:{kind:"human",userId:"owner-456",approvedOn:"2026-11-02"}}
});
test("complete metadata packet can pass mechanical editorial checks",()=>{assert.equal(checkEditorialPacket(good()).status,"PASS")});
test("numeric claim must have dates, units, source URL and verification evidence",()=>{
 for (const c of [{unit:""},{sourceUrl:"http://rbi.org.in"},{sourcePublishedOn:"not-a-date"},{sourceVerified:false},{periodEnd:""},{value:NaN}]){
 const p=good();Object.assign(p.claims[0],c);assert.equal(checkEditorialPacket(p).status,"HOLD");
 }
});
test("missing or duplicated evidence IDs stop scheduling",()=>{
 const p=good();p.claims.push({...p.claims[0]});assert.equal(checkEditorialPacket(p).status,"HOLD");
 const q=good();q.assets[0].claimIds=["made-up"];assert.equal(checkEditorialPacket(q).status,"HOLD");
});
test("ValuePickr AI posts and self-promotion are prohibited",()=>{
 for (const d of [{postingAllowed:true},{promotion:true},{aiWrittenCopy:true}]){
 const p=good();p.distribution=[{platform:"valuepickr",...d}];assert.equal(checkEditorialPacket(p).status,"HOLD");
 }
});
test("Reddit distribution must review subreddit rules and no automated engagement",()=>{
 const p=good();p.distribution=[{platform:"reddit",postingAllowed:true}];assert.equal(checkEditorialPacket(p).status,"HOLD");
 const q=good();q.distribution=[{platform:"x",autoLike:true}];assert.equal(checkEditorialPacket(q).status,"HOLD");
});
test("AI self-approval cannot pass authentic human ownership gate",()=>{
 const p=good();assert.equal(canPublish(p).allowed,false);
 assert.equal(canPublish(p,{authenticatedOwnerId:"owner-456",authenticatedEditorId:"editor-123"}).allowed,true);
 const q=good();q.approval.editor.kind="ai";assert.equal(canPublish(q,{authenticatedOwnerId:"owner-456",authenticatedEditorId:"editor-123"}).allowed,false);
 const w=good();w.stage="research";assert.equal(canPublish(w,{authenticatedOwnerId:"owner-456",authenticatedEditorId:"editor-123"}).allowed,false);
});
test("UTM tracking uses only AHQ HTTPS links and valid tags",()=>{
 const link=experimentUrl({destination:"https://www.alphahedgequant.com/research",source:"linkedin",medium:"social",campaign:"india_credit_nov2026",content:"carousel_a"});
 const u=new URL(link);assert.equal(u.searchParams.get("utm_source"),"linkedin");assert.equal(u.searchParams.get("utm_content"),"carousel_a");
 assert.throws(()=>experimentUrl({destination:"https://evil.com/",source:"x",medium:"social",campaign:"bad"}));
 assert.throws(()=>experimentUrl({destination:"https://www.alphahedgequant.com/",source:"social space",medium:"social",campaign:"bad"}));
});
test("acquisition analytics do not invent conversions for zero visitors",()=>{
 assert.deepEqual(experimentMetrics({visitors:0,signups:0,spend:0}),{visitors:0,signups:0,conversionRate:null,costPerSignup:null});
 assert.equal(experimentMetrics({visitors:100,signups:5,spend:50}).conversionRate,0.05);
 assert.throws(()=>experimentMetrics({visitors:10,signups:11}));
});

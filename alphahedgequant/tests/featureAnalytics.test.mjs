import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CLIENT_EVENTS,validClientEvent} from "../lib/firstPartyInsights.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const ids={visitor:"00000000-0000-4000-8000-000000000001",session:"00000000-0000-4000-8000-000000000002"};

test("all client events are fixed-name, validated and do not record stock or user values",()=>{
  const tracker=read("components/AnalyticsTracker.jsx");
  const declared=tracker.match(/const exposedFeatures=new Set\(\[([\s\S]*?)\]\);/);
  assert.ok(declared,"feature registry missing");
  const trackerEvents=[...declared[1].matchAll(/"([a-z_]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(trackerEvents).size,trackerEvents.length,"duplicate tracker event");
  const expected=CLIENT_EVENTS.filter(x=>x!=="pageview"&&x!=="engagement");
  assert.deepEqual(new Set(trackerEvents),new Set(expected));
  for(const event of expected){
    const raw={event,path:"/ipo",...ids,stockSymbol:"RELIANCE",searchText:"private query",orderId:"secret"};
    const accepted=validClientEvent(raw);
    assert.equal(accepted.event,event);
    for(const field of ["stockSymbol","searchText","orderId"])assert.ok(!(field in accepted),event+" leaked "+field);
  }
  assert.equal(validClientEvent({event:"dynamic_input_RELIANCE",path:"/ipo",...ids}),null);
});
test("production UI action attributes all map to server-approved event names",()=>{
  const pages=[
    "components/IpoScreen.jsx","app/screener/page.jsx","app/learn/page.jsx",
    "components/InterviewArena.jsx","app/terminal/page.jsx",
    "app/backtest/page.jsx","app/options/page.jsx","app/research/page.jsx"
  ];
  const seen=new Set();
  for(const file of pages){
    const source=read(file);
    const events=[...source.matchAll(/data-ahq-event=(?:"([a-z_]+)"|\{[^}]*?"([a-z_]+)"\})/g)].map(x=>x[1]||x[2]);
    assert.ok(events.length,file+" lacks interactive telemetry");
    for(const ev of events){
      assert.ok(CLIENT_EVENTS.includes(ev),file+" sends unapproved "+ev);
      seen.add(ev);
    }
  }
  for(const key of ["ipo_tab_selected","screener_market_switched","screener_filter_changed","interview_answer_checked","mental_math_answer_submitted","terminal_tab_selected","backtest_run_submitted","research_search_submitted","option_chain_selected"])
    assert.ok(seen.has(key),"missing expected product function "+key);
  const tracker=read("components/AnalyticsTracker.jsx");
  assert.match(tracker,/document\.addEventListener\("click",action\)/);
  assert.match(tracker,/document\.addEventListener\("change",action\)/);
  assert.match(tracker,/document\.addEventListener\("submit",action\)/);
  assert.match(tracker,/tag!=="BUTTON" && tag!=="A"/);
  assert.match(tracker,/tag!=="SELECT"/);
  assert.match(tracker,/tag!=="FORM"/);
});
test("dashboard identifies browser visitors separately from real registered Clerk accounts",()=>{
  const route=read("app/api/admin/analytics/route.js");
  const dashboard=read("components/OwnerInsightsDashboard.jsx");
  assert.match(route,/if\(!await isInsightsOwner\(\)\)return reply\(\{error:"Not found"\},404\)/);
  assert.match(route,/client\.users\.getCount\(\)/);
  assert.match(route,/createdAtAfter:Date\.parse\(since\),limit:1/);
  assert.match(route,/registered_users_total:registeredUsers/);
  assert.match(route,/registered_users_new:registeredNew/);
  assert.match(dashboard,/knownCount\(o\.registered_users_total\)/);
  assert.match(dashboard,/knownCount\(o\.registered_users_new\)/);
  assert.match(dashboard,/DAU · today \(IST\)/);
  assert.match(dashboard,/WAU · rolling 7 days/);
  assert.match(dashboard,/MAU · rolling 30 days/);
  assert.match(dashboard,/Average active time/);
  assert.match(dashboard,/Most visited pages/);
  assert.match(dashboard,/Most-used functions/);
  assert.match(dashboard,/const pageEvents=new Set/);
  assert.match(dashboard,/onClick=\{\(\)=>setRefresh\(x=>x\+1\)\}/);
  assert.doesNotMatch(read("components/Nav.jsx"),/href="\/admin\/analytics"/);
});
test("client respects privacy controls and never reads form values for event payloads",()=>{
  const client=read("lib/insightsClient.mjs");
  const tracker=read("components/AnalyticsTracker.jsx");
  assert.match(client,/navigator\.globalPrivacyControl/);
  assert.match(client,/navigator\.doNotTrack/);
  assert.match(client,/ahq_analytics_optout/);
  assert.match(tracker,/el\.getAttribute\("data-ahq-event"\)/);
  assert.doesNotMatch(tracker,/event\.target\?\.value|el\.value|FormData/);
  assert.match(read("lib/firstPartyInsights.mjs"),/180 days/);
});

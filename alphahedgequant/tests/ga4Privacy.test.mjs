import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validGa4Id,coarseGa4Path,safeGa4Event,hasGa4Consent,ensureGa4,recordGa4Page} from "../lib/ga4Client.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("GA4 ID must be a genuine-looking G- measurement ID",()=>{
  assert.equal(validGa4Id("G-ABCDEF12"),true);
  for(const x of ["","UA-1234567-1","G-", "G-abcde", "G-ABC/123", "G-ABC_123"])
    assert.equal(validGa4Id(x),false,x);
});
test("GA4 only receives coarse public routes, not tickers, queries, accounts or admin paths",()=>{
  assert.equal(coarseGa4Path("/"),"/");
  assert.equal(coarseGa4Path("/learn"),"/learn");
  assert.equal(coarseGa4Path("/research/volatility-study"),"/research/reading");
  assert.equal(coarseGa4Path("/reports/india-macro"),"/reports/reading");
  for(const p of ["/admin/analytics","/terminal/import","/terminal/NIFTY","/screener/RELIANCE",
    "/learn?search=bank", "/api/insights/event", "/account","/sign-in","/privacy",
    "/research/private%40email","/research/../../private"])
    assert.equal(coarseGa4Path(p),null,p);
});
test("feature events are allowlisted, user inputs cannot become GA4 event names",()=>{
  assert.equal(safeGa4Event("quant_terminal_opened"),"quant_terminal_opened");
  assert.equal(safeGa4Event("ipo_page_opened"),"ipo_page_opened");
  for(const q of ["user_email","BANKNIFTY","waitlist_signup","user_properties",""])
    assert.equal(safeGa4Event(q),null,q);
});
test("no browser means zero Google Analytics collection",()=>{
  assert.equal(hasGa4Consent(),false);
  assert.equal(ensureGa4(),false);
  assert.equal(recordGa4Page("/"),false);
});
test("GA4 is mounted without replacing the first-party analytics or the existing design",()=>{
  const layout=read("app/layout.jsx");
  assert.match(layout,/import AnalyticsTracker/);
  assert.match(layout,/import Ga4Tracker/);
  assert.match(layout,/<AnalyticsTracker \/>/);
  assert.match(layout,/<Ga4Tracker \/>/);
  const tracker=read("components/Ga4Tracker.jsx");
  assert.match(tracker,/recordGa4Page/);
  const client=read("lib/ga4Client.mjs");
  assert.match(client,/analyticsAllowed\(\)/);
  assert.match(client,/===\"granted\"/);
  assert.match(client,/send_page_view:false/);
  assert.match(client,/ad_personalization:\"denied\"/);
  assert.match(client,/allow_google_signals:false/);
  const privacy=read("components/InsightsPrivacyControl.jsx");
  assert.match(privacy,/setGa4Consent\(false\)/);
});

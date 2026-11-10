import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("public IPO calendar uses real provider data, explicit freshness, safe bounded refresh",()=>{
 const route=read("app/api/ipo/route.js");
 const screen=read("components/IpoScreen.jsx");
 assert.match(route,/api\/public\/market\/ipos\?limit=200/);
 assert.match(route,/next:\{revalidate:60\}/);
 assert.match(route,/upstreamUpdatedAt:freshness\.upstreamUpdatedAt/);
 assert.match(route,/count:accepted/);
 assert.match(screen,/setInterval\(\(\)=>\{if\(document\.visibilityState==="visible"\)load\(\);\},60000\)/);
 assert.match(screen,/upstream quote age unverified|Upstream quote age unverified/);
 assert.doesNotMatch(screen,/const mockIpos|demoIpos|sample-ipo|Math\.random\(/i);
});
test("detail and scoreboard requests enforce slug validation and preserve null figures",()=>{
 const route=read("app/api/ipo/route.js");
 assert.match(route,/const isSlug/);
 assert.match(route,/encodeURIComponent\(slug\)/);
 assert.match(route,/status:400/);
 assert.match(route,/api\/public\/market\/ipos\/"/);
 assert.match(route,/api\/public\/market\/scoreboard/);
 assert.match(route,/gmpHistory:safeGmp/);
 assert.match(route,/subscriptions:safeSubs/);
 assert.match(route,/gmpAtClose:numberOrNull/);
 assert.match(route,/actualPct:numberOrNull/);
 assert.doesNotMatch(route,/Math\.random|mockData/);
});
test("dashboard provides complete live stages, real details, searchable filters and listing checks",()=>{
 const screen=read("components/IpoScreen.jsx");
 for(const name of ["Open now","Upcoming","Awaiting listing","Recently listed","Other statuses"])
  assert.ok(screen.includes(name),name);
 for(const element of ["IPO sort order","Search IPOs","ipo_issue_opened","ipo_filter_changed","IpoDetails","IPO details","GMP history","View details","GMP implied","Actual listing"])
  assert.ok(screen.includes(element),element);
 assert.match(screen,/gmpDisputed/);
 assert.match(screen,/Date-checked status/);
 assert.match(screen,/role="dialog"/);
 assert.match(screen,/aria-label="Close details"/);
 assert.match(screen,/No IPOs with a confirmed active bidding window/);
 assert.doesNotMatch(screen,/href=\{"\/ipo\//);
});
test("IPO page uses effective homepage dark and light tones rather than a separate yellow or blue design",()=>{
 const home=read("app/premium-editorial.css");
 const css=read("app/ipo/ipo-intro.css");
 for(const [name,dark,light] of [
  ["bg","#090c13","#f7f5f0"],["panel","#131924","#fffdf9"],
  ["text","#f2efe9","#17212d"],["muted","#a5a9b4","#566372"],
  ["border","#303946","#d6d8d7"],["gold","#d7b477","#88632d"]
 ]){
  assert.ok(home.includes("--pr-"+name+":"+dark),"Homepage dark token "+name);
  assert.ok(home.includes("--pr-"+name+":"+light),"Homepage light token "+name);
  const local=name==="gold"?"gold":name==="border"?"line":name;
  assert.ok(css.includes("--ipo-"+local+":"+dark),"IPO dark token "+name);
  assert.ok(css.includes("--ipo-"+local+":"+light),"IPO light token "+name);
 }
 assert.match(css,/html\[data-theme="light"\] \.ahq-ipo-page/);
 assert.match(css,/\.ipo-modal-root/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/#F0A93B|#3d78bb|#14161c/);
});
test("IPO SEO and open access remain unchanged while real-risk explanations grow",()=>{
 const page=read("app/ipo/page.jsx");
 const middleware=read("middleware.js");
 assert.match(page,/canonical: "\/ipo"/);
 assert.match(page,/isAccessibleForFree:true/);
 assert.match(page,/FAQPage/);
 assert.match(page,/Indian IPO Intelligence/);
 assert.match(page,/GMP is an unofficial/);
 assert.match(middleware,/"\/ipo"/);
 assert.match(middleware,/"\/api\/ipo"/);
 assert.match(page,/<IpoScreen \/>/);
});
test("privacy: new feature interactions use fixed event names, not search terms or IPO IDs",()=>{
 const insights=read("lib/firstPartyInsights.mjs");
 const tracker=read("components/AnalyticsTracker.jsx");
 for(const event of ["ipo_filter_changed","ipo_issue_opened"]){
  assert.ok(insights.includes('"'+event+'"'));
  assert.ok(tracker.includes('"'+event+'"'));
 }
 assert.doesNotMatch(insights,/ipoIssueName|ipoQueryValue|gmpValue/);
});

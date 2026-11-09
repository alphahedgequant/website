import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PUBLIC_RESEARCH_SERIES,RESEARCH_PREVIEWS,PREVIEW_RELEASE_DATE,findResearchSeries,findResearchPreview} from "../lib/publicResearchPreviews.mjs";
import {CLIENT_EVENTS} from "../lib/firstPartyInsights.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("three original AHQ collections have full, signed-in destinations",()=>{
 assert.deepEqual(PUBLIC_RESEARCH_SERIES.map(x=>x.id),["research-papers","quant-models","macro-outlook"]);
 assert.deepEqual(PUBLIC_RESEARCH_SERIES.map(x=>x.fullRoute),["/research","/models","/reports"]);
 for(const item of PUBLIC_RESEARCH_SERIES){
  assert.ok(item.summary.length>=110);
  assert.ok(item.intro.length>=170);
  assert.equal(findResearchSeries(item.id).id,item.id);
 }
 const totals=PUBLIC_RESEARCH_SERIES.map(x=>RESEARCH_PREVIEWS.filter(a=>a.series===x.id).length);
 assert.deepEqual(totals,[4,6,2]);
 assert.equal(new Set(RESEARCH_PREVIEWS.map(x=>x.series+"/"+x.slug)).size,RESEARCH_PREVIEWS.length);
});

test("every free preview provides substantive explanatory content, not gated full text",()=>{
 for(const a of RESEARCH_PREVIEWS){
  assert.ok(findResearchSeries(a.series),a.slug);
  assert.equal(findResearchPreview(a.series,a.slug).title,a.title);
  assert.match(a.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(a.title.length>=25&&a.title.length<=105,a.slug);
  assert.ok(a.subtitle.length>=85,a.slug);
  assert.equal(a.intro.length,3,a.slug);
  assert.ok(a.intro.every(x=>x.length>=120),a.slug);
  assert.ok(a.intro.join(" ").split(/\s+/).length>=115,a.slug);
  assert.equal(a.takeaways.length,3,a.slug);
  assert.ok(a.question.length>=70,a.slug);
  assert.ok(a.formula.length>35,a.slug);
  assert.ok(a.locked.length>=3,a.slug);
  assert.ok(a.fullRoute.startsWith("/"),a.slug);
  if(a.series==="macro-outlook")assert.match(a.fullRoute,/^\/reports\/[a-z0-9-]+$/);
  else assert.equal(a.fullRoute,a.series==="quant-models"?"/models":"/research");
  if(a.series==="research-papers")assert.match(a.paper.url,/^https:\/\//);
 }
 const src=read("lib/publicResearchPreviews.mjs");
 assert.doesNotMatch(src,/import .*from ["']@\/lib\/reports/);
 assert.doesNotMatch(src,/api\/admin\/analytics/);
 assert.match(PREVIEW_RELEASE_DATE,/^2026-11-09$/);
});

test("real report and model names exist in the authenticated source content",()=>{
 const reports=read("lib/reports/index.js");
 const models=read("app/models/page.jsx");
 for(const m of RESEARCH_PREVIEWS.filter(x=>x.series==="macro-outlook")){
   assert.ok(reports.includes('slug: "'+m.slug+'"'),"Unrecognized archived report "+m.slug);
 }
 for(const name of [
 "Historical VaR","GARCH(1,1)","Gamma Exposure & Gamma Flip",
 "Ledoit-Wolf Optimization","Engle-Granger Pairs","HMM Regime Detection"
 ])assert.ok(models.includes('name: "'+name+'"'),"Missing modeled subject "+name);
 const papers=read("app/research/page.jsx");
 for(const title of ["Co-integration and Error Correction","Statistical Arbitrage in the US Equities Market","Coherent Measures of Risk"])assert.ok(papers.includes(title));
});

test("SEO pages statically generate all series and excerpts, with correct canonicals",()=>{
 const idx=read("app/library/series/[series]/page.jsx");
 const article=read("app/library/series/[series]/[slug]/page.jsx");
 const sitemap=read("app/sitemap.js");
 assert.match(idx,/generateStaticParams/);
 assert.match(idx,/dynamicParams=false/);
 assert.match(article,/generateStaticParams/);
 assert.match(article,/dynamicParams=false/);
 assert.match(idx,/alternates:\{canonical:"\/library\/series\/"/);
 assert.match(article,/alternates:\{canonical:path\}/);
 assert.match(article,/isAccessibleForFree:true/);
 assert.match(idx,/isAccessibleForFree:true/);
 assert.match(idx,/notFound\(\)/);
 assert.match(article,/notFound\(\)/);
 assert.match(sitemap,/PUBLIC_RESEARCH_SERIES\.map\(item=>/);
 assert.match(sitemap,/RESEARCH_PREVIEWS\.map\(item=>/);
 assert.doesNotMatch(sitemap,/url:\s*base\s*\+\s*"\/reports"/);
 assert.doesNotMatch(sitemap,/url:\s*base\s*\+\s*"\/models"/);
 assert.doesNotMatch(sitemap,/url:\s*base\s*\+\s*"\/research"/);
});

test("previews link to protected full routes, never expose gated content or accounts",()=>{
 const auth=read("middleware.js");
 const ui=read("app/library/series/components.jsx");
 const page=read("app/library/series/[series]/[slug]/page.jsx");
 assert.match(auth,/"\/library\(\.\*\)"/);
 assert.match(auth,/await auth\.protect\(\)/);
 for(const x of ['"/models"','"/reports"','"/research"','"/api/admin/analytics"'])assert.doesNotMatch(auth,new RegExp(x.replace("/","\\/")));
 assert.match(ui,/<SignedOut>/);
 assert.match(ui,/<SignedIn>/);
 assert.match(ui,/href=\{href\}/);
 assert.match(ui,/Sign in to continue reading/);
 assert.match(page,/item\.intro\.map/);
 assert.match(page,/item\.locked\.map/);
 assert.match(page,/PUBLIC ACCESS/);
 assert.doesNotMatch(page,/getReport\(/);
 assert.doesNotMatch(page,/ModelPlayground/);
 assert.doesNotMatch(page,/models\/page\.jsx/);
 assert.doesNotMatch(page,/report\.body\.map/);
});

test("existing library, homepage, navigation and footer link to previews",()=>{
 const library=read("app/library/page.jsx");
 const home=read("components/PremiumEditorial.jsx");
 const nav=read("components/Nav.jsx");
 const footer=read("components/Footer.jsx");
 for(const s of [library,home,nav,footer]){
  assert.ok(s.includes("/library/series/research-papers") || s.includes('PUBLIC_RESEARCH_SERIES'),"Paper preview missing");
  assert.ok(s.includes("/library/series/quant-models") || s.includes('PUBLIC_RESEARCH_SERIES'),"Model preview missing");
  assert.ok(s.includes("/library/series/macro-outlook") || s.includes('PUBLIC_RESEARCH_SERIES'),"Macro preview missing");
 }
 assert.match(nav,/href: "\/research"/);
 assert.match(nav,/href: "\/reports"/);
 assert.match(nav,/href: "\/models"/);
});

test("full research continuation clicks are recorded only as a fixed low-cardinality event",()=>{
 const ev="research_preview_unlock_clicked";
 const tracker=read("components/AnalyticsTracker.jsx");
 const dashboard=read("components/OwnerInsightsDashboard.jsx");
 const actions=read("app/library/series/components.jsx");
 assert.ok(CLIENT_EVENTS.includes(ev));
 assert.ok(tracker.includes('"'+ev+'"'));
 assert.ok(dashboard.includes(ev));
 assert.match(actions,/data-ahq-event="research_preview_unlock_clicked"/);
 assert.doesNotMatch(actions,/email=|userId=|tradeId=|stockSymbol=/);
});

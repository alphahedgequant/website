import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("public overviews are exactly matched while full routes remain Clerk protected",()=>{
 const middleware=read("middleware.js");
 for(const p of ["/research","/models","/reports"])assert.ok(middleware.includes('  "'+p+'",'),"missing public preview "+p);
 for(const p of ["/research(.*)","/models(.*)","/reports(.*)","/research/explore","/models/explore","/reports/archive"])assert.ok(!middleware.includes('"'+p+'"'),"unsafe public rule "+p);
 assert.match(middleware,/await auth\.protect\(\)/);
 for(const path of ["/api/admin/analytics","/api/market","/terminal","/reports/india-macro-monthly-july-2026"])assert.ok(!middleware.includes('  "'+path+'",'));
});
test("public pages have canonical URLs, SEO metadata and meaningful visible intros",()=>{
 for(const [name,folder] of [["Research Papers","research"],["Quant Models","models"],["Macro Outlook","reports"]]){
  const content=read("app/"+folder+"/page.jsx");
  assert.match(content,/export const metadata=/);
  assert.ok(content.includes('alternates:{canonical:"/'+folder+'"}'));
  assert.match(content,/isAccessibleForFree:true/);
  assert.match(content,/<h1 className=/);
  assert.match(content,/ap-section-title/);
  assert.match(content,/ap-gate/);
  assert.ok(content.length>2500,folder+" missing explanatory content");
  assert.ok(content.includes("/"+folder+(folder==="reports"?"/archive":"/explore")),"full link missing for "+folder);
  assert.ok(!content.includes("use client"),"Public preview must be server-rendered");
 }
});
test("full features are preserved at protected destinations",()=>{
 const original=read("app/research/explore/page.jsx");
 assert.match(original,/fetchPapers\(/);
 assert.match(original,/FOUNDATIONAL/);
 assert.match(original,/PUBLICATIONS/);
 const model=read("app/models/explore/page.jsx");
 assert.match(model,/const MODELS = \[/);
 assert.match(model,/ModelPlayground/);
 assert.match(model,/ModelMasterclass/);
 const reports=read("app/reports/archive/page.jsx");
 assert.match(reports,/reports\.map/);
 assert.match(reports,/\/reports\/\$\{r\.slug\}/);
 const full=read("app/reports/[slug]/page.jsx");
 assert.match(full,/report\.body\.map/);
});
test("macro preview renders only public summaries, not complete report blocks",()=>{
 const preview=read("app/reports/page.jsx");
 assert.match(preview,/r\.dek/);
 assert.match(preview,/r\.summary/);
 assert.doesNotMatch(preview,/r\.body/);
 assert.match(preview,/date/);
});
test("search sitemap lists only public landing pages, not protected full experiences",()=>{
 const sitemap=read("app/sitemap.js");
 for(const route of ["/research","/models","/reports","/ipo","/library"])assert.ok(sitemap.includes('"'+route+'"'),route);
 for(const route of ["/research/explore","/models/explore","/reports/archive"])assert.ok(!sitemap.includes('"'+route+'"'));
});
test("public research library exposes links to all 3 categories",()=>{
 const library=read("app/library/page.jsx");
 for(const route of ["/research","/models","/reports"])assert.ok(library.includes('href:"'+route+'"'));
 const css=read("app/public-preview.css");
 assert.match(css,/max-width:800px/);
 assert.match(css,/prefers-reduced-motion/);
});

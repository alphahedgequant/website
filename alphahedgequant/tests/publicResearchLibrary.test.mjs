import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {RESEARCH_LIBRARY,RESEARCH_CATEGORIES,LIBRARY_PUBLISHED,getResearchArticle} from "../lib/publicResearchLibrary.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const flat=x=>[x.title,x.description,x.lead,...x.takeaways,...x.sections.flatMap(s=>[s.h,...s.p,...s.bullets,s.formula||"",s.example?.body||""])].join(" ");

test("public research articles are unique, substantive, factually caveated and have external references",()=>{
 assert.equal(RESEARCH_LIBRARY.length,11);
 assert.equal(new Set(RESEARCH_LIBRARY.map(a=>a.slug)).size,RESEARCH_LIBRARY.length);
 assert.equal(new Set(RESEARCH_LIBRARY.map(a=>a.title)).size,RESEARCH_LIBRARY.length);
 assert.ok(RESEARCH_LIBRARY.filter(x=>x.category==="ipo").length>=5);
 assert.ok(RESEARCH_LIBRARY.filter(x=>x.category==="quant").length>=6);
 assert.deepEqual(RESEARCH_CATEGORIES.map(x=>x.id),["ipo","quant"]);
 for(const article of RESEARCH_LIBRARY){
  assert.match(article.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(article.title.length>20 && article.title.length<110);
  assert.ok(article.description.length>=90 && article.description.length<210);
  assert.ok(article.lead.length>130);
  assert.ok(article.sections.length>=4,article.slug);
  assert.ok(article.takeaways.length>=3,article.slug);
  assert.ok(flat(article).split(/\s+/).length>260,"Article too short: "+article.slug);
  assert.ok(article.sections.some(s=>s.formula)||article.sections.some(s=>s.example),"Missing worked example/formula: "+article.slug);
  assert.ok(article.sources.length>0,article.slug);
  for(const s of article.sources){
   assert.ok(s.label && s.label.length>12);
   assert.match(s.url,/^https:\/\//);
   assert.ok(new URL(s.url).hostname);
  }
  assert.equal(getResearchArticle(article.slug).slug,article.slug);
 }
 assert.equal(getResearchArticle("../../admin/analytics"),null);
});
test("all public static article routes are generated from the same source as the XML sitemap",()=>{
 const sitemap=read("app/sitemap.js");
 const detail=read("app/library/[slug]/page.jsx");
 assert.match(sitemap,/RESEARCH_LIBRARY\.map\(note=>/);
 assert.match(detail,/generateStaticParams\(\)/);
 assert.match(detail,/RESEARCH_LIBRARY\.map\(x=>\(\{slug:x\.slug\}\)\)/);
 assert.match(detail,/dynamicParams=false/);
 assert.match(detail,/notFound\(\)/);
 assert.match(sitemap,/"\/library"/);
 assert.match(detail,/alternates:\{canonical:url\}/);
 assert.match(detail,/isAccessibleForFree:true/);
 assert.match(detail,/datePublished:LIBRARY_PUBLISHED/);
 assert.match(read("app/library/page.jsx"),/ItemList/);
});
test("public library is discoverable and protected pages remain authenticated",()=>{
 const m=read("middleware.js");
 const nav=read("components/Nav.jsx");
 const footer=read("components/Footer.jsx");
 const home=read("components/PremiumEditorial.jsx");
 assert.match(m,/"\/library\(\.\*\)"/);
 assert.match(m,/await auth\.protect\(\)/);
 assert.doesNotMatch(m,/"\/admin\/analytics"/);
 assert.doesNotMatch(m,/"\/terminal\(\.\*\)"/);
 assert.doesNotMatch(m,/"\/research\(\.\*\)"/);
 assert.match(nav,/href: "\/library"/);
 assert.match(footer,/<Link href="\/library"/);
 assert.match(home,/<Link href="\/library"/);
 assert.match(read("components/AnalyticsTracker.jsx"),/path\.startsWith\("\/library\/"\)/);
});
test("reader includes visible disclosures, source links and accessible in-page outline",()=>{
 const reader=read("app/library/[slug]/page.jsx");
 const hub=read("app/library/page.jsx");
 assert.match(reader,/AI assistance/);
 assert.match(reader,/Educational|educational/);
 assert.match(reader,/aria-label="On this page"/);
 assert.match(reader,/item\.sources\.map/);
 assert.match(reader,/rel="noopener noreferrer"/);
 assert.match(reader,/data?tePublished:/); // no hidden date facts
 assert.match(hub,/<h1>/);
 assert.match(hub,/RESEARCH_LIBRARY\.filter/);
 const style=read("app/library/library.css");
 assert.match(style,/prefers-reduced-motion/);
 assert.match(style,/max-width:640px/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("root brand and IPO canonical URLs are independent and use verified www host",()=>{
  const homepage=read("app/page.jsx"),ipo=read("app/ipo/page.jsx"),root=read("app/layout.jsx");
  assert.match(homepage,/alternates: \{ canonical: "\/" \}/);
  assert.match(homepage,/AlphaHedgeQuant \| Quant Finance Research, IPO Intelligence/);
  assert.match(homepage,/"@type": "WebSite"/);
  assert.match(homepage,/"@type": "Organization"/);
  assert.match(ipo,/alternates: \{ canonical: "\/ipo" \}/);
  assert.match(root,/metadataBase: new URL\("https:\/\/www\.alphahedgequant\.com"\)/);
  assert.doesNotMatch(root,/alternates:\s*\{\s*canonical/); // never canonicalize every route to homepage
});
test("homepage and footer provide crawlable links and honest IPO information",()=>{
  const home=read("components/PremiumEditorial.jsx"),footer=read("components/Footer.jsx");
  assert.match(home,/AlphaHedgeQuant IPO Intelligence follows Indian NSE and BSE/);
  assert.match(home,/<Link href="\/ipo"/);
  assert.match(home,/GMP is unofficial|GMP\) and actual listing performance|Reported GMP is unofficial/);
  assert.match(footer,/<Link href="\/ipo" className=.*?>IPO Intelligence<\/Link>/);
});
test("public crawl paths are open but user data and protected financial routes are not",()=>{
  const rules=read("middleware.js"),robots=read("app/robots.js"),sitemap=read("app/sitemap.js");
  for(const path of ['"/"','"/ipo"','"/robots.txt"','"/sitemap.xml"'])assert.ok(rules.includes(path),"missing route "+path);
  assert.doesNotMatch(rules,/"\/admin\/analytics"/);
  assert.match(rules,/await auth\.protect\(\)/);
  assert.match(robots,/allow:\s*"\/"/);
  assert.match(robots,/sitemap:\s*"https:\/\/www\.alphahedgequant\.com\/sitemap\.xml"/);
  assert.match(sitemap,/"\/ipo"/);
  assert.match(sitemap,/https:\/\/www\.alphahedgequant\.com/);
});

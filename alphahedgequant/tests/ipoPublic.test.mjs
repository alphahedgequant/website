import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");

test("IPO calendar and read-only feed are public, account features remain private",()=>{
  const middleware=read("middleware.js");
  assert.match(middleware,/\/ipo",/);
  assert.match(middleware,/\/api\/ipo",/);
  assert.doesNotMatch(middleware,/\/api\/admin\/analytics",/);
  assert.doesNotMatch(middleware,/\/terminal",/);
  assert.match(middleware,/await auth\.protect\(\)/);
});
test("IPO SEO page is crawlable, canonical, and keeps one shared navigation header",()=>{
  const page=read("app/ipo/page.jsx"),sitemap=read("app/sitemap.js");
  assert.match(page,/title: "IPO Intelligence India/);
  assert.match(page,/alternates: \{ canonical: "\/ipo" \}/);
  assert.match(page,/isAccessibleForFree:true/);
  assert.match(page,/<h1 /);
  assert.doesNotMatch(page,/<header\b/);
  assert.match(sitemap,/"\/ipo"/);
});
test("IPO ten-second tour never blocks data or demands login",()=>{
  const page=read("app/ipo/page.jsx"),css=read("app/ipo/ipo-intro.css");
  assert.match(page,/<IpoScreen \/>/);
  assert.match(css,/animation:ipo-intro-10s 10s/);
  assert.doesNotMatch(page,/sign-in|setTimeout|aria-modal/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});
test("IPO summary cards do not navigate to missing dynamic detail routes",()=>{
  const screen=read("components/IpoScreen.jsx");
  assert.doesNotMatch(screen,/\/ipo\/\$\{encodeURIComponent/);
  assert.match(screen,/fetch\("\/api\/ipo"/);
  assert.match(screen,/unofficial/i);
});

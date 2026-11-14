import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import vm from "node:vm";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const check=(label,fn)=>{try{fn();console.log("PASS "+label);}catch(error){console.error("FAIL "+label+": "+error.message);process.exitCode=1;}};

const middleware=read("middleware.js");
check("Competitions index and all tournament profiles are public",()=>{
 assert(middleware.includes('"/competitions(.*)"'));
 assert(middleware.includes("await auth.protect()"));
 for(const protectedRoute of ['/models','/options','/terminal','/analytics']){
   assert(!new RegExp('"/'+protectedRoute.slice(1)+'(\\b|\\()').test(middleware.split("createRouteMatcher([")[1].split("]);")[0]));
 }
});
check("Free chess, registration and notifications API paths",()=>{
 for(const item of ['"/api/competitions/live-chess"','"/api/tournaments/feed"','"/api/tournaments/round(.*)"','"/api/tournaments/standings(.*)"','"/api/tournaments/cache"','"/api/tournaments/push"']){
   assert(middleware.includes(item),item);
 }
});
check("Standalone page is a readable, valid single-file board",()=>{
 const html=read("public/tournaments.html");
 assert(html.includes('FREE ACCESS · NO LOGIN'));
 assert(html.includes('id="search"'));
 assert(html.includes('id="news-archive"'));
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert(script&&script.length>10000);
 new vm.Script(script,{filename:"tournaments.html"});
});
check("Integrated page is embedded without any sign-in redirect",()=>{
 const frame=read("components/CompetitionBoardFrame.jsx");
 const index=read("app/competitions/page.jsx");
 assert(frame.includes('src="/tournaments.html?embedded=1"'));
 assert(frame.includes("FREE TO EXPLORE · NO SIGN-IN"));
 assert(index.includes("isAccessibleForFree:true"));
 assert(!/redirect\(\s*['"]\/sign-in/.test(index));
});
check("Free event profiles do not imply free organiser entry",()=>{
 const profile=read("app/competitions/[slug]/page.jsx");
 assert(profile.includes("free to read without an account"));
 assert(profile.includes("entry fees set by their organisers"));
});
check("Public endpoints keep their own write authorization",()=>{
 const cache=read("app/api/tournaments/cache/route.js");
 const push=read("app/api/tournaments/push/route.js");
 const cron=read("app/api/cron/tournament-push/route.js");
 assert(cache.includes("verifyTournamentGithubToken"));
 assert(push.includes("sameOrigin(req)"));
 assert(cron.includes("process.env.CRON_SECRET"));
 assert(cron.includes("verifyTournamentGithubToken"));
});
check("Feed refresh no longer commits every 30 minutes",()=>{
 const workflow=read("../.github/workflows/refresh-tournaments.yml");
 assert(workflow.includes("id-token: write"));
 assert(workflow.includes("api/tournaments/cache"));
 assert(!workflow.includes("git push"));
 assert(!workflow.includes("contents: write"));
});
check("Tournament snapshot and news fallbacks exist",()=>{
 const d=JSON.parse(read("public/tournaments-data.json")),n=JSON.parse(read("public/tournaments-news.json"));
 assert.equal(d.version,1);assert.equal(n.version,1);
 assert(Array.isArray(d.lichess.official)&&d.lichess.official.length>0);
 assert(Array.isArray(n.items));
});

if(process.env.AHQ_LIVE_COMPETITIONS_SMOKE==="1"){
 for(const path of ["/competitions","/competitions/fide-world-chess-championship-2026","/competitions/global-strategy-challenge-2026","/tournaments.html","/tournaments-data.json","/tournaments-news.json","/api/tournaments/feed?source=chess"]){
   const result=await fetch("https://www.alphahedgequant.com"+path,{redirect:"manual",signal:AbortSignal.timeout(12000)});
   check("Unauthenticated public GET "+path,()=>assert.equal(result.status,200));
 }
}

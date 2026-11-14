/**
 * AHQ Tournament Board fallback updater — Node.js 18+, no npm dependencies.
 *
 * Usage: node refresh-tournaments.mjs
 * Output: tournaments-data.json in the directory containing tournaments.html.
 *
 * When installed in the AHQ Next.js repository, put this script under scripts/
 * and tournaments.html under public/. The output will be public/tournaments-data.json.
 * Scheduled operation can be configured externally (CI/cron). This script does
 * not create a recurring job by itself.
 */
import { readFile, writeFile, rename, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const sourceDir = dirname(fileURLToPath(import.meta.url));
const possiblePublic = resolve(sourceDir, '..', 'public');
async function exists(path) { try { await stat(path); return true; } catch { return false; } }
const outDir = await exists(join(sourceDir, 'tournaments.html')) ? sourceDir :
  await exists(join(possiblePublic, 'tournaments.html')) ? possiblePublic : sourceDir;
const output = join(outDir, 'tournaments-data.json');

async function json(url, accept = 'application/json') {
  const response = await fetch(url, {
    headers: { Accept: accept, 'User-Agent': 'AlphaHedgeQuantTournamentBoard/1.0 (source fallback)' },
    signal: AbortSignal.timeout(16000),
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' from ' + new URL(url).hostname);
  return response.json();
}
async function text(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/x-ndjson,application/json;q=0.9', 'User-Agent': 'AlphaHedgeQuantTournamentBoard/1.0 (source fallback)' },
    signal: AbortSignal.timeout(16000),
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' from ' + new URL(url).hostname);
  return response.text();
}
function ndjson(raw) {
  if (raw.trim().startsWith('[')) {
    try { const array = JSON.parse(raw); return Array.isArray(array) ? array : []; } catch { return []; }
  }
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const row = JSON.parse(line); if (row && typeof row === 'object') out.push(row); } catch { /* skip malformed row */ }
  }
  return out;
}
function hackathons(raw) {
  if (Array.isArray(raw)) return raw;
  for (const k of ['hackathons', 'data', 'results']) if (Array.isArray(raw?.[k])) return raw[k];
  throw new Error('Unrecognised Devpost response; preserving prior snapshot');
}
let previous = {};
try { previous = JSON.parse(await readFile(output, 'utf8')); } catch { /* first run */ }
const next = { version: 1, updatedAt: new Date().toISOString(),
  lichess: previous?.lichess || null, devpost: previous?.devpost || null };
const diagnostics = [];
const [topResult, officialResult, devpostResult] = await Promise.allSettled([
  json('https://lichess.org/api/broadcast/top'),
  text('https://lichess.org/api/broadcast?nb=100'),
  json('https://devpost.com/api/hackathons?status%5B%5D=upcoming&status%5B%5D=open'),
]);
const top = topResult.status === 'fulfilled' ? topResult.value : null;
const official = officialResult.status === 'fulfilled' ? ndjson(officialResult.value).slice(0, 100) : [];
const topValid = !!top && (Array.isArray(top.active) || Array.isArray(top.past?.currentPageResults));
if (topValid || official.length) {
  next.lichess = { updatedAt: new Date().toISOString(),
    top: topValid ? { active: (top.active || []).slice(0, 50), past: { currentPageResults: (top.past?.currentPageResults || []).slice(0, 50) } } : null,
    official };
  diagnostics.push('Lichess: refreshed (' + ((top?.active?.length || 0) + official.length) + ' broadcast entries)');
} else diagnostics.push('Lichess: unreachable; keeping existing data or curated-only fallback');
if (devpostResult.status === 'fulfilled') {
  try {
    const first = hackathons(devpostResult.value);
    // Public discovery is paginated. Later pages are optional, not required
    // to retain the verified first page or the earlier healthy cache.
    const extra=await Promise.allSettled([2,3,4,5].map(page=>
      json('https://devpost.com/api/hackathons?status%5B%5D=upcoming&status%5B%5D=open&page='+page)));
    const merged=[...first];
    for(const response of extra){
      if(response.status!=='fulfilled')continue;
      try{merged.push(...hackathons(response.value));}catch{}
    }
    const seen=new Set(),items=merged.filter(x=>{
      const id=String(x?.id||x?.url||x?.title||"").trim();
      if(!id||seen.has(id))return false;seen.add(id);return true;
    }).slice(0,200);
    next.devpost = { updatedAt: new Date().toISOString(), hackathons: items };
    diagnostics.push('Devpost: refreshed (' + items.length + ' distinct listings, ' + first.length + ' on first page)');
  } catch (error) { diagnostics.push('Devpost: ' + error.message); }
} else diagnostics.push('Devpost: unreachable; keeping existing data or curated-only fallback');
// Avoid replacing a healthy previous snapshot with a collection of nulls.
if (!next.lichess && !next.devpost) {
  console.warn(diagnostics.join('\n'));
  console.warn('No feeds available; no fallback file written. Curated HTML data remains usable.');
  process.exitCode = 1;
} else {
  const tmp = output + '.tmp';
  await writeFile(tmp, JSON.stringify(next, null, 2) + '\n', 'utf8');
  await rename(tmp, output);
  console.log('Updated ' + output);
  console.log(diagnostics.join('\n'));
}


/*
 * Durable, source-attributed recent developments.
 * Headlines are derived ONLY from published Lichess broadcast status and
 * completed PGN Result tags. No positions, engines or claimed move timestamps.
 */
function resultTags(raw,roundId,tour){
 const starts=[...raw.matchAll(/^\[Event\s+"/gm)].map(x=>x.index),found=[];
 for(let i=0;i<starts.length&&found.length<32;i++){
   const block=raw.slice(starts[i],starts[i+1]??raw.length),tags={};
   for(const m of block.matchAll(/^\[([A-Za-z0-9_]+)\s+"((?:\\.|[^"\\])*)"\]\s*$/gm))
     tags[m[1]]=m[2].replace(/\\"/g,'"');
   const white=String(tags.White||'').slice(0,100),black=String(tags.Black||'').slice(0,100),result=tags.Result;
   if(!white||!black||!['1-0','0-1','1/2-1/2'].includes(result))continue;
   if(/^(?:white player|black player|unknown)$/i.test(white)||/^(?:white player|black player|unknown)$/i.test(black))continue;
   const id='result-'+createHash('sha256').update(roundId+'|'+white.toLowerCase()+'|'+black.toLowerCase()+'|'+result).digest('hex').slice(0,20);
   const title=result==='1-0'?white+' defeated '+black:result==='0-1'?black+' defeated '+white:white+' drew with '+black;
   const url=String(tour.url||'');
   found.push({id,type:'result',cat:'chess',title,detail:'Confirmed score '+result+' in published round PGN; no engine analysis claimed.',
      eventId:'l-'+tour.id,tourId:String(tour.id),roundId,
      url:url.startsWith('https://lichess.org/')?url:'https://lichess.org/broadcast',
      observedAt:new Date().toISOString(),source:'Lichess broadcast PGN',timeType:'source_check'});
 }
 return found;
}
async function recentNews(older,newer){
 const file=join(outDir,'tournaments-news.json'),now=new Date().toISOString();
 let previousNews={version:1,items:[]};
 try{const old=JSON.parse(await readFile(file,'utf8'));if(old?.version===1&&Array.isArray(old.items))previousNews=old;}catch{}
 const items=new Map(previousNews.items.filter(x=>x?.id&&Date.parse(x.observedAt)>Date.now()-90*86400000).map(x=>[x.id,x]));
 const oldBroadcasts=new Set((older?.lichess?.top?.active||[]).map(x=>x?.tour?.id).filter(Boolean));
 const active=(newer?.lichess?.top?.active||[]).filter(x=>x?.tour?.id&&x?.tour?.name);
 let additions=0,roundsChecked=0;
 // Only a transition from a previous *valid* index is called a new broadcast.
 if(older?.lichess?.top?.active?.length){
   for(const x of active.slice(0,50)){
     if(oldBroadcasts.has(x.tour.id)||x?.round?.ongoing!==true)continue;
     const id='live-'+String(x.tour.id)+'-'+String(x.round?.id||'active');
     if(items.has(id))continue;
     const url=String(x.tour.url||'');
     items.set(id,{id,type:'broadcast',cat:'chess',title:String(x.tour.name).slice(0,150),
       detail:'New ongoing round appeared in the Lichess broadcast index. Live flag only; score is not implied.',
       eventId:'l-'+x.tour.id,tourId:String(x.tour.id),roundId:String(x.round?.id||''),
       url:url.startsWith('https://lichess.org/')?url:'https://lichess.org/broadcast',
       source:'Lichess broadcast index',timeType:'source_check',observedAt:now});additions++;
   }
 }
 const eligible=active.filter(x=>x?.round?.id&&/^[A-Za-z0-9]{8}$/.test(x.round.id)).sort((a,b)=>Number(b.tour?.tier||0)-Number(a.tour?.tier||0)).slice(0,3);
 const resultResponses=await Promise.allSettled(eligible.map(async x=>{
   const r=await fetch('https://lichess.org/api/broadcast/round/'+x.round.id+'.pgn?clocks=false&comments=false',{
     headers:{Accept:'application/x-chess-pgn','User-Agent':'AlphaHedgeQuantTournamentBoard/1.0 (source PGN news)'},
     signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw Error('PGN HTTP '+r.status);
   if(Number(r.headers.get('content-length')||0)>1200000)throw Error('PGN too large');
   const raw=await r.text();if(raw.length>1200000)throw Error('PGN too large');
   return resultTags(raw,x.round.id,x.tour);
 }));
 for(const result of resultResponses){
   if(result.status!=='fulfilled')continue;
   roundsChecked++;
   for(const news of result.value)if(!items.has(news.id)){items.set(news.id,news);additions++;}
 }
 const arr=[...items.values()].sort((a,b)=>String(b.observedAt).localeCompare(String(a.observedAt))).slice(0,180);
 const output={version:1,updatedAt:now,source:'Lichess index & published PGN; cached by scheduled GitHub Actions',roundsChecked,items:arr};
 const tmp=file+'.tmp';await writeFile(tmp,JSON.stringify(output,null,2)+'\n','utf8');await rename(tmp,file);
 console.log('News archive: '+arr.length+' entries, '+additions+' new, '+roundsChecked+' recent PGNs checked');
}
await recentNews(previous,next);

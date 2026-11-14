/**
 * Reconstructs *published PGN game points* for a Lichess broadcast tournament.
 * This is not an official standing: missing boards, tiebreakers and games with
 * an unreported result cannot be recovered from a PGN export. Read-only, bounded.
 */
export const runtime="nodejs";
export const dynamic="force-dynamic";
const ID=/^[A-Za-z0-9]{8}$/;
const safeName=s=>String(s||"").replace(/[<>\\]/g,"").slice(0,130).trim();
function tagsOf(block){
 const tags={};
 for(const m of block.matchAll(/^\[([A-Za-z0-9_]+)\s+"((?:\\.|[^"\\])*)"\]\s*$/gm))
   tags[m[1]]=m[2].replace(/\\"/g,'"');
 return tags;
}
export function reconstructGames(pgn,id){
 const starts=[...pgn.matchAll(/^\[Event\s+"/gm)].map(m=>m.index);
 const out=[],dedup=new Set();
 for(let i=0;i<starts.length&&out.length<1200;i++){
   const block=pgn.slice(starts[i],starts[i+1]??pgn.length);
   const tags=tagsOf(block);
   const white=safeName(tags.White),black=safeName(tags.Black),result=tags.Result||"*";
   if(!white||!black||/^(?:\?|unknown|white|black|white player|black player)$/i.test(white)||/^(?:\?|unknown|white|black|white player|black player)$/i.test(black))continue;
   if(!["1-0","0-1","1/2-1/2","*"].includes(result))continue;
   const round=safeName(tags.Round||"Unnumbered"),pair=[white.toLowerCase(),black.toLowerCase()].sort().join("|");
   // PGN may contain duplicated relay games: treat identical round + pair as one game.
   const key=round+"|"+pair;
   if(dedup.has(key))continue;
   dedup.add(key);
   out.push({round,white,black,result,whiteScore:result==="1-0"?1:result==="0-1"?0:result==="1/2-1/2"?.5:null,
     blackScore:result==="0-1"?1:result==="1-0"?0:result==="1/2-1/2"?.5:null});
 }
 return out;
}
export function publishedScoreboard(games){
 const map=new Map();
 for(const g of games){
   if(g.whiteScore===null||g.blackScore===null)continue;
   for(const [name,score] of [[g.white,g.whiteScore],[g.black,g.blackScore]]){
     const k=name.toLowerCase().trim();if(!k)continue;
     const p=map.get(k)||{name,points:0,played:0,wins:0,draws:0,losses:0};
     p.points+=score;p.played++;p.wins+=score===1?1:0;p.draws+=score===.5?1:0;p.losses+=score===0?1:0;map.set(k,p);
   }
 }
 return [...map.values()].sort((a,b)=>b.points-a.points||b.wins-a.wins||a.name.localeCompare(b.name)).slice(0,100);
}
async function publicRoundFeed(tourId){
  const r=await fetch("https://lichess.org/api/broadcast?nb=100",{
    headers:{Accept:"application/x-ndjson,application/json;q=0.9"},
    next:{revalidate:120},signal:AbortSignal.timeout(6000)
  });
  if(!r.ok)throw Error("Official broadcast index unavailable");
  const raw=await r.text();if(raw.length>2300000)throw Error("Broadcast index too large");
  const rows=[];
  if(raw.trimStart().startsWith("[")){
    const a=JSON.parse(raw);if(Array.isArray(a))rows.push(...a.slice(0,100));
  }else for(const line of raw.split(/\r?\n/)){
    if(!line.trim())continue;
    try{rows.push(JSON.parse(line));}catch{}
    if(rows.length>=100)break;
  }
  const found=rows.find(x=>x?.tour?.id===tourId);
  if(!found?.rounds?.length)return null;
  const rounds=found.rounds.filter(x=>ID.test(x?.id||"")).slice(-5);
  return {rounds,totalRounds:found.rounds.length};
}
async function getRoundPGN(round){
  const r=await fetch("https://lichess.org/api/broadcast/round/"+round.id+".pgn?clocks=false&comments=false",{
    headers:{Accept:"application/x-chess-pgn"},next:{revalidate:120},signal:AbortSignal.timeout(7000)});
  if(!r.ok)throw Error("Round export unavailable");
  const len=Number(r.headers.get("content-length")||0);
  if(len>1200000)throw Error("Round export too large");
  const raw=await r.text();if(raw.length>1200000)throw Error("Round export too large");
  return reconstructGames(raw,round.id).map(g=>({...g,round:String(round.name||"Round")+" / "+g.round,roundId:round.id}));
}
export async function GET(_req,{params}){
 const {id}=await params;
 if(!ID.test(id||""))return Response.json({error:"Invalid Lichess broadcast tournament ID"},{status:400});
 try{
   let games=[],coverage="Accessible full tournament PGN",totalRounds=null,loadedRounds=null;
   try{
     const r=await fetch("https://lichess.org/api/broadcast/"+id+".pgn?clocks=false&comments=false",{headers:{Accept:"application/x-chess-pgn"},
       next:{revalidate:180},signal:AbortSignal.timeout(5500)});
     if(!r.ok)throw Error("Full export unavailable");
     const limit=3500000,length=Number(r.headers.get("content-length")||0);
     if(length>limit)throw Error("Full export too large");
     const raw=await r.text();if(raw.length>limit)throw Error("Full export too large");
     games=reconstructGames(raw,id);
     if(!games.length)throw Error("No verified games in full export");
   }catch{
     // Last-resort fallback: source-verified round IDs from the official
     // broadcast index, not caller-supplied IDs or untrusted URLs.
     const found=await publicRoundFeed(id);
     if(!found?.rounds?.length)throw Error("No public official rounds found");
     const responses=await Promise.allSettled(found.rounds.map(getRoundPGN));
     games=responses.filter(x=>x.status==="fulfilled").flatMap(x=>x.value);
     loadedRounds=responses.filter(x=>x.status==="fulfilled").length;
     totalRounds=found.totalRounds;
     coverage="Partial published PGN: "+loadedRounds+" recent rounds out of "+totalRounds+" indexed rounds";
     if(!games.length)throw Error("No published games in accessible rounds");
   }
   const scores=publishedScoreboard(games),pending=games.filter(x=>x.result==="*").length;
   return Response.json({source:"Lichess public broadcast PGN",tourId:id,checkedAt:new Date().toISOString(),
     coverage,complete:"partial/unverified",totalRounds,loadedRounds,
     gameCount:games.length,scoredGames:games.length-pending,pendingGames:pending,
     players:scores,rounds:[...new Set(games.map(g=>g.round))].slice(0,40),
     samplePairings:games.slice(-35).map(({round,white,black,result})=>({round,white,black,result})),
     caveat:"Published PGN-derived points only. Neither the entire event's coverage nor official standings, tiebreaks or final prizes can be guaranteed."},
     {headers:{"Cache-Control":"public, s-maxage=180, stale-while-revalidate=240"}});
 }catch{
   return Response.json({error:"Full tournament PGN and available official round exports could not be verified. Use the organiser's published standings."},
     {status:503,headers:{"Cache-Control":"no-store"}});
 }
}

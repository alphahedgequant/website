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
export async function GET(_req,{params}){
 const {id}=await params;
 if(!ID.test(id||""))return Response.json({error:"Invalid Lichess broadcast tournament ID"},{status:400});
 try{
   const r=await fetch("https://lichess.org/api/broadcast/"+id+".pgn?clocks=false&comments=false",{headers:{Accept:"application/x-chess-pgn"},
     next:{revalidate:180},signal:AbortSignal.timeout(12000)});
   if(!r.ok)throw Error("Lichess HTTP "+r.status);
   const limit=3500000;
   const len=Number(r.headers.get("content-length")||0);
   if(len>limit)throw Error("Broadcast too large");
   const raw=await r.text();
   if(raw.length>limit)throw Error("Broadcast too large");
   const games=reconstructGames(raw,id),scores=publishedScoreboard(games);
   const pending=games.filter(x=>x.result==="*").length;
   return Response.json({source:"Lichess full tournament PGN",tourId:id,checkedAt:new Date().toISOString(),
     gameCount:games.length,scoredGames:games.length-pending,pendingGames:pending,
     players:scores,rounds:[...new Set(games.map(g=>g.round))].slice(0,40),
     samplePairings:games.slice(-35).map(({round,white,black,result})=>({round,white,black,result})),
     caveat:"Computed points from the accessible broadcast PGN only. This is NOT an official ranking, final standings or tiebreak result. Missing games and phases are not included."},
     {headers:{"Cache-Control":"public, s-maxage=180, stale-while-revalidate=240"}});
 }catch{
   return Response.json({error:"Tournament PGN unavailable or too large; no standings have been inferred."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}

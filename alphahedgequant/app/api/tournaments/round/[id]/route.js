/**
 * Source-linked chess recap feed. Never invents moves, results, evaluations,
 * timestamps, or blunders. A fixed, public Lichess endpoint is fetched only
 * when the round ID is exactly eight ASCII letters/numbers.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ROUND_ID=/^[A-Za-z0-9]{8}$/;
const SAN=/^(?:O-O(?:-O)?|[KQRBN]?[a-h1-8]{0,2}x?[a-h][1-8](?:=[QRBN])?)[+#?!]*$/;

function tokenize(pgn){
  let clean=pgn.replace(/^\[[^\r\n]*\]\s*$/gm," ")
    .replace(/\{[\s\S]*?\}/g," ")
    .replace(/;[^\n]*/g," ")
    .replace(/\([^)]*\)/g," ");
  // PGN may contain nested variations; peel any remaining one level.
  for(let i=0;i<3;i++)clean=clean.replace(/\([^()]*\)/g," ");
  clean=clean.replace(/\d+\.(?:\.\.)?/g," ").replace(/\$\d+/g," ");
  return clean.split(/\s+/).filter(x=>SAN.test(x)).slice(0,750);
}

function summary(san){
  if(!san)return null;
  const move=san.replace(/[!?]/g,"");
  if(move.startsWith("O-O"))return {
    move:san,flag:"CASTLING",
    explanation:move.startsWith("O-O-O")
      ?"The king and rook moved in a queenside castle. This is a legal king-safety move; it does not by itself establish an advantage."
      :"The king and rook moved in a kingside castle. This is a legal king-safety move; it does not by itself establish an advantage."
  };
  const pieceName={K:"king",Q:"queen",R:"rook",B:"bishop",N:"knight"};
  const piece=pieceName[move[0]]||"pawn";
  const dest=move.match(/[a-h][1-8](?:(?:=[QRBN])?[+#]?)$/)?.[0]?.slice(0,2)||"";
  const bits=[];
  if(move.includes("x"))bits.push("captured an opposing piece");
  else bits.push("moved to "+dest);
  if(move.includes("="))bits.push("promoted");
  if(move.includes("#"))bits.push("delivered checkmate (as recorded in the PGN)");
  else if(move.includes("+"))bits.push("gave check");
  const explanation="The "+piece+" "+bits.join(" and ")+". "+(
    move.includes("#")
      ?"The notation # identifies checkmate, not merely a favorable evaluation."
      :move.includes("+")
        ?"The notation + means the opposing king is in check and must respond."
        :"A move alone does not prove a blunder or a winning position; see the full board and any source annotations."
  );
  return {move:san,flag:move.includes("#")?"CHECKMATE":move.includes("+")?"CHECK":move.includes("=")?"PROMOTION":move.includes("x")?"CAPTURE":"MOVE",explanation};
}

function extract(pgn,roundId){
  const starts=[...pgn.matchAll(/^\[Event\s+"/gm)].map(m=>m.index);
  if(!starts.length)return [];
  const out=[];
  for(let i=0;i<starts.length&&out.length<32;i++){
    const block=pgn.slice(starts[i],starts[i+1]??pgn.length);
    const tags={};
    for(const m of block.matchAll(/^\[([A-Za-z0-9_]+)\s+"((?:\\.|[^"\\])*)"\]\s*$/gm)){
      tags[m[1]]=m[2].replace(/\\"/g,'"');
    }
    const moves=tokenize(block),last=moves.at(-1)||"";
    const white=tags.White||"White player",black=tags.Black||"Black player";
    const result=tags.Result||"*";
    const verdict=result==="1-0"?white+" won with White":result==="0-1"?black+" won with Black":
      result==="1/2-1/2"?"Game drawn":"No final result in the source yet";
    const roundDate=/^\d{4}\.\d{2}\.\d{2}$/.test(tags.UTCDate||"")?
      tags.UTCDate.replace(/\./g,"-"):null;
    const time=/^\d{2}:\d{2}:\d{2}$/.test(tags.UTCTime||"")?tags.UTCTime:null;
    out.push({
      id:roundId+"-"+i,
      white,black,result,verdict,round:tags.Round||null,
      opening:tags.Opening||null,eco:tags.ECO||null,
      moveCount:Math.ceil(moves.length/2),
      lastMove:last,lastMoveIndex:moves.length,
      recentMoves:moves.slice(-10),
      notable:summary([...moves].reverse().find(m=>/[+#=]/.test(m))||last),
      playedAt:roundDate?(roundDate+(time?"T"+time+"Z":"")):null,
      // This may be supplied for a chess960/variant initial setup; don't
      // confuse it with the final board position.
      startFen:tags.FEN||null,
    });
  }
  return out;
}

export async function GET(_req,{params}){
  const {id}=await params;
  if(!ROUND_ID.test(id||""))return Response.json({error:"Invalid broadcast round"},{status:400});
  try{
    const upstream=await fetch("https://lichess.org/api/broadcast/round/"+id+".pgn?clocks=false&comments=true",{
      headers:{Accept:"application/x-chess-pgn"},
      next:{revalidate:60},
      signal:AbortSignal.timeout(12500)
    });
    if(!upstream.ok)throw Error("Upstream unavailable");
    const content=await upstream.text();
    if(content.length>1900000)throw Error("Broadcast export too large");
    const games=extract(content,id);
    return Response.json({
      source:"Lichess broadcast PGN",roundId:id,games,checkedAt:new Date().toISOString(),
      notices:games.length?[]:["No game scores have been published in this round's accessible PGN."],
      caveat:"PGN moves and results are evidence, not computer-engine analysis. Do not infer a blunder, forced mate or advantage without supporting annotations."
    },{headers:{"Cache-Control":"public, s-maxage=60, stale-while-revalidate=120"}});
  }catch{
    return Response.json({error:"PGN is unavailable; results cannot be verified right now."},
      {status:503,headers:{"Cache-Control":"no-store"}});
  }
}

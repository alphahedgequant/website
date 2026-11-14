export const runtime="nodejs";
export const revalidate=300;
// A bounded, public, read-only feed. No API key, credentials or personal data.
export async function GET() {
  try {
    const response=await fetch("https://lichess.org/api/broadcast/top",{
      headers:{Accept:"application/json","User-Agent":"AlphaHedgeQuant/1.0 (public competition discovery)"},
      next:{revalidate:300}, signal:AbortSignal.timeout(6500)
    });
    if(!response.ok) throw new Error("Upstream unavailable");
    const raw=await response.json();
    const active=Array.isArray(raw?.active)?raw.active:[];
    const items=active.slice(0,12).map((item,i)=>{
      const tour=item?.tour||item?.tournament||{};
      const round=item?.round||{};
      const id=typeof tour.id==="string" && /^[A-Za-z0-9]{6,20}$/.test(tour.id)?tour.id:null;
      const rawUrl=typeof tour.url==="string"?tour.url:"";
      const url=rawUrl.startsWith("https://lichess.org/broadcast/")?rawUrl:(id?"https://lichess.org/broadcast/"+id:"https://lichess.org/broadcast");
      return {
        id:id||"live-"+i, title:String(tour.name||item?.name||"Lichess broadcast").slice(0,150),
        round:String(round.name||"Round schedule").slice(0,80),isLive:round.ongoing===true,url,
        players:Array.isArray(tour.topPlayers)?tour.topPlayers.filter(x=>typeof x==="string").slice(0,8):[]
      };
    });
    return Response.json({status:"ok",provider:"Lichess",fetchedAt:new Date().toISOString(),events:items},{
      headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=300"}
    });
  }catch{
    return Response.json({status:"unavailable",provider:"Lichess",events:[],message:"Live source temporarily unavailable. Open Lichess for current broadcasts."},{
      status:200,headers:{"Cache-Control":"public, s-maxage=60"}
    });
  }
}

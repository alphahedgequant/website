import {ensurePushTable,configured,deliverPush} from "@/lib/tournamentWebPush.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req){
 const token=process.env.CRON_SECRET;
 if(!token||req.headers.get("authorization")!=="Bearer "+token)
   return Response.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 if(!configured())return Response.json({error:"Push configuration missing"},{status:503});
 try{
   const res=await fetch("https://www.alphahedgequant.com/tournaments-news.json",{
     cache:"no-store",signal:AbortSignal.timeout(7000)});
   if(!res.ok)throw Error("News archive unreadable");
   const archive=await res.json();
   if(archive.version!==1||!Array.isArray(archive.items))throw Error("Invalid archive");
   const now=Date.now();
   const events=archive.items
     .filter(x=>x?.type==="result"&&typeof x.title==="string"&&Number.isFinite(Date.parse(x.observedAt))&&
       now-Date.parse(x.observedAt)<48*3600000&&now-Date.parse(x.observedAt)>0)
     .sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
   if(!events.length)return Response.json({ok:true,checked:0,sent:0,note:"No recent published results"},{headers:{"Cache-Control":"no-store"}});
   const db=await ensurePushTable();
   const rows=await db`SELECT endpoint,p256dh,auth,last_seen_at FROM ahq_tournament_push
     ORDER BY updated_at DESC LIMIT 24`;
   let sent=0,invalid=0,failed=0,checked=0;
   for(let start=0;start<rows.length;start+=4){
     const batch=rows.slice(start,start+4);
     await Promise.all(batch.map(async sub=>{
       checked++;
       const last=Date.parse(sub.last_seen_at)||0;
       const fresh=events.filter(x=>Date.parse(x.observedAt)>last);
       if(!fresh.length)return;
       const headline=fresh[0],lastTimestamp=headline.observedAt;
       const payload={title:"AHQ · Verified chess results",
         body:headline.title+(fresh.length>1?" · "+(fresh.length-1)+" more result updates":""),
         url:"/competitions",tag:"ahq-tournament-results",count:fresh.length};
       try{
         const result=await deliverPush({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},payload);
         if(result.invalid){
           await db`DELETE FROM ahq_tournament_push WHERE endpoint=${sub.endpoint}`;invalid++;
         }else if(result.ok){
           await db`UPDATE ahq_tournament_push SET last_seen_at=GREATEST(last_seen_at,${lastTimestamp}::timestamptz)
             WHERE endpoint=${sub.endpoint}`;sent++;
         }else failed++;
       }catch{failed++}
     }));
   }
   return Response.json({ok:true,checked,sent,invalid,failed,newsItems:events.length},
     {headers:{"Cache-Control":"no-store"}});
 }catch{
   return Response.json({error:"Push dispatch unavailable; no messages were reported as delivered"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}

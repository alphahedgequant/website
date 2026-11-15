import {configured,getPublicKey,ensurePushTable,validateSubscription,deliverPush} from "@/lib/tournamentWebPush.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function sameOrigin(req){
 const origin=req.headers.get("origin");
 try{return Boolean(origin)&&new URL(origin).host===new URL(req.url).host&&new URL(origin).protocol==="https:"}catch{return false}
}
export async function GET(){
 return Response.json({enabled:configured(),publicKey:getPublicKey(),note:"Browser permission is required. On iOS, installing the site to the Home Screen may be necessary."},
   {headers:{"Cache-Control":"no-store"}});
}
export async function POST(req){
 if(!sameOrigin(req))return Response.json({error:"Same-origin request required"},{status:403});
 if(!configured())return Response.json({error:"Notifications are not configured"},{status:503});
 let input;try{input=await req.json()}catch{return Response.json({error:"Invalid JSON"},{status:400})}
 const subscription=validateSubscription(input?.subscription);
 if(!subscription)return Response.json({error:"Unsupported or malformed push subscription"},{status:400});
 if(!["subscribe","unsubscribe","test"].includes(input?.action))return Response.json({error:"Unknown action"},{status:400});
 try{
   const db=await ensurePushTable();
   if(input.action==="test"){
     // A user-initiated, rate-limited test to a subscription already registered
     // for this exact endpoint and cryptographic key pair.
     await db`ALTER TABLE ahq_tournament_push ADD COLUMN IF NOT EXISTS last_test_at TIMESTAMPTZ NULL`;
     const rows=await db`UPDATE ahq_tournament_push
       SET last_test_at=NOW()
       WHERE endpoint=${subscription.endpoint}
         AND p256dh=${subscription.p256dh}
         AND auth=${subscription.auth}
         AND (last_test_at IS NULL OR last_test_at < NOW()-INTERVAL '10 minutes')
       RETURNING endpoint`;
     if(rows.length!==1)return Response.json(
       {error:"Subscription not found or a test was sent within the last 10 minutes."},
       {status:429,headers:{"Cache-Control":"no-store"}});
     const payload={title:"AHQ · Test notification",
       body:"Your Competition Dashboard push subscription is active. This is a requested test, not a tournament result.",
       url:"/competitions",tag:"ahq-test-competitions"};
     const result=await deliverPush({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}},payload);
     if(result.invalid)await db`DELETE FROM ahq_tournament_push WHERE endpoint=${subscription.endpoint}`;
     if(!result.ok)return Response.json(
       {ok:false,error:"The push provider did not accept the test message.",providerStatus:result.status},
       {status:502,headers:{"Cache-Control":"no-store"}});
     return Response.json({ok:true,accepted:true,
       note:"Push provider accepted the test. Check your device notification settings; display is not independently confirmed."},
       {headers:{"Cache-Control":"no-store"}});
   }
   if(input.action==="unsubscribe"){
     await db`DELETE FROM ahq_tournament_push WHERE endpoint=${subscription.endpoint}`;
     return Response.json({ok:true,subscribed:false},{headers:{"Cache-Control":"no-store"}});
   }
   await db`INSERT INTO ahq_tournament_push (endpoint,p256dh,auth,created_at,updated_at,last_seen_at)
     VALUES (${subscription.endpoint},${subscription.p256dh},${subscription.auth},NOW(),NOW(),NOW())
     ON CONFLICT (endpoint) DO UPDATE SET
       p256dh=excluded.p256dh,auth=excluded.auth,updated_at=NOW(),last_seen_at=NOW()`;
   return Response.json({ok:true,subscribed:true},{headers:{"Cache-Control":"no-store"}});
 }catch{
   return Response.json({error:"Notification storage temporarily unavailable"},{status:503});
 }
}

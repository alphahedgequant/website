import {recordClientEvent,deleteMyAnonymousEvents,isAllowedEventOrigin,validClientEvent,validAnonymousId} from "@/lib/firstPartyInsights.mjs";
import {useRequestQuota,quotaResponse,trustedClientIp} from "@/lib/serverRateLimit.mjs";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const MAX_BYTES=1400;
const json=(body,status)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});

async function parseLimited(request){
  const length=Number(request.headers.get("content-length")||"0");
  if(!Number.isFinite(length)||length<0||length>MAX_BYTES)return {error:413};
  const body=await request.text();
  if(body.length>MAX_BYTES)return {error:413};
  try{return {value:JSON.parse(body)}}catch{return {error:400}};
}

export async function POST(request){
  if(!isAllowedEventOrigin(request))return json({error:"Forbidden"},403);
  const parsed=await parseLimited(request);
  if(parsed.error)return json({error:parsed.error===413?"Payload too large":"Invalid JSON"},parsed.error);
  const event=validClientEvent(parsed.value);
  if(!event)return json({error:"Invalid analytics event"},400);
  try{
    const quota=await useRequestQuota({
      namespace:"insights-client-minute",identity:trustedClientIp(request.headers),
      limit:120,windowSeconds:60
    });
    if(!quota.allowed)return quotaResponse(quota);
    await recordClientEvent(event);
    return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
  }catch{
    return json({error:"Analytics temporarily unavailable"},503);
  }
}
// A browser holding its random, unguessable visitor ID may erase the linked
// analytics history. This never deletes any authenticated user record.
export async function DELETE(request){
  if(!isAllowedEventOrigin(request))return json({error:"Forbidden"},403);
  const parsed=await parseLimited(request);
  if(parsed.error)return json({error:"Invalid request"},parsed.error);
  const visitor=parsed.value?.visitor;
  if(!validAnonymousId(visitor))return json({error:"Invalid request"},400);
  try{
    const quota=await useRequestQuota({
      namespace:"insights-erase-day",identity:trustedClientIp(request.headers),
      limit:10,windowSeconds:86400
    });
    if(!quota.allowed)return quotaResponse(quota);
    await deleteMyAnonymousEvents(visitor);
    return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
  }catch{
    return json({error:"Deletion temporarily unavailable"},503);
  }
}
export function GET(){return json({error:"Method not allowed"},405)}

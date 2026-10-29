import {neon} from "@neondatabase/serverless";
import {auth,currentUser} from "@clerk/nextjs/server";
import {fetchHistory,utcDay} from "@/lib/trackerScoring";
async function editorError(){
 const {userId}=auth();
 if(!userId)return Response.json({success:false,error:"Sign in required"},{status:401});
 const allowed=(process.env.AHQ_TRACKER_ADMIN_EMAILS||process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!allowed.length)return Response.json({success:false,error:"Tracker admin not configured"},{status:403});
 const user=await currentUser();
 const verified=(user?.emailAddresses||[]).filter(x=>x.verification?.status==="verified").map(x=>x.emailAddress.toLowerCase());
 if(!verified.some(x=>allowed.includes(x)))return Response.json({success:false,error:"Only approved editors can modify calls"},{status:403});
 return null;
}
export async function DELETE(request,{params}){
 const denied=await editorError();if(denied)return denied;
 const id=Number(params.id);if(!Number.isSafeInteger(id)||id<=0)return Response.json({success:false,error:"Invalid ID"},{status:400});
 if(!process.env.NEON_DATABASE_URL)return Response.json({success:false,error:"Database unavailable"},{status:503});
 try{const sql=neon(process.env.NEON_DATABASE_URL);await sql`DELETE FROM analyst_calls WHERE id=${id}`;return Response.json({success:true});}
 catch{return Response.json({success:false,error:"Could not remove call"},{status:503});}
}
export async function PATCH(request,{params}){
 const denied=await editorError();if(denied)return denied;
 const id=Number(params.id);if(!Number.isSafeInteger(id)||id<=0)return Response.json({success:false,error:"Invalid ID"},{status:400});
 if(!process.env.NEON_DATABASE_URL)return Response.json({success:false,error:"Database unavailable"},{status:503});
 let body;try{body=await request.json()}catch{return Response.json({success:false,error:"Invalid body"},{status:400})}
 if(!["verified","unverified"].includes(body?.status))return Response.json({success:false,error:"Invalid status"},{status:400});
 try{
  const sql=neon(process.env.NEON_DATABASE_URL);
  const rows=await sql`SELECT * FROM analyst_calls WHERE id=${id} LIMIT 1`;
  if(!rows.length)return Response.json({success:false,error:"Call not found"},{status:404});
  const c=rows[0];
  if(body.status==="verified"){
    if(!c.source_url || !/^https:\/\//.test(c.source_url))return Response.json({success:false,error:"Original report URL required"},{status:400});
    const bars=await fetchHistory(c.symbol);
    const day=utcDay(c.call_date);
    const near=bars.find(b=>{const x=utcDay(b.date);return x && day && Math.abs(x-day)<=3*86400000;});
    if(!near)return Response.json({success:false,error:"Historical price evidence unavailable for call date"},{status:409});
    const price=Number(c.price_at_call),lo=Number(near.low),hi=Number(near.high);
    if(!Number.isFinite(lo)||!Number.isFinite(hi)||price<lo*0.98||price>hi*1.02)
      return Response.json({success:false,error:"Entry price falls outside historical day range; check corporate actions and source"},{status:409});
  }
  await sql`UPDATE analyst_calls SET verification_status=${body.status} WHERE id=${id}`;
  return Response.json({success:true,status:body.status});
 }catch{return Response.json({success:false,error:"Unable to update verification"},{status:503})}
}

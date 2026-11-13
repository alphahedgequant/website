import {auth,currentUser} from "@clerk/nextjs/server";
import {isInsightsOwner} from "@/lib/insightsOwnerAccess.mjs";
export const dynamic="force-dynamic";
export async function GET(){
 const {userId}=await auth();
 if(!userId)return Response.json({canEdit:false},{headers:{"Cache-Control":"private,no-store"}});
 const allowed=(process.env.AHQ_TRACKER_ADMIN_EMAILS||process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"")
  .split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
 let canEdit=false;
 if(allowed.length){
  const user=await currentUser();
  const verified=(user?.emailAddresses||[]).filter(x=>x.verification?.status==="verified")
   .map(x=>x.emailAddress.toLowerCase());
  canEdit=verified.some(x=>allowed.includes(x));
 }else canEdit=await isInsightsOwner();
 return Response.json({canEdit:Boolean(canEdit)},{headers:{"Cache-Control":"private,no-store"}});
}

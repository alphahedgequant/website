import {auth,currentUser} from "@clerk/nextjs/server";

// Fail closed: do not infer "owner" from whoever logged in first, a public
// email, or membership of a multi-admin website allowlist.
export async function isInsightsOwner(){
  const allowedId=(process.env.AHQ_INSIGHTS_OWNER_USER_ID||"").trim();
  const allowedEmail=(process.env.AHQ_INSIGHTS_OWNER_EMAIL||"").trim().toLowerCase();
  if(!allowedId&&!allowedEmail)return false;
  const {userId}=await auth();
  if(!userId)return false;
  if(allowedId&&allowedId!==userId)return false;
  if(allowedEmail){
    const user=await currentUser();
    if(!user||user.id!==userId)return false;
    const verified=(user.emailAddresses||[]).some(e=>
      e.verification?.status==="verified"&&
      e.emailAddress?.trim().toLowerCase()===allowedEmail
    );
    if(!verified)return false;
  }
  return true;
}

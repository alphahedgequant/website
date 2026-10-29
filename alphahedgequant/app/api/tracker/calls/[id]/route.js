// app/api/tracker/calls/[id]/route.js
// DELETE a single analyst call by id.
import { neon } from "@neondatabase/serverless";
import {auth,currentUser} from "@clerk/nextjs/server";

export async function DELETE(request, { params }) {
  const {userId}=auth();
  if(!userId)return Response.json({success:false,error:"Sign in required"},{status:401});
  const allowed=(process.env.AHQ_TRACKER_ADMIN_EMAILS||process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!allowed.length)return Response.json({success:false,error:"Tracker admin not configured"},{status:403});
  const user=await currentUser();
  const verified=(user?.emailAddresses||[]).filter(x=>x.verification?.status==="verified").map(x=>x.emailAddress.toLowerCase());
  if(!verified.some(x=>allowed.includes(x)))return Response.json({success:false,error:"Only approved editors can remove calls"},{status:403});
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return Response.json({ success: false, error: "Database not configured." }, { status: 500 });
    }
    const id = Number(params.id);
    if (!id) return Response.json({ success: false, error: "Invalid id." }, { status: 400 });
    const sql = neon(process.env.NEON_DATABASE_URL);
    await sql`DELETE FROM analyst_calls WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (e) {
    console.error("[Tracker DELETE]", e);
    return Response.json({ success: false, error: "Could not delete call." }, { status: 500 });
  }
}

// app/api/waitlist/route.js
import { neon } from "@neondatabase/serverless";
import {useRequestQuota,quotaResponse,trustedClientIp} from "@/lib/serverRateLimit.mjs";
import {recordConfirmedWaitlistSignup} from "@/lib/firstPartyInsights.mjs";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const MAX_BODY_BYTES = 8192;
const MAX_EMAIL_LENGTH = 254;
const MAX_SOURCE_LENGTH = 80;

export async function POST(request) {
  try {
    const declaredSize = Number(request.headers.get("content-length") || 0);
    if (declaredSize > MAX_BODY_BYTES) return Response.json({success:false,error:"Request too large."},{status:413});
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return Response.json({success:false,error:"Request too large."},{status:413});
    let body;
    try { body = JSON.parse(raw); } catch { return Response.json({success:false,error:"Invalid JSON."},{status:400}); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({success:false,error:"Invalid request."},{status:400});
    const { email } = body;
    const source = body.source == null ? "landing" : body.source;
    if(typeof source !== "string" || source.length > MAX_SOURCE_LENGTH || !/^[a-zA-Z0-9 _./:-]{1,80}$/.test(source))
      return Response.json({success:false,error:"Invalid signup source."},{status:400});

    if (!email || typeof email !== "string") {
      return Response.json({ success: false, error: "Email is required." }, { status: 400 });
    }
    const cleaned = email.trim().toLowerCase();
    if (cleaned.length > MAX_EMAIL_LENGTH || !isValidEmail(cleaned)) {
      return Response.json({ success: false, error: "Invalid email address." }, { status: 400 });
    }

    if (!process.env.NEON_DATABASE_URL) {
      console.error("[Waitlist] NEON_DATABASE_URL not set");
      return Response.json({ success: false, error: "Database not configured." }, { status: 500 });
    }

    let quota;
    try {
      quota = await useRequestQuota({
        namespace:"waitlist-ip",identity:trustedClientIp(request.headers),
        limit:3,windowSeconds:3600
      });
    } catch {
      return Response.json({success:false,error:"Signup temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});
    }
    if (!quota.allowed) return quotaResponse(quota);

    const sql = neon(process.env.NEON_DATABASE_URL);
    const inserted = await sql`
      INSERT INTO waitlist (email, source)
      VALUES (${cleaned}, ${source})
      ON CONFLICT (email) DO NOTHING RETURNING email
    `;

    if(inserted.length>0){
      // This conversion represents a confirmed NEW waitlist row, never a
      // user-submitted "signup successful" event. Analytics errors cannot
      // invalidate an otherwise successful user registration.
      try{
        await recordConfirmedWaitlistSignup({
          visitor:body.analyticsVisitor,session:body.analyticsSession,
          source:body.analyticsSource||source,campaign:body.analyticsUtmCampaign
        });
      }catch{/* Independent optional telemetry must not break waitlist signup. */}
    }

    return Response.json({
      success: true,
      message: "You're on the list. We'll be in touch.",
    });

  } catch (error) {
    if (error.code === "23505") {
      return Response.json({
        success: true,
        message: "You're already on the waitlist.",
      });
    }
    console.error("[Waitlist] Error:", error);
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed." }, { status: 405 });
}

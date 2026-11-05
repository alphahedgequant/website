// app/api/waitlist/route.js
import { neon } from "@neondatabase/serverless";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const recentIPs = new Map();
const MAX_BODY_BYTES = 8192;
const MAX_EMAIL_LENGTH = 254;
const MAX_SOURCE_LENGTH = 80;
const RATE_LIMIT = 3;
const WINDOW_MS  = 60 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = recentIPs.get(ip);
  if (!entry) { recentIPs.set(ip, { count: 1, firstSeen: now }); return false; }
  if (now - entry.firstSeen > WINDOW_MS) { recentIPs.set(ip, { count: 1, firstSeen: now }); return false; }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(ip)) {
      return Response.json(
        { success: false, error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

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

    const sql = neon(process.env.NEON_DATABASE_URL);
    await sql`
      INSERT INTO waitlist (email, source)
      VALUES (${cleaned}, ${source})
      ON CONFLICT (email) DO NOTHING
    `;

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

// app/api/waitlist/route.js
import { neon } from "@neondatabase/serverless";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const recentIPs = new Map();
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

    const body = await request.json();
    const { email, source = "landing" } = body;

    if (!email || typeof email !== "string") {
      return Response.json({ success: false, error: "Email is required." }, { status: 400 });
    }
    const cleaned = email.trim().toLowerCase();
    if (!isValidEmail(cleaned)) {
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

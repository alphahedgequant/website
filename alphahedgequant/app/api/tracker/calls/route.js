// app/api/tracker/calls/route.js
// Trust Tracker — list + add analyst calls. Uses the SAME Neon setup as waitlist.
// GET  -> all calls, each auto-scored against the live price (via your Express /api/prices)
// POST -> add a new call
import { neon } from "@neondatabase/serverless";
import {fetchHistory,scoreAnalystCall} from "@/lib/trackerScoring";
import {auth,currentUser} from "@clerk/nextjs/server";

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS analyst_calls (
      id            SERIAL PRIMARY KEY,
      house         TEXT NOT NULL,
      symbol        TEXT NOT NULL,
      rating        TEXT NOT NULL DEFAULT 'BUY',
      target_price  NUMERIC NOT NULL,
      price_at_call NUMERIC NOT NULL,
      call_date     DATE NOT NULL,
      horizon_days  INTEGER NOT NULL DEFAULT 365,
      note          TEXT,
      created_at    TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql`ALTER TABLE analyst_calls ADD COLUMN IF NOT EXISTS source_url TEXT`;
  await sql`ALTER TABLE analyst_calls ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'`;
}
 
export async function GET() {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return Response.json({ success: false, error: "Database not configured." }, { status: 500 });
    }
    const sql = neon(process.env.NEON_DATABASE_URL);
    await ensureTable(sql);
    const rows = await sql`SELECT * FROM analyst_calls ORDER BY call_date DESC, id DESC`;

    const symbols = [...new Set(rows.map((r) => r.symbol))];
    const priceCache = {};
    await Promise.all(symbols.map(async (s) => { priceCache[s] = await fetchHistory(s); }));

    const calls = rows.map((c) => ({ ...c, ...scoreAnalystCall(c, priceCache[c.symbol] || []) }));
    return Response.json({ success: true, calls });
  } catch (e) {
    console.error("[Tracker GET]", e);
    return Response.json({ success: false, error: "Could not load calls." }, { status: 500 });
  }
}

export async function POST(request) {
  const {userId}=auth();
  if(!userId)return Response.json({success:false,error:"Sign in required"},{status:401});
  const allowed=(process.env.AHQ_TRACKER_ADMIN_EMAILS||process.env.AHQ_ANALYTICS_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!allowed.length)return Response.json({success:false,error:"Tracker admin not configured"},{status:403});
  const user=await currentUser();
  const verified=(user?.emailAddresses||[]).filter(e=>e.verification?.status==="verified").map(e=>e.emailAddress.toLowerCase());
  if(!verified.some(e=>allowed.includes(e)))return Response.json({success:false,error:"Only approved editors can add calls"},{status:403});

  try {
    if (!process.env.NEON_DATABASE_URL) {
      return Response.json({ success: false, error: "Database not configured." }, { status: 500 });
    }
    const body = await request.json();
    const { house, symbol, rating = "BUY", target_price, price_at_call, call_date, horizon_days = 365, note = "", source_url = "" } = body || {};
    if (!house || !symbol || !target_price || !price_at_call || !call_date) {
      return Response.json({ success: false, error: "house, symbol, target_price, price_at_call, call_date are required." }, { status: 400 });
    }
    if(typeof house!=="string"||house.trim().length>120||typeof symbol!=="string"||!/^[A-Za-z0-9.^_-]{1,25}$/.test(symbol)||!["BUY","SELL","HOLD"].includes(String(rating).toUpperCase())||
      !Number.isFinite(Number(target_price))||Number(target_price)<=0||!Number.isFinite(Number(price_at_call))||Number(price_at_call)<=0||
      !/^\d{4}-\d{2}-\d{2}$/.test(String(call_date))||!Number.isInteger(Number(horizon_days))||Number(horizon_days)<1||Number(horizon_days)>3650||typeof note!=="string"||note.length>2000)
      return Response.json({success:false,error:"Invalid call fields"},{status:400});
    let verifiedSource;
    try {
      const u=new URL(source_url);
      if(u.protocol!=="https:"||!u.hostname.includes(".")||u.username||u.password||source_url.length>1200)throw Error();
      verifiedSource=u.toString();
    }catch{return Response.json({success:false,error:"An original HTTPS research-report or dated publication URL is required."},{status:400});}
    const publicationDate=new Date(String(call_date)+"T00:00:00Z");
    if(!Number.isFinite(publicationDate.valueOf())||publicationDate.toISOString().slice(0,10)!==String(call_date)||publicationDate>new Date())return Response.json({success:false,error:"Invalid or future publication date"},{status:400});
    const sql = neon(process.env.NEON_DATABASE_URL);
    await ensureTable(sql);
    const rows = await sql`
      INSERT INTO analyst_calls (house, symbol, rating, target_price, price_at_call, call_date, horizon_days, note, source_url, verification_status)
      VALUES (${house.trim()}, ${symbol.toUpperCase().trim()}, ${String(rating).toUpperCase()},
              ${Number(target_price)}, ${Number(price_at_call)}, ${call_date}, ${Number(horizon_days)}, ${note}, ${verifiedSource}, 'unverified')
      RETURNING *
    `;
    return Response.json({ success: true, call: rows[0] });
  } catch (e) {
    console.error("[Tracker POST]", e);
    return Response.json({ success: false, error: "Could not add call." }, { status: 500 });
  }
}

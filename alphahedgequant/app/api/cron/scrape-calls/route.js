
// app/api/cron/scrape-calls/route.js
// Daily cron: fetch analyst consensus, validate, dedupe, auto-publish to analyst_calls.
//
// Triggered by Vercel Cron (see vercel.json). Protected by CRON_SECRET so only
// Vercel can invoke it. Runs at midnight IST (18:00 UTC).
//
// SAFETY MODEL (pure auto-publish, no review step):
//   - Every row must pass the validation gate in fetchConsensus.js before it
//     can reach the DB. Bad/garbled data is dropped and logged, never published.
//   - Dedupe against existing analyst_calls so the same call never doubles up.
//   - If the fetch returns ZERO valid rows (the signature of a broken API /
//     changed shape), the job inserts NOTHING rather than wiping or corrupting.
//   - Each run logs counts (fetched / inserted / skipped) so you can glance at
//     the response and see it's healthy without any required review.

import { neon } from "@neondatabase/serverless";
import { fetchConsensus } from "../../../../lib/fetchConsensus";

const sql = neon(process.env.NEON_DATABASE_URL);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS analyst_calls (
      id            SERIAL PRIMARY KEY,
      house         TEXT,
      symbol        TEXT,
      rating        TEXT,
      target_price  NUMERIC,
      price_at_call NUMERIC,
      call_date     DATE,
      horizon_days  INTEGER DEFAULT 365,
      note          TEXT DEFAULT '',
      created_at    TIMESTAMP DEFAULT NOW()
    )`;
}

export async function GET(request) {
  // --- auth: only Vercel Cron (or you, with the secret) may trigger this ---
  const auth = request.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await ensureTable();
    const { valid, report } = await fetchConsensus();

    // Broken-fetch guard: never act on an empty result set.
    if (!valid.length) {
      return Response.json({
        ok: true, inserted: 0, skipped: 0,
        note: "no valid rows this run (source may have changed) — nothing published",
        report,
      });
    }

    // Dedupe: skip a row if the same house+symbol+target+date already exists.
    let inserted = 0, skipped = 0;
    for (const r of valid) {
      const existing = await sql`
        SELECT 1 FROM analyst_calls
        WHERE house = ${r.house} AND symbol = ${r.symbol}
          AND target_price = ${r.target_price} AND call_date = ${r.call_date}
        LIMIT 1`;
      if (existing.length) { skipped++; continue; }
      await sql`
        INSERT INTO analyst_calls (house, symbol, rating, target_price, price_at_call, call_date, horizon_days, note)
        VALUES (${r.house}, ${r.symbol}, ${r.rating}, ${r.target_price}, ${r.price_at_call}, ${r.call_date}, ${r.horizon_days}, ${r.note})`;
      inserted++;
    }

    return Response.json({ ok: true, inserted, skipped, fetched: valid.length, report });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}

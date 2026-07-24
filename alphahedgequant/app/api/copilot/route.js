// app/api/copilot/route.js
// AI Quant Copilot: natural language → validated JSON strategy spec → deterministic backtest.
//
// SAFETY MODEL:
//   - Google Gemini (free tier) ONLY translates the user's sentence into a JSON spec.
//     It never produces executable code, and its output is validated against
//     the strict whitelist in lib/quantEngine before anything runs.
//   - Rate limits: 5 requests/hour per IP, 150/day globally (in-memory —
//     resets on cold start, which is acceptable for an abuse brake).
//   - Without GEMINI_API_KEY the route returns 503 and the UI shows a
//     "not configured yet" state instead of breaking.
//
// Env vars:
//   GEMINI_API_KEY   (free key from https://aistudio.google.com/apikey)
//   GEMINI_MODEL     (optional, defaults to "gemini-2.0-flash")

const { validateSpec, runBacktest } = require("../../../lib/quantEngine");

const API = process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const HOUR = 3600 * 1000;
const ipHits = new Map(); // ip -> { count, resetAt }
let day = { date: "", count: 0 };

function rateLimited(ip) {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  if (day.date !== today) day = { date: today, count: 0 };
  if (day.count >= 150) return "Daily Copilot budget (150 runs) is used up — try again tomorrow.";
  let rec = ipHits.get(ip);
  if (!rec || now > rec.resetAt) { rec = { count: 0, resetAt: now + HOUR }; ipHits.set(ip, rec); }
  if (rec.count >= 5) return "Rate limit: 5 Copilot runs per hour per user. Take a breather.";
  rec.count++;
  day.count++;
  return null;
}

const SYSTEM = `You translate a trading idea written in plain English into a JSON strategy spec. Output ONLY minified JSON, no prose, no code fences.

Schema:
{"symbol":"<UPPERCASE ticker, NSE like RELIANCE or US like AAPL>","interval":"1d"|"1wk","entry":<rule>,"exit":<rule or null>,"stop":{"type":"atr","period":<2-100>,"mult":<0.5-10>} or null,"capital":<number, default 100000>}

<rule> = {"type":"cross_above"|"cross_below"|"above"|"below","left":<operand>,"right":<operand>}
<operand> = {"ind":"sma"|"ema"|"rsi","period":<2-200>} | {"ind":"close"} | {"ind":"value","value":<number>}

Rules of thumb:
- "golden cross" → sma50 cross_above sma200; exit cross_below.
- "RSI oversold" → rsi14 below 30 for entry; exit rsi14 above 70 (or 50 if they say quick exits).
- Momentum/trend following → close cross_above sma/ema N.
- If they mention a stop loss ("2 ATR stop", "trailing stop") → set stop accordingly (default period 14).
- If they give no exit at all → add a sensible exit rule matching the entry logic AND a 2x ATR(14) stop.
- Long-only. If the idea is fundamentally a short strategy, invert it into the closest long equivalent and note nothing — just produce valid JSON.
- Unknown/ambiguous ticker → default RELIANCE. Unknown interval → "1d".

Only JSON. Nothing else.`;

export async function POST(request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ ok: false, code: "not-configured", error: "Copilot is not configured yet (missing API key)." }, { status: 503 });
  }

  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const limited = rateLimited(ip);
  if (limited) return Response.json({ ok: false, code: "rate-limited", error: limited }, { status: 429 });

  let prompt;
  try {
    const body = await request.json();
    prompt = String(body.prompt || "").slice(0, 600);
  } catch {
    return Response.json({ ok: false, error: "Bad request body." }, { status: 400 });
  }
  if (!prompt || prompt.trim().length < 8) {
    return Response.json({ ok: false, error: "Describe your strategy in a sentence or two." }, { status: 400 });
  }

  try {
    // 1) NL → JSON spec via Gemini (free tier). responseMimeType forces clean JSON output.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    const aiRes = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 600,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => "");
      return Response.json({ ok: false, error: `Model call failed (HTTP ${aiRes.status}).`, detail: detail.slice(0, 200) }, { status: 502 });
    }
    const aiJson = await aiRes.json();
    const raw = (aiJson.candidates?.[0]?.content?.parts?.[0]?.text || "").replace(/```json|```/g, "").trim();

    let spec;
    try { spec = JSON.parse(raw); } catch {
      return Response.json({ ok: false, error: "Couldn't parse the strategy. Try rephrasing — e.g. 'Buy RELIANCE when the 50-day SMA crosses above the 200-day, exit on the reverse cross, 2 ATR stop.'" }, { status: 422 });
    }

    // 2) validate against whitelist
    const v = validateSpec(spec);
    if (!v.ok) return Response.json({ ok: false, error: `Spec rejected: ${v.error}` }, { status: 422 });
    spec = v.spec;

    // 3) fetch candles
    const pr = await fetch(`${API}/api/prices?symbol=${encodeURIComponent(spec.symbol)}&interval=${spec.interval}`, { cache: "no-store" });
    const pj = await pr.json().catch(() => null);
    if (!pr.ok || !pj?.success || !Array.isArray(pj.data) || pj.data.length < 60) {
      return Response.json({ ok: false, error: pj?.error || `Not enough price data for ${spec.symbol}. (Backend may be waking from cold start — retry in ~1 min.)` }, { status: 502 });
    }

    // 4) deterministic backtest
    const results = runBacktest(spec, pj.data);
    return Response.json({ ok: true, spec, results });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}

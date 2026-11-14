/**
 * Public, same-origin source bridge for the standalone Tournament Board.
 * A browser may be blocked by a third party's CORS settings; the bridge
 * fetches only two fixed public providers. It never accepts an arbitrary URL.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paths = {
  chess: {
    top: "https://lichess.org/api/broadcast/top",
    official: "https://lichess.org/api/broadcast?nb=100"
  },
  hack: "https://devpost.com/api/hackathons?status%5B%5D=upcoming&status%5B%5D=open"
};
async function source(url, accept, max = 100) {
  const r = await fetch(url, {
    headers: {
      Accept: accept,
      "User-Agent": "AlphaHedgeQuantTournamentBoard/1.0 (public event directory)"
    },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8500)
  });
  if (!r.ok) throw Error("Upstream HTTP " + r.status);
  if (accept.includes("ndjson")) {
    const str = await r.text();
    if (str.trimStart().startsWith("[")) {
      try { const arr = JSON.parse(str); if (Array.isArray(arr)) return arr.slice(0, max); } catch { /* continue NDJSON parsing */ }
    }
    const rows = [];
    for (const line of str.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try { const item = JSON.parse(line); if (item && typeof item === "object") rows.push(item); }
      catch { /* skip malformed NDJSON rows */ }
      if (rows.length >= max) break;
    }
    return rows;
  }
  return r.json();
}
export async function GET(request) {
  const type = new URL(request.url).searchParams.get("source");
  if (type !== "chess" && type !== "hack") {
    return Response.json({ error: "Unknown source" }, { status: 400 });
  }
  try {
    if (type === "chess") {
      const [a,b] = await Promise.allSettled([
        source(paths.chess.top, "application/json"),
        source(paths.chess.official, "application/x-ndjson,application/json;q=0.9", 100)
      ]);
      const top = a.status === "fulfilled" ? a.value : null;
      const official = b.status === "fulfilled" && Array.isArray(b.value) ? b.value : [];
      if (!top && !official.length) throw Error("Unavailable");
      return Response.json({
        top: top && typeof top === "object" ? {
          active: Array.isArray(top.active) ? top.active.slice(0, 60) : [],
          past: { currentPageResults: Array.isArray(top.past?.currentPageResults)
            ? top.past.currentPageResults.slice(0, 50) : [] }
        } : null,
        official,
        checkedAt: new Date().toISOString()
      }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
    }
    const list = await source(paths.hack, "application/json");
    const arr = Array.isArray(list) ? list
      : ["hackathons","data","results"].map(k => list?.[k]).find(Array.isArray);
    if (!arr) throw Error("Unexpected source data");
    return Response.json({
      hackathons: arr.slice(0,400), checkedAt: new Date().toISOString()
    }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=1800" } });
  } catch {
    return Response.json({
      error: "Source temporarily unavailable",
      source: type
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

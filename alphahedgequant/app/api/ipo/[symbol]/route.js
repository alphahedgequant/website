// app/api/ipo/[symbol]/route.js
// Returns full detail for ONE IPO. Reuses the same list fetch + a richer
// normalize that keeps every qualitative field IF the plan returns it
// (about / strengths / risks / schedule / subscription breakdown).

const BASE = "https://stock.indianapi.in";
const API_KEY_ENV = "INDIANAPI_KEY";

let _cache = { at: 0, raw: null };
const CACHE_MS = 30 * 60 * 1000;

function num(v) {
  if (v == null) return null;
  const n = Number(String(v).replace(/[,₹%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function getRawList(apiKey) {
  if (_cache.raw && Date.now() - _cache.at < CACHE_MS) return _cache.raw;
  const res = await fetch(`${BASE}/ipo`, {
    headers: { "X-API-Key": apiKey, "Accept": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`IndianAPI /ipo HTTP ${res.status}`);
  const json = await res.json();
  let list = [];
  if (Array.isArray(json)) list = json;
  else if (json && typeof json === "object") {
    for (const k of Object.keys(json)) if (Array.isArray(json[k])) list = list.concat(json[k]);
  }
  _cache = { at: Date.now(), raw: list };
  return list;
}

// Build a detail object, keeping qualitative fields only when present.
function detail(raw) {
  const sub = raw?.subscription ?? raw?.subscriptionDetails ?? null;
  const gmpObj = raw?.gmp ?? null;
  return {
    name: raw?.name ?? raw?.company_name ?? raw?.ipo_name ?? "—",
    symbol: raw?.symbol ?? raw?.ticker ?? null,
    type: raw?.type ?? raw?.segment ?? null,
    status: (raw?.status ?? raw?.ipo_status ?? "").toString(),
    priceBand: raw?.price_band ?? raw?.priceBand ?? raw?.priceRange ?? raw?.price ?? null,
    issuePrice: raw?.issue_price ?? raw?.issuePrice ?? null,
    faceValue: raw?.face_value ?? raw?.faceValue ?? null,
    lotSize: num(raw?.lot_size ?? raw?.lotSize ?? raw?.minQty ?? raw?.min_qty),
    minAmount: num(raw?.minAmount ?? raw?.min_amount),
    issueSize: raw?.issue_size ?? raw?.issueSize ?? null,
    saleType: raw?.sale_type ?? raw?.saleType ?? null,
    registrar: raw?.registrar ?? null,
    listingOn: raw?.listing_on ?? raw?.listingOn ?? raw?.exchange ?? null,
    openDate: raw?.open_date ?? raw?.startDate ?? raw?.bidding_start_date ?? raw?.open ?? null,
    closeDate: raw?.close_date ?? raw?.endDate ?? raw?.bidding_end_date ?? raw?.close ?? null,
    allotmentDate: raw?.allotment_date ?? raw?.allotmentDate ?? null,
    listingDate: raw?.listing_date ?? raw?.listingDate ?? null,
    listingPrice: num(raw?.listing_price ?? raw?.listingPrice),
    listingGain: num(raw?.listing_gain ?? raw?.listingGain ?? raw?.gain),
    // subscription breakdown (the strongest infographic element)
    subscription: sub ? {
      qib: num(sub.qib ?? sub.QIB),
      nii: num(sub.nii ?? sub.NII),
      retail: num(sub.retail ?? sub.Retail),
      total: num(sub.total ?? sub.Total),
      updatedAt: sub.updated_at ?? sub.updatedAt ?? null,
    } : null,
    gmp: gmpObj ? {
      price: num(gmpObj.price ?? gmpObj.gmpPrice ?? gmpObj?.aggregations?.mean),
      percentage: num(gmpObj.percentage),
      updatedAt: gmpObj.updated_at ?? gmpObj.lastUpdatedAt ?? null,
    } : (num(raw?.gmp) != null ? { price: num(raw?.gmp), percentage: null } : null),
    // qualitative — present only on richer plans; page hides if null/empty
    about: raw?.about ?? raw?.companyDescription ?? null,
    strengths: Array.isArray(raw?.strengths) ? raw.strengths : null,
    risks: Array.isArray(raw?.risks) ? raw.risks : null,
    schedule: Array.isArray(raw?.schedule) ? raw.schedule : null,
    prospectus: raw?.prospectusUrl ?? raw?.prospectus ?? raw?.rhp ?? raw?.drhp ?? null,
    nseInfo: raw?.nseInfoUrl ?? null,
  };
}

export async function GET(request, { params }) {
  const apiKey = process.env[API_KEY_ENV];
  if (!apiKey) return Response.json({ ok: false, error: "Missing INDIANAPI_KEY" }, { status: 500 });

  const wanted = decodeURIComponent(params.symbol || "").toLowerCase();
  try {
    const list = await getRawList(apiKey);
    const match = list.find((r) => {
      const sym = (r?.symbol ?? r?.ticker ?? "").toString().toLowerCase();
      const nm = (r?.name ?? r?.company_name ?? "").toString().toLowerCase();
      const slug = (r?.slug ?? "").toString().toLowerCase();
      return sym === wanted || slug === wanted || nm.replace(/[^a-z0-9]/g, "") === wanted.replace(/[^a-z0-9]/g, "");
    });
    if (!match) return Response.json({ ok: false, error: "IPO not found" }, { status: 404 });
    return Response.json({ ok: true, ipo: detail(match) });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e) }, { status: 502 });
  }
}

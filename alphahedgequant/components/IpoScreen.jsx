"use client";
// components/IpoScreen.jsx
// IPO Screen section for the AHQ main page. Fetches /api/ipo and renders
// upcoming / open / listed IPOs in the AHQ dark theme.
//
// Design tokens used (match your existing site):
//   ink/surface/raised/line backgrounds, amber #F0A93B accent,
//   gain/loss colors for listing gains.
//
// Drop <IpoScreen /> into your main page where you want the section.

import { useEffect, useState } from "react";

const TABS = [
  { key: "open",     label: "Open Now" },
  { key: "upcoming", label: "Upcoming" },
  { key: "closed",   label: "Closed" },
  { key: "listed",   label: "Recently Listed" },
  { key: "other",    label: "Other statuses" },
];

function fmt(v, dash = "—") {
  return v === null || v === undefined || v === "" ? dash : v;
}

function GainBadge({ value }) {
  if (value === null || value === undefined) return <span style={{ color: "#8a8a8a" }}>—</span>;
  const up = value >= 0;
  return (
    <span style={{ color: up ? "#34d39a" : "#f87171", fontWeight: 600 }}>
      {up ? "+" : ""}{value}%
    </span>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
}

function IpoCard({ ipo, showGain }) {
  // No /ipo/[id] route exists; never link public users to a broken detail page.
  const inner = (
    <div
      style={{
        background: "#14161c",
        border: "1px solid #232733",
        borderRadius: 12,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ color: "#f5f5f5", fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>
            {fmt(ipo.name)}
          </div>
          {ipo.segment && (
            <div style={{ color: "#8a8a8a", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
              {ipo.segment}
            </div>
          )}
        </div>
        {ipo.gmp !== null && ipo.gmp !== undefined && (
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#8a8a8a", fontSize: 10, textTransform: "uppercase" }}>Reported GMP · Unofficial</div>
            <div style={{ color: "#F0A93B", fontWeight: 600, fontSize: 14 }}>₹{ipo.gmp}</div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px", fontSize: 13 }}>
        <Field label="Price Band" value={fmt(ipo.priceBand)} />
        <Field label="Lot Size" value={fmt(ipo.lotSize)} />
        <Field label="Open" value={fmt(ipo.open)} />
        <Field label="Close" value={fmt(ipo.close)} />
        {ipo.issueSize && <Field label="Issue Size" value={ipo.issueSize} />}
        {ipo.subscription != null && <Field label="Subscribed" value={`${ipo.subscription}x`} />}
        {ipo.gmpPct !== null && ipo.gmpPct !== undefined && <Field label="GMP-implied gain" value={<GainBadge value={ipo.gmpPct} />} />}
        {ipo.estimatedListingPrice != null && <Field label="Implied listing price" value={`₹${ipo.estimatedListingPrice}`} />}
        {ipo.gmpDisputed && <Field label="GMP disagreement" value="Sources differ significantly" />}
        {ipo.gmpSources != null && <Field label="GMP sources" value={ipo.gmpSources} />}
        {showGain && <Field label="Listing Gain" value={<GainBadge value={ipo.listingGain} />} />}
        {ipo.listingDate && <Field label="Listed" value={ipo.listingDate} />}
      </div>

      {ipo.docLink && (
        <span style={{ color: "#F0A93B", fontSize: 12, marginTop: 2 }}>
          View details →
        </span>
      )}
    </div>
  );

  return inner;
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ color: "#6b6b6b", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ color: "#cfcfcf" }}>{value}</div>
    </div>
  );
}

export default function IpoScreen() {
  const [tab, setTab] = useState("open");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const load = () => fetch("/api/ipo", {cache:"no-store"})
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.ok) { setData(j.buckets); setMeta(j); setLastRefresh(new Date().toISOString()); setError(null); }
        else setError(j.error || "Failed to load IPOs");
      })
      .catch((e) => alive && setError(String(e)))
      .finally(() => alive && setLoading(false));
    load();
    const timer = setInterval(() => {if(!document.hidden)load();}, 60000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { alive = false; clearInterval(timer);window.removeEventListener("focus",onFocus); };
  }, []);

  const list = data ? (data[tab] || []) : [];

  // IPOs listing within the next 4 days (across upcoming + open buckets)
  const soon = data
    ? [...(data.upcoming || []), ...(data.open || [])]
        .map((ipo) => ({ ipo, d: daysUntil(ipo.listingDate) }))
        .filter((x) => x.d !== null && x.d >= 0 && x.d <= 4)
        .sort((a, b) => a.d - b.d)
    : [];

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ color: "#F0A93B", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
        [ AHQ : IPO SCREEN ]
      </div>
      <h2 style={{ color: "#f5f5f5", fontSize: 30, fontWeight: 700, margin: "0 0 8px" }}>
        Latest IPOs
      </h2>
      <p style={{ color: "#9a9a9a", maxWidth: 640, lineHeight: 1.6, margin: "0 0 24px" }}>
        IPO calendar for NSE & BSE — open, upcoming, closed and recently listed issues
        with price bands, lot sizes, subscription, and listing performance.
      </p>

      <p style={{color:'#aab3c0',fontSize:13,margin:'0 0 22px'}}>Latest reported grey-market premium (GMP), estimated listing gain and subscription. Quotes are unofficial and may differ across sources.</p>

      {soon.length > 0 && (
        <div style={{ background: "linear-gradient(135deg,#1a1305,#14161c)", border: "1px solid #3a2e10", borderRadius: 12, padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ color: "#F0A93B", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
            ⚡ Listing in the next few days
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {soon.map(({ ipo, d }, i) => (
              <div key={ipo.id || i}
                 style={{ textDecoration: "none", background: "#14161c", border: "1px solid #232733", borderRadius: 8, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: "#f5f5f5", fontSize: 13, fontWeight: 600 }}>{fmt(ipo.name)}</span>
                <span style={{ color: "#F0A93B", fontSize: 11 }}>
                  {d === 0 ? "Lists today" : d === 1 ? "Lists tomorrow" : `Lists in ${d} days`} · {ipo.listingDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {meta && meta.freshness!=="timestamp_within_48h" && <p role="status" style={{color:"#e2b877",fontSize:12,margin:"0 0 12px"}}>
        {meta.freshness==="possibly_stale" ? "Source timestamps indicate this IPO feed may be outdated. Verify before relying on it." : "The IPO provider's latest update time could not be verified. A recent feed check does not guarantee fresh GMP data."}
      </p>}
      {meta && <p style={{color:"#9a9a9a",fontSize:12,margin:"0 0 16px"}}>
        {meta.upstreamUpdatedAt ? `Source updated ${new Date(meta.upstreamUpdatedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST · ` : ""}
        {meta.fetchedAt ? `Feed checked ${new Date(meta.fetchedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST` : "Update time unavailable"}
        {" · "}<a href="https://www.xflot.com/ipo" target="_blank" rel="noopener noreferrer" style={{color:"#F0A93B"}}>GMP data: Xflot</a>
        {" · "}GMP is unofficial, not exchange-verified; indicative gain is not a prediction.
        {meta.partial ? " · Some source records use unrecognized statuses or have missing identifiers." : ""}
      </p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? "#F0A93B" : "transparent",
              color: tab === t.key ? "#0d0f13" : "#cfcfcf",
              border: "1px solid " + (tab === t.key ? "#F0A93B" : "#2a2f3a"),
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: "#8a8a8a", padding: "40px 0" }}>Loading IPOs…</div>}
      {error && <div role="alert" style={{ color: "#f87171", padding: "20px 0" }}>Couldn’t load IPOs: {error}. Last successfully fetched information may be outdated.</div>}
      {!loading && !error && list.length === 0 && (
        <div style={{ color: "#8a8a8a", padding: "40px 0" }}>No {tab} IPOs right now.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
        {list.map((ipo, i) => (
          <IpoCard key={ipo.id || i} ipo={ipo} showGain={tab === "listed"} />
        ))}
      </div>
    </section>
  );
}

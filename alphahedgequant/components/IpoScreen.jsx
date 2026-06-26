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
  { key: "listed",   label: "Recently Listed" },
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

function IpoCard({ ipo, showGain }) {
  return (
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
            <div style={{ color: "#8a8a8a", fontSize: 10, textTransform: "uppercase" }}>GMP</div>
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
        {ipo.subscription && <Field label="Subscribed" value={`${ipo.subscription}x`} />}
        {showGain && <Field label="Listing Gain" value={<GainBadge value={ipo.listingGain} />} />}
        {ipo.listingDate && <Field label="Listed" value={ipo.listingDate} />}
      </div>

      {ipo.docLink && (
        <a
          href={ipo.docLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#F0A93B", fontSize: 12, textDecoration: "none", marginTop: 2 }}
        >
          View prospectus →
        </a>
      )}
    </div>
  );
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

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch("/api/ipo")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.ok) setData(j.buckets);
        else setError(j.error || "Failed to load IPOs");
      })
      .catch((e) => alive && setError(String(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const list = data ? (data[tab] || []) : [];

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ color: "#F0A93B", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
        [ AHQ : IPO SCREEN ]
      </div>
      <h2 style={{ color: "#f5f5f5", fontSize: 30, fontWeight: 700, margin: "0 0 8px" }}>
        Latest IPOs
      </h2>
      <p style={{ color: "#9a9a9a", maxWidth: 640, lineHeight: 1.6, margin: "0 0 24px" }}>
        Live IPO calendar for NSE & BSE — open, upcoming, and recently listed issues
        with price bands, lot sizes, subscription, and listing performance.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
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
      {error && <div style={{ color: "#f87171", padding: "20px 0" }}>Couldn’t load IPOs: {error}</div>}
      {!loading && !error && list.length === 0 && (
        <div style={{ color: "#8a8a8a", padding: "40px 0" }}>No {tab} IPOs right now.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {list.map((ipo, i) => (
          <IpoCard key={i} ipo={ipo} showGain={tab === "listed"} />
        ))}
      </div>
    </section>
  );
}

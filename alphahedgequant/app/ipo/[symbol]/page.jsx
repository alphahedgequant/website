"use client";
// app/ipo/[symbol]/page.jsx — IPO detail page with infographic-style visuals.
// Renders only the sections for which data is present.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const AMBER = "#F0A93B", GAIN = "#34d39a", LOSS = "#f87171", INK = "#0d0f13";

function Stat({ label, value, accent }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ background: "#14161c", border: "1px solid #232733", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ color: "#6b6b6b", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color: accent || "#f5f5f5", fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function SubBar({ label, x }) {
  if (x === null || x === undefined) return null;
  const pct = Math.min(100, (x / 50) * 100); // scale: 50x = full bar
  const color = x >= 1 ? GAIN : "#5a5f6b";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#cfcfcf", marginBottom: 4 }}>
        <span>{label}</span><span style={{ fontWeight: 600 }}>{x}x</span>
      </div>
      <div style={{ height: 8, background: "#1e2129", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function Timeline({ ipo }) {
  const steps = [
    { label: "Open", date: ipo.openDate },
    { label: "Close", date: ipo.closeDate },
    { label: "Allotment", date: ipo.allotmentDate },
    { label: "Listing", date: ipo.listingDate },
  ].filter((s) => s.date);
  if (!steps.length) return null;
  return (
    <div style={{ display: "flex", gap: 0, marginTop: 8 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ flex: 1, position: "relative", textAlign: "center" }}>
          <div style={{ height: 2, background: "#2a2f3a", position: "absolute", top: 6, left: i === 0 ? "50%" : 0, right: i === steps.length - 1 ? "50%" : 0 }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: AMBER, margin: "0 auto", position: "relative", zIndex: 1 }} />
          <div style={{ color: "#9a9a9a", fontSize: 10, textTransform: "uppercase", marginTop: 6 }}>{s.label}</div>
          <div style={{ color: "#e5e5e5", fontSize: 12, marginTop: 2 }}>{s.date}</div>
        </div>
      ))}
    </div>
  );
}

export default function IpoDetail() {
  const params = useParams();
  const sym = params?.symbol;
  const [ipo, setIpo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sym) return;
    let alive = true;
    fetch(`/api/ipo/${encodeURIComponent(sym)}`)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; j.ok ? setIpo(j.ipo) : setError(j.error || "Not found"); })
      .catch((e) => alive && setError(String(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [sym]);

  if (loading) return <Wrap><div style={{ color: "#8a8a8a" }}>Loading…</div></Wrap>;
  if (error) return <Wrap><div style={{ color: LOSS }}>Couldn’t load this IPO: {error}</div></Wrap>;
  if (!ipo) return <Wrap><div style={{ color: "#8a8a8a" }}>No data.</div></Wrap>;

  const gmpGain = ipo.gmp && ipo.gmp.price != null && ipo.issuePrice
    ? Math.round((ipo.gmp.price / Number(String(ipo.issuePrice).replace(/[^\d.]/g, "")) ) * 100)
    : (ipo.gmp ? ipo.gmp.percentage : null);

  return (
    <Wrap>
      <a href="/ipo" style={{ color: AMBER, fontSize: 13, textDecoration: "none" }}>← All IPOs</a>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 4px" }}>
        <h1 style={{ color: "#f5f5f5", fontSize: 30, fontWeight: 700, margin: 0 }}>{ipo.name}</h1>
        {ipo.type && <span style={{ color: "#9a9a9a", fontSize: 12, border: "1px solid #2a2f3a", borderRadius: 6, padding: "2px 8px", textTransform: "uppercase" }}>{ipo.type}</span>}
      </div>
      {ipo.status && <div style={{ color: AMBER, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>{ipo.status}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        <Stat label="Price Band" value={ipo.priceBand} />
        <Stat label="Issue Price" value={ipo.issuePrice} accent={AMBER} />
        <Stat label="Lot Size" value={ipo.lotSize} />
        <Stat label="Min Investment" value={ipo.minAmount ? `₹${ipo.minAmount}` : null} />
        <Stat label="Issue Size" value={ipo.issueSize} />
        <Stat label="Face Value" value={ipo.faceValue} />
        {ipo.gmp && ipo.gmp.price != null && (
          <Stat label="GMP" value={`₹${ipo.gmp.price}${gmpGain ? ` (${gmpGain}%)` : ""}`} accent={GAIN} />
        )}
        {ipo.listingGain != null && (
          <Stat label="Listing Gain" value={`${ipo.listingGain >= 0 ? "+" : ""}${ipo.listingGain}%`} accent={ipo.listingGain >= 0 ? GAIN : LOSS} />
        )}
      </div>

      {(ipo.openDate || ipo.listingDate) && (
        <Section title="Timeline"><Timeline ipo={ipo} /></Section>
      )}

      {ipo.subscription && (ipo.subscription.total != null || ipo.subscription.qib != null) && (
        <Section title="Subscription">
          <SubBar label="QIB" x={ipo.subscription.qib} />
          <SubBar label="NII" x={ipo.subscription.nii} />
          <SubBar label="Retail" x={ipo.subscription.retail} />
          <SubBar label="Total" x={ipo.subscription.total} />
          {ipo.subscription.updatedAt && <div style={{ color: "#6b6b6b", fontSize: 11, marginTop: 4 }}>Updated {ipo.subscription.updatedAt}</div>}
        </Section>
      )}

      {ipo.about && (
        <Section title="About"><p style={{ color: "#cfcfcf", lineHeight: 1.7, fontSize: 14 }}>{ipo.about}</p></Section>
      )}

      {ipo.strengths && ipo.strengths.length > 0 && (
        <Section title="Strengths"><PointList items={ipo.strengths} color={GAIN} /></Section>
      )}
      {ipo.risks && ipo.risks.length > 0 && (
        <Section title="Risks"><PointList items={ipo.risks} color={LOSS} /></Section>
      )}

      {(ipo.registrar || ipo.listingOn || ipo.saleType) && (
        <Section title="Details">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: 13, color: "#cfcfcf" }}>
            {ipo.registrar && <div><span style={{ color: "#6b6b6b" }}>Registrar: </span>{ipo.registrar}</div>}
            {ipo.listingOn && <div><span style={{ color: "#6b6b6b" }}>Listing On: </span>{ipo.listingOn}</div>}
            {ipo.saleType && <div><span style={{ color: "#6b6b6b" }}>Type: </span>{ipo.saleType}</div>}
          </div>
        </Section>
      )}

      <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
        {ipo.prospectus && <a href={ipo.prospectus} target="_blank" rel="noopener noreferrer" style={{ color: AMBER, fontSize: 13, textDecoration: "none" }}>Prospectus (RHP/DRHP) →</a>}
        {ipo.nseInfo && <a href={ipo.nseInfo} target="_blank" rel="noopener noreferrer" style={{ color: AMBER, fontSize: 13, textDecoration: "none" }}>NSE Info →</a>}
      </div>

      <p style={{ color: "#5a5f6b", fontSize: 11, marginTop: 32, lineHeight: 1.6 }}>
        Data aggregated from public sources for research and education only — not investment advice.
        GMP is an informal, unregulated sentiment indicator and not a guarantee of listing performance.
      </p>
    </Wrap>
  );
}

function Wrap({ children }) {
  return <section style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px" }}>{children}</section>;
}
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ color: AMBER, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}
function PointList({ items, color }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((t, i) => (
        <li key={i} style={{ color: "#cfcfcf", fontSize: 14, lineHeight: 1.6, paddingLeft: 18, position: "relative", marginBottom: 6 }}>
          <span style={{ position: "absolute", left: 0, color }}>•</span>{t}
        </li>
      ))}
    </ul>
  );
}

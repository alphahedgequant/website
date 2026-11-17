"use client";
// app/ipo/[symbol]/page.jsx — IPO detail page with infographic-style visuals.
// Renders only the sections for which data is present.

import { useEffect, useState } from "react";
import "../ipo-intro.css";
import { useParams } from "next/navigation";

const AMBER = "var(--ipo-gold)", GAIN = "var(--ipo-positive)", LOSS = "var(--ipo-negative)", INK = "var(--ipo-bg)";

function Stat({ label, value, accent }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ background: "var(--ipo-panel)", border: "1px solid var(--ipo-line)", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ color: "var(--ipo-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color: accent || "var(--ipo-text)", fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function SubBar({ label, x }) {
  if (x === null || x === undefined) return null;
  const pct = Math.min(100, (x / 50) * 100); // scale: 50x = full bar
  const color = x >= 1 ? GAIN : "var(--ipo-muted)";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ipo-text)", marginBottom: 4 }}>
        <span>{label}</span><span style={{ fontWeight: 600 }}>{x}x</span>
      </div>
      <div style={{ height: 8, background: "var(--ipo-raised)", borderRadius: 4, overflow: "hidden" }}>
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
          <div style={{ height: 2, background: "var(--ipo-line)", position: "absolute", top: 6, left: i === 0 ? "50%" : 0, right: i === steps.length - 1 ? "50%" : 0 }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: AMBER, margin: "0 auto", position: "relative", zIndex: 1 }} />
          <div style={{ color: "var(--ipo-muted)", fontSize: 10, textTransform: "uppercase", marginTop: 6 }}>{s.label}</div>
          <div style={{ color: "var(--ipo-text)", fontSize: 12, marginTop: 2 }}>{s.date}</div>
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

  if (loading) return <Wrap><div style={{ color: "var(--ipo-muted)" }}>Loading…</div></Wrap>;
  if (error) return <Wrap><div style={{ color: LOSS }}>Couldn’t load this IPO: {error}</div></Wrap>;
  if (!ipo) return <Wrap><div style={{ color: "var(--ipo-muted)" }}>No data.</div></Wrap>;

  const gmpGain=ipo.gmp?.percentage ?? null;

  return (
    <Wrap>
      <a href="/ipo" style={{ color: AMBER, fontSize: 13, textDecoration: "none" }}>← All IPOs</a>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 4px" }}>
        <h1 style={{ color: "var(--ipo-text)", fontSize: 30, fontWeight: 700, margin: 0 }}>{ipo.name}</h1>
        {ipo.type && <span style={{ color: "var(--ipo-muted)", fontSize: 12, border: "1px solid var(--ipo-line)", borderRadius: 6, padding: "2px 8px", textTransform: "uppercase" }}>{ipo.type}</span>}
      </div>
      {ipo.status && <div style={{ color: AMBER, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>{ipo.status}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        <Stat label="Price Band" value={ipo.priceBand} />
        <Stat label="Issue Price" value={ipo.issuePrice!=null?"₹"+ipo.issuePrice:null} accent={AMBER} />
        <Stat label="Lot Size" value={ipo.lotSize} />
        <Stat label="Min Investment" value={ipo.minAmount ? `₹${ipo.minAmount}` : null} />
        <Stat label="Issue Size" value={ipo.issueSize!=null?"₹"+ipo.issueSize+" Cr":null} />
        <Stat label="Face Value" value={ipo.faceValue} />
        {ipo.gmp && ipo.gmp.price != null && (
          <Stat label="GMP" value={`₹${ipo.gmp.price}${gmpGain != null ? ` (${gmpGain}%)` : ""}`} accent={GAIN} />
        )}
        {ipo.listingGain != null && (
          <Stat label="Listing Gain" value={`${ipo.listingGain >= 0 ? "+" : ""}${ipo.listingGain}%`} accent={ipo.listingGain >= 0 ? GAIN : LOSS} />
        )}
      </div>

      {ipo.priceSuspect&&<p style={{padding:12,color:"var(--ipo-gold)",border:"1px solid var(--ipo-line)"}}>Unusual source issue-price value withheld until it can be verified against the prospectus.</p>}
      {ipo.statusReason&&<p style={{padding:12,color:"var(--ipo-muted)"}}>{ipo.statusReason}</p>}
      {(ipo.openDate || ipo.listingDate) && (
        <Section title="Timeline"><Timeline ipo={ipo} /></Section>
      )}

      {ipo.subscription && (ipo.subscription.total != null || ipo.subscription.qib != null) && (
        <Section title="Subscription">
          <SubBar label="QIB" x={ipo.subscription.qib} />
          <SubBar label="NII" x={ipo.subscription.nii} />
          <SubBar label="Retail" x={ipo.subscription.retail} />
          <SubBar label="Total" x={ipo.subscription.total} />
          {ipo.subscription.updatedAt && <div style={{ color: "var(--ipo-muted)", fontSize: 11, marginTop: 4 }}>Updated {ipo.subscription.updatedAt}</div>}
        </Section>
      )}

      {ipo.about && (
        <Section title="About"><p style={{ color: "var(--ipo-text)", lineHeight: 1.7, fontSize: 14 }}>{ipo.about}</p></Section>
      )}

      {ipo.strengths && ipo.strengths.length > 0 && (
        <Section title="Strengths"><PointList items={ipo.strengths} color={GAIN} /></Section>
      )}
      {ipo.risks && ipo.risks.length > 0 && (
        <Section title="Risks"><PointList items={ipo.risks} color={LOSS} /></Section>
      )}

      {(ipo.registrar || ipo.listingOn || ipo.saleType) && (
        <Section title="Details">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: 13, color: "var(--ipo-text)" }}>
            {ipo.registrar && <div><span style={{ color: "var(--ipo-muted)" }}>Registrar: </span>{ipo.registrar}</div>}
            {ipo.listingOn && <div><span style={{ color: "var(--ipo-muted)" }}>Listing On: </span>{ipo.listingOn}</div>}
            {ipo.saleType && <div><span style={{ color: "var(--ipo-muted)" }}>Type: </span>{ipo.saleType}</div>}
          </div>
        </Section>
      )}

      <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
        {ipo.prospectus && <a href={ipo.prospectus} target="_blank" rel="noopener noreferrer" style={{ color: AMBER, fontSize: 13, textDecoration: "none" }}>Issuer / exchange reference →</a>}
        {ipo.nseInfo && <a href={ipo.nseInfo} target="_blank" rel="noopener noreferrer" style={{ color: AMBER, fontSize: 13, textDecoration: "none" }}>NSE Info →</a>}
      </div>

      <p style={{ color: "var(--ipo-muted)", fontSize: 11, marginTop: 32, lineHeight: 1.6 }}>
        Data aggregated from public sources for research and education only — not investment advice.
        GMP is an informal, unregulated sentiment indicator and not a guarantee of listing performance.
      </p>
    </Wrap>
  );
}

function Wrap({ children }) {
  return <main className="ahq-ipo-page" style={{minHeight:"75vh",background:"var(--ipo-bg)",color:"var(--ipo-text)"}}><section style={{maxWidth:1020,margin:"0 auto",padding:"52px 24px 90px"}}>{children}</section></main>;
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
        <li key={i} style={{ color: "var(--ipo-text)", fontSize: 14, lineHeight: 1.6, paddingLeft: 18, position: "relative", marginBottom: 6 }}>
          <span style={{ position: "absolute", left: 0, color }}>•</span>{t}
        </li>
      ))}
    </ul>
  );
}

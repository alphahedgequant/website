import Link from "next/link";

export const metadata = { title: "Research — AlphaHedgeQuant" };

const PAPERS = [
  {
    tag: "PUBLISHED · SSRN",
    title: "Market manipulation detection: spoofing & layering in Level-2 order book data",
    desc: "An ensemble approach combining Hawkes processes, XGBoost and autoencoders to detect spoofing, layering and quote stuffing in limit order book message data — validated on LOBSTER Level-2 feeds and synthetic adversarial data, with separate calibrations for Indian (NSE/SEBI) and US (SEC/CFTC) market structure.",
    points: [
      "Hawkes process modelling of order-flow self-excitation",
      "Feature engineering on order placement / cancellation asymmetry",
      "XGBoost + autoencoder ensemble for anomaly scoring",
      "Tested on real AAPL LOBSTER message data + synthetic spoofing injections",
    ],
  },
];

const PIPELINE = [
  ["Ingest", "Level-2 message data — every order placement, modification and cancellation, microsecond-stamped."],
  ["Feature", "Order-book imbalance, cancellation ratios, queue position dynamics and burst intensity per window."],
  ["Score", "Ensemble model flags windows where placement behaviour is statistically inconsistent with genuine intent."],
  ["Verdict", "Ranked alerts with the exact message sequences that triggered them — auditable, not black-box."],
];

export default function Research() {
  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : LAB — MICROSTRUCTURE RESEARCH ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Research that trades and detects
      </h1>
      <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
        AHQ Lab publishes original quantitative research — starting with market
        manipulation detection on Level-2 order book data. The same
        microstructure machinery that finds spoofing also sharpens execution.
      </p>

      {PAPERS.map((p) => (
        <div key={p.title} className="card p-7 mt-10 border-amber/30">
          <p className="font-mono text-[11px] tracking-[0.2em] text-amber">{p.tag}</p>
          <h2 className="font-display text-2xl font-medium mt-3 leading-snug max-w-2xl">
            {p.title}
          </h2>
          <p className="text-sm text-muted leading-relaxed mt-4 max-w-2xl">{p.desc}</p>
          <ul className="mt-5 grid gap-2 md:grid-cols-2">
            {p.points.map((pt) => (
              <li key={pt} className="text-sm text-body/90 flex gap-2.5">
                <span className="text-amber font-mono">▸</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h2 className="font-display text-xl font-medium mt-14">
        Detection pipeline
      </h2>
      <div className="grid gap-4 md:grid-cols-4 mt-5">
        {PIPELINE.map(([t, d], i) => (
          <div key={t} className="card p-5">
            <p className="font-mono text-amber text-xs">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="font-display font-medium mt-2">{t}</h3>
            <p className="text-sm text-muted leading-relaxed mt-1.5">{d}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-12 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display font-medium">More research is coming</p>
          <p className="text-sm text-muted mt-1">
            VRP harvesting, regime detection and execution studies are in the
            pipeline. Waitlist members read first.
          </p>
        </div>
        <Link href="/#waitlist" className="btn-primary">Join waitlist</Link>
      </div>
    </div>
  );
}

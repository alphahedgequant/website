"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zerohedgequant-backend.onrender.com";

// ════════════════════════════════════════════════════════════════════
//  MY PUBLICATIONS  (Shrey's original research)
//  ⚠ Replace SSRN_URL below with your real SSRN link.
// ════════════════════════════════════════════════════════════════════
const SSRN_URL = "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6519201";

const PUBLICATIONS = [
  {
    tag: "PUBLISHED · SSRN · APR 2026",
    title: "Market Manipulation Detection Framework",
    desc: "A production-grade detection framework for market manipulation in high-frequency limit order book environments. It integrates self-exciting Hawkes-inspired order-flow modelling with distributional price forecasting, distance-weighted feature engineering and economic profitability analysis — yielding a statistically grounded, economically interpretable and operationally deployable surveillance system.",
    points: [
      "Self-exciting Hawkes-inspired order-flow modelling",
      "Distributional price forecasting for intent inference",
      "Distance-weighted feature engineering on the order book",
      "Economic profitability analysis — flags manipulation that actually pays",
    ],
    meta: "Shreyash Randhe · 40 pages · DOI 10.2139/ssrn.6519201",
    link: SSRN_URL,
  },
];

const PIPELINE = [
  ["Ingest", "Level-2 message data — every order placement, modification and cancellation, microsecond-stamped."],
  ["Feature", "Order-book imbalance, cancellation ratios, queue position dynamics and burst intensity per window."],
  ["Score", "Ensemble model flags windows where placement behaviour is statistically inconsistent with genuine intent."],
  ["Verdict", "Ranked alerts with the exact message sequences that triggered them — auditable, not black-box."],
];

// ════════════════════════════════════════════════════════════════════
//  RESEARCH LIBRARY  (live arXiv q-fin feed)
// ════════════════════════════════════════════════════════════════════
const CATEGORIES = [
  { key: "all", label: "All q-fin" },
  { key: "ST", label: "Stat-arb" },
  { key: "TR", label: "Trading & Microstructure" },
  { key: "PM", label: "Portfolio" },
  { key: "RM", label: "Risk" },
  { key: "CP", label: "Computational" },
  { key: "PR", label: "Pricing" },
  { key: "MF", label: "Math Finance" },
];

// Curated foundational papers — real links, hand-picked (not auto-fetched).
const FOUNDATIONAL = [
  { title: "Statistical Arbitrage in the US Equities Market", authors: "Avellaneda & Lee", year: 2010, venue: "Quantitative Finance / SSRN", url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1153505" },
  { title: "Co-integration and Error Correction", authors: "Engle & Granger", year: 1987, venue: "Econometrica", url: "https://www.jstor.org/stable/1913236" },
  { title: "Generalized Autoregressive Conditional Heteroskedasticity (GARCH)", authors: "Bollerslev", year: 1986, venue: "Journal of Econometrics", url: "https://doi.org/10.1016/0304-4076(86)90063-1" },
  { title: "Deep Neural Networks, Gradient-Boosted Trees, Random Forests: Stat-Arb on the S&P 500", authors: "Krauss, Do & Huck", year: 2017, venue: "EJOR", url: "https://www.econstor.eu/bitstream/10419/130166/1/856307327.pdf" },
  { title: "Statistical Arbitrage Pairs Trading Strategies: Review and Outlook", authors: "Krauss", year: 2017, venue: "J. Economic Surveys", url: "https://onlinelibrary.wiley.com/doi/abs/10.1111/joes.12153" },
  { title: "Coherent Measures of Risk", authors: "Artzner, Delbaen, Eber & Heath", year: 1999, venue: "Mathematical Finance", url: "https://doi.org/10.1111/1467-9965.00068" },
  { title: "Attention Is All You Need", authors: "Vaswani et al.", year: 2017, venue: "NeurIPS (arXiv)", url: "https://arxiv.org/abs/1706.03762" },
  { title: "A Well-Conditioned Estimator for Large-Dimensional Covariance Matrices", authors: "Ledoit & Wolf", year: 2004, venue: "J. Multivariate Analysis", url: "https://doi.org/10.1016/S0047-259X(03)00096-4" },
];

function PaperCard({ p }) {
  return (
    <div className="card p-5 hover:border-amber/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-medium leading-snug flex-1">{p.title}</h3>
        <span className="font-mono text-[10px] tracking-wider uppercase text-muted border border-line rounded px-2 py-0.5 shrink-0">
          {p.primaryCat || "q-fin"}
        </span>
      </div>
      <p className="text-xs text-muted mt-2">
        {p.authors.join(", ")}{p.authorsMore > 0 && ` +${p.authorsMore} more`}
      </p>
      <p className="text-sm text-body/80 leading-relaxed mt-2.5">{p.summary}</p>
      <div className="flex items-center justify-between mt-4">
        <span className="font-mono text-[11px] text-muted">{p.published} · {p.source}</span>
        <div className="flex gap-3">
          <a href={p.abs} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#5aa9f5] hover:underline">abstract</a>
          <a href={p.pdf} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-amber hover:underline">PDF →</a>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 bg-line rounded w-3/4" />
      <div className="h-3 bg-line rounded w-1/3 mt-3" />
      <div className="h-3 bg-line rounded w-full mt-3" />
      <div className="h-3 bg-line rounded w-5/6 mt-2" />
    </div>
  );
}

export default function Research() {
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPapers = useCallback(async (category, q) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ cat: category, max: "24" });
      if (q) params.set("q", q);
      const r = await fetch(`${API}/api/research/arxiv?${params}`);
      const json = await r.json();
      if (!json.success) throw new Error(json.error || "Feed error");
      setPapers(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPapers(cat, ""); }, [cat, fetchPapers]);

  const onSearch = (e) => {
    e.preventDefault();
    fetchPapers(cat, search.trim());
  };

  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      {/* ───────────────── MY PUBLICATIONS ───────────────── */}
      <p className="eyebrow mb-3">[ AHQ : LAB — MY PUBLICATIONS ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Research that trades and detects
      </h1>
      <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
        Original quantitative research from AHQ Lab — starting with market
        manipulation detection on Level-2 order book data. The same microstructure
        machinery that finds spoofing also sharpens execution.
      </p>

      {PUBLICATIONS.map((p) => (
        <div key={p.title} className="card p-7 mt-10 border-amber/30">
          <p className="font-mono text-[11px] tracking-[0.2em] text-amber">{p.tag}</p>
          <h2 className="font-display text-2xl font-medium mt-3 leading-snug max-w-2xl">{p.title}</h2>
          {p.meta && <p className="font-mono text-[11px] text-muted mt-2">{p.meta}</p>}
          <p className="text-sm text-muted leading-relaxed mt-4 max-w-2xl">{p.desc}</p>
          <ul className="mt-5 grid gap-2 md:grid-cols-2">
            {p.points.map((pt) => (
              <li key={pt} className="text-sm text-body/90 flex gap-2.5">
                <span className="text-amber font-mono">▸</span>{pt}
              </li>
            ))}
          </ul>
          <a
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 inline-flex"
          >
            Read on SSRN →
          </a>
        </div>
      ))}

      {/* Detection pipeline */}
      <h2 className="font-display text-xl font-medium mt-14">Detection pipeline</h2>
      <div className="grid gap-4 md:grid-cols-4 mt-5">
        {PIPELINE.map(([t, d], i) => (
          <div key={t} className="card p-5">
            <p className="font-mono text-amber text-xs">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="font-display font-medium mt-2">{t}</h3>
            <p className="text-sm text-muted leading-relaxed mt-1.5">{d}</p>
          </div>
        ))}
      </div>

      {/* ───────────────── RESEARCH LIBRARY ───────────────── */}
      <div className="mt-20 pt-10 border-t border-amber/30">
        <p className="eyebrow mb-3">[ AHQ : LIBRARY — QUANT RESEARCH UNDER ONE ROOF ]</p>
        <h2 className="font-display text-3xl font-medium tracking-tight">Quant Research Library</h2>
        <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
          A live feed of the latest quantitative-finance papers from arXiv (q-fin),
          filterable by area, plus a curated shelf of the foundational papers behind
          the AHQ models. Updated continuously.
        </p>

        {/* Filters + search */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => { setCat(c.key); setSearch(""); }}
              className={`font-mono text-[11px] tracking-wider px-3 py-1.5 rounded border transition-colors ${
                cat === c.key ? "border-amber text-amber" : "border-line text-muted hover:text-body"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSearch} className="mt-3 flex gap-2 max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title / abstract (e.g. cointegration, LSTM)..."
            className="flex-1 bg-raised/40 border border-line rounded px-3 py-2 font-mono text-sm text-body placeholder:text-muted focus:outline-none focus:border-amber/40"
          />
          <button type="submit" className="px-4 py-2 rounded bg-amber text-ink font-mono text-sm font-medium hover:bg-[#f7bd5e] transition-colors">
            Search
          </button>
        </form>

        {/* arXiv feed */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[11px] text-muted tracking-wider">
              LIVE · arXiv q-fin {loading ? "· loading…" : papers.length ? `· ${papers.length} papers` : ""}
            </p>
          </div>

          {error && (
            <div className="card p-4 border-loss/30 text-sm text-loss/90 font-mono">
              ⚠ {error} — the feed may be waking (Render cold start ~50s). Try a filter again.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            {!loading && papers.map((p) => <PaperCard key={p.id} p={p} />)}
          </div>

          {!loading && !error && papers.length === 0 && (
            <p className="text-sm text-muted font-mono py-8 text-center">No papers found — try another category or search.</p>
          )}
        </div>

        {/* Foundational shelf */}
        <h3 className="font-display text-xl font-medium mt-14">Foundational papers</h3>
        <p className="text-muted text-sm mt-1.5 mb-5 max-w-2xl leading-relaxed">
          The seminal works behind the AHQ model library — curated, with direct links.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {FOUNDATIONAL.map((f) => (
            <a
              key={f.title}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 hover:border-amber/40 transition-colors block"
            >
              <p className="font-display text-sm font-medium leading-snug">{f.title}</p>
              <p className="text-xs text-muted mt-1.5">
                {f.authors} ({f.year}) · {f.venue} <span className="text-amber">→</span>
              </p>
            </a>
          ))}
        </div>

        <p className="font-mono text-[11px] text-muted mt-10">
          LIVE FEED: arXiv.org q-fin (open API). CURATED SHELF: hand-selected foundational papers.
          SSRN has no public API — those papers are linked individually. RESEARCH &amp; EDUCATION ONLY.
        </p>
      </div>
    </div>
  );
}

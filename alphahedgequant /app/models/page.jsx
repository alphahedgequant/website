import Link from "next/link";

const STRATEGIES = [
  { id: "01", name: "Engle-Granger pairs", cat: "Stat-arb", desc: "Two-asset cointegration with rolling z-score entries above ±2.0 and exit at mean reversion." },
  { id: "02", name: "Johansen basket", cat: "Stat-arb", desc: "Multi-asset cointegrated baskets via Johansen test — trades the stationary combination." },
  { id: "03", name: "PCA stat-arb", cat: "Stat-arb", desc: "Principal-component residuals as mean-reverting signals across a correlated universe." },
  { id: "04", name: "Kalman filter", cat: "Adaptive", desc: "Dynamic hedge ratios estimated online — the pair relationship adapts instead of being fixed." },
  { id: "05", name: "OU mean reversion", cat: "Stochastic", desc: "Ornstein-Uhlenbeck parameters fitted by MLE: speed of reversion, half-life, optimal bands." },
  { id: "06", name: "Momentum", cat: "Trend", desc: "Cross-sectional and time-series momentum with volatility-scaled position sizing." },
  { id: "07", name: "HMM regime detection", cat: "Regime", desc: "Hidden Markov states classify trending vs mean-reverting markets and gate other strategies." },
  { id: "08", name: "VRP harvesting", cat: "Volatility", desc: "Variance risk premium capture — systematically selling overpriced implied volatility." },
  { id: "09", name: "Multi-pair scanner", cat: "Stat-arb", desc: "Universe-wide pair scan ranked by cointegration strength, half-life and current z-score." },
  { id: "10", name: "Ledoit-Wolf optimization", cat: "Portfolio", desc: "Markowitz allocation with shrinkage covariance — stable weights from noisy estimates." },
];

export const metadata = { title: "Quant strategies & models — AlphaHedgeQuant" };

export default function Models() {
  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : QUANT — STRATEGIES & MODELS ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Quant strategies &amp; models
      </h1>
      <p className="text-muted text-sm mt-2 max-w-2xl leading-relaxed">
        The AHQ engine runs ten institutional-grade quantitative strategies and models
        across US equities and outputs live BUY / SELL / HOLD signals with
        capital-aware position sizing. Live signal feed is rolling out to early
        access first.
      </p>

      <div className="grid gap-4 md:grid-cols-2 mt-10">
        {STRATEGIES.map((s) => (
          <div key={s.id} className="card p-5 hover:border-amber/40 transition-colors">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-amber text-xs">{s.id}</p>
              <span className="font-mono text-[10px] tracking-wider uppercase text-muted border border-line rounded px-2 py-0.5">
                {s.cat}
              </span>
            </div>
            <h2 className="font-display text-lg font-medium mt-2">{s.name}</h2>
            <p className="text-sm text-muted leading-relaxed mt-1.5">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-10 flex flex-wrap items-center justify-between gap-4 border-amber/30">
        <div>
          <p className="font-display font-medium">Want live signals first?</p>
          <p className="text-sm text-muted mt-1">
            The signal feed ships to the waitlist before anyone else.
          </p>
        </div>
        <Link href="/#waitlist" className="btn-primary">Join waitlist</Link>
      </div>
    </div>
  );
}

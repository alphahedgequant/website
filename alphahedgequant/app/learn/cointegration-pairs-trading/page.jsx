import Link from "next/link";

export const metadata = {
  title: "Cointegration & Pairs Trading | AHQ Learn",
  description: "Engle-Granger test, Johansen, half-life of mean reversion, and z-score execution — by a practitioner.",
};

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-semibold mb-4 pb-2 border-b border-line">{title}</h2>
      {children}
    </section>
  );
}

function Formula({ children, label }) {
  return (
    <div className="my-4 p-4 rounded-lg border border-amber/20 bg-amber/[0.03] font-mono text-sm text-amber overflow-x-auto">
      {label && <p className="text-muted text-xs mb-2 tracking-wider">{label}</p>}
      <pre className="whitespace-pre-wrap">{children}</pre>
    </div>
  );
}

function Callout({ type = "info", children }) {
  const styles = {
    info:    "border-[#5aa9f5]/30  bg-[#5aa9f5]/5  text-[#5aa9f5]",
    warn:    "border-amber/30     bg-amber/5     text-amber",
    insight: "border-gain/30 bg-gain/5 text-gain",
    danger:  "border-loss/30   bg-loss/5   text-loss",
  };
  const icons = { info: "💡", warn: "⚠", insight: "🎯", danger: "🚫" };
  return (
    <div className={`my-4 p-4 rounded-lg border text-sm leading-relaxed ${styles[type]}`}>
      <span className="mr-2">{icons[type]}</span>
      {children}
    </div>
  );
}

function Code({ children }) {
  return <code className="font-mono text-amber bg-amber/10 px-1.5 py-0.5 rounded text-sm">{children}</code>;
}

export default function CointegrationArticle() {
  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      {/* Breadcrumb */}
      <Link href="/learn" className="font-mono text-xs text-muted hover:text-amber transition-colors">
        ← Back to Learn
      </Link>

      {/* Header */}
      <div className="mt-6 mb-10">
        <div className="flex gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-wider uppercase border border-loss/40 text-loss px-2 py-0.5 rounded">advanced</span>
          <span className="font-mono text-[10px] tracking-wider text-muted">24 min · Quant</span>
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tight leading-tight">
          Cointegration & Pairs Trading
        </h1>
        <p className="text-muted mt-3 text-base leading-relaxed">
          Engle-Granger test, Johansen baskets, half-life of mean reversion, and z-score execution — 
          from theory to a live Python implementation. This is the foundation of statistical arbitrage.
        </p>
      </div>

      {/* ── SECTION 1 ── */}
      <Section title="1. The Core Idea — What's the Trade?">
        <p className="text-muted leading-relaxed mb-4">
          Two stocks <strong className="text-body">move together</strong> in the long run even if they diverge in the short run. 
          When that spread gets too wide, it snaps back. You trade the divergence.
        </p>
        <p className="text-muted leading-relaxed mb-4">
          Classic example: <strong className="text-body">HDFCBANK and ICICIBANK</strong>. Both Indian private-sector banks. 
          Same macro exposure, same interest-rate sensitivity, same regulatory environment. 
          If HDFC rallies 3% and ICICI stays flat, that gap is unusual. History says it closes.
        </p>
        <Callout type="insight">
          The key insight: you're not betting on direction. You're betting on mean reversion of a 
          <em> spread</em>. Market goes up? Both go up — you're neutral. Market goes down? Both go down — still neutral. 
          You only profit when the spread narrows.
        </Callout>
        <p className="text-muted leading-relaxed">
          But here's the trap beginners fall into: <strong className="text-body">correlation ≠ cointegration</strong>. 
          Two stocks can be highly correlated (both trend up together) while their spread trends — 
          meaning there's no mean reversion, and your "pairs trade" bleeds out.
        </p>
      </Section>

      {/* ── SECTION 2 ── */}
      <Section title="2. Correlation vs Cointegration — The Critical Distinction">
        <p className="text-muted leading-relaxed mb-4">
          Imagine two drunkards walking down the road (yes, this is actually the textbook analogy — Granger himself used it):
        </p>
        <div className="grid sm:grid-cols-2 gap-4 my-4">
          <div className="p-4 rounded-lg border border-line bg-surface">
            <p className="font-semibold text-amber mb-2">Correlated, not cointegrated</p>
            <p className="text-sm text-muted leading-relaxed">
              Two drunkards walking in the same general direction. 
              They might wander together, but there's no tether between them. 
              The <em>gap</em> between them could grow forever.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-gain/20 bg-gain/[0.04]">
            <p className="font-semibold text-gain mb-2">Cointegrated</p>
            <p className="text-sm text-muted leading-relaxed">
              A drunk and his dog on a leash. They might wander in different directions, 
              but the leash (the spread) has a maximum length. 
              The gap <em>always</em> reverts.
            </p>
          </div>
        </div>
        <p className="text-muted leading-relaxed">
          Mathematically: two I(1) series (each individually a random walk) are cointegrated if 
          a linear combination of them is I(0) — stationary. The spread <Code>S = P₁ - β·P₂</Code> is the leash.
        </p>
        <Formula label="COINTEGRATION DEFINITION">
{`If X_t ~ I(1) and Y_t ~ I(1),
they are cointegrated if there exists β such that:

  e_t = Y_t - β·X_t  ~  I(0)  (stationary)

β is the "hedge ratio" — how much X to short per unit of Y.`}
        </Formula>
        <Callout type="warn">
          Almost everything in equities is I(1) — prices are random walks. That's why you <em>can't</em> 
          just regress two price series and call it done. You need to test the residuals for stationarity.
        </Callout>
      </Section>

      {/* ── SECTION 3 ── */}
      <Section title="3. The Engle-Granger Test — Step by Step">
        <p className="text-muted leading-relaxed mb-4">
          Robert Engle and Clive Granger won the 2003 Nobel Prize in Economics partly for this. 
          Here's how to apply it in 3 steps:
        </p>

        <h3 className="font-semibold text-body mb-2">Step 1: OLS regression to find β</h3>
        <Formula label="STEP 1 — ESTIMATE HEDGE RATIO">
{`Y_t = α + β·X_t + e_t

Run OLS (ordinary least squares) regression of Y on X.
β is your hedge ratio.
e_t are the residuals — the spread.`}
        </Formula>
        <p className="text-muted text-sm mb-4">
          Example: Regress HDFCBANK on ICICIBANK. You might get β = 0.87. 
          That means for every 1 share of HDFCBANK, you short 0.87 shares of ICICIBANK to be market-neutral.
        </p>

        <h3 className="font-semibold text-body mb-2">Step 2: ADF test on residuals</h3>
        <Formula label="STEP 2 — AUGMENTED DICKEY-FULLER TEST ON e_t">
{`H₀ (null):  e_t has a unit root → NOT stationary → NOT cointegrated
H₁ (alt):   e_t is stationary → cointegrated

Reject H₀ if ADF test statistic < critical value (typically -3.0 at 5% level)
OR: p-value < 0.05`}
        </Formula>

        <h3 className="font-semibold text-body mb-2">Step 3: Python implementation</h3>
        <div className="my-4 p-4 rounded-lg border border-line bg-raised font-mono text-sm overflow-x-auto">
          <pre className="text-muted whitespace-pre">{`import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import adfuller, coint

# --- Download price data ---
# prices_df columns: ['HDFCBANK.NS', 'ICICIBANK.NS']

Y = prices_df['HDFCBANK.NS']
X = prices_df['ICICIBANK.NS']

# Step 1: OLS for hedge ratio
beta = np.polyfit(X, Y, 1)[0]   # slope = hedge ratio
spread = Y - beta * X             # the "leash"

# Step 2: ADF test on spread
result = adfuller(spread.dropna())
adf_stat, p_value = result[0], result[1]

print(f"β (hedge ratio): {beta:.4f}")
print(f"ADF statistic:   {adf_stat:.4f}")
print(f"p-value:         {p_value:.4f}")

if p_value < 0.05:
    print("✓ COINTEGRATED — pairs trade is valid")
else:
    print("✗ Not cointegrated — don't trade this pair")

# Shortcut: statsmodels coint() does both steps
score, pval, _ = coint(Y, X)
print(f"Coint p-value: {pval:.4f}")`}
          </pre>
        </div>

        <Callout type="danger">
          <strong>Critical caveat:</strong> Engle-Granger assumes ONE cointegrating vector and ONE direction 
          of causality (Y causes X). If you swap X and Y, you get a different β. 
          For more than 2 assets, you need Johansen.
        </Callout>
      </Section>

      {/* ── SECTION 4 ── */}
      <Section title="4. Half-Life of Mean Reversion — When Will the Spread Close?">
        <p className="text-muted leading-relaxed mb-4">
          Knowing the spread is stationary isn't enough. If it takes 3 years to mean-revert, 
          it's not tradeable. You need the <strong className="text-body">half-life</strong> — 
          how many days for the spread to move halfway back to the mean.
        </p>
        <p className="text-muted leading-relaxed mb-4">
          The spread follows an <strong className="text-body">Ornstein-Uhlenbeck (OU) process</strong>:
        </p>
        <Formula label="ORNSTEIN-UHLENBECK PROCESS">
{`dS_t = κ(μ - S_t)dt + σdW_t

where:
  κ = mean reversion speed (higher = faster)
  μ = long-run mean of spread
  σ = volatility of spread
  W_t = Wiener process (Brownian motion)

Half-life = ln(2) / κ ≈ 0.693 / κ`}
        </Formula>
        <div className="my-4 p-4 rounded-lg border border-line bg-raised font-mono text-sm overflow-x-auto">
          <pre className="text-muted whitespace-pre">{`# Estimate half-life via OLS on lagged spread
from statsmodels.regression.linear_model import OLS
from statsmodels.tools import add_constant

delta_spread = spread.diff().dropna()
lag_spread   = spread.shift(1).dropna()

# Align
delta_spread, lag_spread = delta_spread.align(lag_spread, join='inner')

# Regress: ΔS_t = a + κ·S_{t-1} + ε_t
X_reg = add_constant(lag_spread)
res   = OLS(delta_spread, X_reg).fit()

kappa     = -res.params.iloc[1]           # mean reversion speed
half_life = np.log(2) / kappa

print(f"Mean reversion speed (κ): {kappa:.4f}")
print(f"Half-life: {half_life:.1f} days")

# Rule of thumb:
# half-life < 5 days   → too fast, probably noise
# half-life 5–30 days  → sweet spot for daily trading
# half-life > 60 days  → too slow, capital tied up too long`}
          </pre>
        </div>
        <Callout type="insight">
          For daily trading, aim for a half-life of <strong>10–30 days</strong>. 
          HDFCBANK/ICICIBANK historically shows a half-life around 12–18 days — classic sweet spot.
        </Callout>
      </Section>

      {/* ── SECTION 5 ── */}
      <Section title="5. Z-Score Entry & Exit — The Trading Signal">
        <p className="text-muted leading-relaxed mb-4">
          Once you have a cointegrated pair with a good half-life, the trading rule is simple: 
          track how many standard deviations the spread is from its mean. That's your z-score.
        </p>
        <Formula label="Z-SCORE SIGNAL">
{`z_t = (S_t - μ_rolling) / σ_rolling

Entry rules:
  z < -2.0  →  BUY spread (long Y, short X)
  z > +2.0  →  SELL spread (short Y, long X)

Exit rules:
  |z| < 0.5  →  close position (spread normalised)
  |z| > 3.5  →  stop loss (something structural changed)`}
        </Formula>
        <div className="my-4 p-4 rounded-lg border border-line bg-raised font-mono text-sm overflow-x-auto">
          <pre className="text-muted whitespace-pre">{`# Full pairs trading signal generator
LOOKBACK   = 20    # rolling window for mean/std
ENTRY_Z    = 2.0   # enter at ±2 sigma
EXIT_Z     = 0.5   # exit when spread normalises
STOP_Z     = 3.5   # stop loss at ±3.5 sigma

spread_mean = spread.rolling(LOOKBACK).mean()
spread_std  = spread.rolling(LOOKBACK).std()
z_score     = (spread - spread_mean) / spread_std

positions = pd.Series(0, index=z_score.index)

for i in range(1, len(z_score)):
    z = z_score.iloc[i]
    prev_pos = positions.iloc[i - 1]

    if prev_pos == 0:               # flat — look for entry
        if z < -ENTRY_Z:  positions.iloc[i] =  1   # long spread
        elif z > ENTRY_Z: positions.iloc[i] = -1   # short spread
    elif prev_pos == 1:             # long spread — look for exit/stop
        if z >= -EXIT_Z:  positions.iloc[i] =  0   # take profit
        elif z < -STOP_Z: positions.iloc[i] =  0   # stop loss
        else:             positions.iloc[i] =  1   # hold
    elif prev_pos == -1:            # short spread — mirror logic
        if z <= EXIT_Z:   positions.iloc[i] =  0
        elif z > STOP_Z:  positions.iloc[i] =  0
        else:             positions.iloc[i] = -1`}
          </pre>
        </div>
      </Section>

      {/* ── SECTION 6 ── */}
      <Section title="6. Johansen Test — Baskets & Multi-Asset Cointegration">
        <p className="text-muted leading-relaxed mb-4">
          Engle-Granger handles 2 assets. <strong className="text-body">Johansen</strong> handles N assets 
          and finds all cointegrating vectors. This is how you build stat-arb baskets 
          (e.g., long RELIANCE, short a weighted basket of ONGC + BPCL + GAIL).
        </p>
        <div className="my-4 p-4 rounded-lg border border-line bg-raised font-mono text-sm overflow-x-auto">
          <pre className="text-muted whitespace-pre">{`from statsmodels.tsa.vector_ar.vecm import coint_johansen

# price_matrix: DataFrame with N asset columns
result = coint_johansen(price_matrix, det_order=0, k_ar_diff=1)

# Trace statistic test
trace_stat   = result.lr1          # test statistics
crit_values  = result.cvt          # [90%, 95%, 99%] critical values
eigen_vectors = result.evec        # each column = one cointegrating vector

# Count how many cointegrating vectors exist
n_cointegrations = sum(trace_stat > crit_values[:, 1])  # at 95%
print(f"Number of cointegrating vectors: {n_cointegrations}")

# First cointegrating vector = the hedge weights
hedge_weights = eigen_vectors[:, 0]
spread_basket = price_matrix @ hedge_weights  # dot product`}
          </pre>
        </div>
        <Callout type="warn">
          Johansen is powerful but over-fits easily on small samples. As a rule of thumb: 
          you need at least <strong>5× the number of observations as parameters</strong>. 
          For a 5-asset basket, run Johansen on 2+ years of daily data minimum.
        </Callout>
      </Section>

      {/* ── SECTION 7 ── */}
      <Section title="7. Real-World Risk Management">
        <p className="text-muted leading-relaxed mb-4">
          Cointegration relationships break down ("regime change"). ICICI and HDFC can decointegrate 
          during a bank-specific crisis (Yes Bank scare, NBFC contagion) — the spread blows out and never reverts.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 my-4">
          {[
            { title: "Retest regularly", body: "Re-run EG test and recalculate β monthly. Hedge ratio drifts — a 0.87 β from 6 months ago may now be 0.74. Use Kalman filter for dynamic β estimation." },
            { title: "Hard stop on z-score", body: "At z = ±3.5, close immediately. Don't average in. The spread blowing to ±5 is the signal that cointegration broke — not an opportunity to add." },
            { title: "Position sizing", body: "Size so that 1 half-life of spread movement = max 2% portfolio drawdown. If half-life is 15d and spread vol is high, reduce size." },
            { title: "Sector pairs only", body: "Cross-sector cointegration (e.g., Reliance + TCS) rarely holds. Stick to within-sector pairs: bank vs bank, pharma vs pharma, IT vs IT." },
          ].map(({ title, body }) => (
            <div key={title} className="p-4 rounded-lg border border-line bg-surface">
              <p className="font-semibold text-body mb-1.5">{title}</p>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── PRACTICE ── */}
      <div className="mt-10 p-6 rounded-xl border border-amber/20 bg-amber/[0.03]">
        <p className="font-mono text-xs text-amber tracking-wider mb-4">[ PRACTICE PROBLEMS ]</p>
        <div className="space-y-4">
          {[
            "Download 2 years of daily price data for HDFCBANK and ICICIBANK. Run the Engle-Granger test. Is the pair cointegrated at 5% significance? What is β?",
            "Calculate the half-life of the HDFCBANK/ICICIBANK spread. Is it in the 10–30 day sweet spot? What does that imply for holding period?",
            "Build the z-score signal. Plot it. Mark the entry/exit points. How many trades did it generate in 2 years? What's the win rate?",
            "Now test RELIANCE vs TCS. Are they cointegrated? Compare the p-value and half-life to the bank pair. What explains the difference?",
            "Hard: Implement a Kalman filter to estimate β dynamically instead of using a fixed OLS β. How does the equity curve change?",
          ].map((q, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono text-amber text-sm shrink-0">{i + 1}.</span>
              <p className="text-sm text-muted leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-line flex justify-between">
        <Link href="/learn" className="font-mono text-xs text-muted hover:text-amber transition-colors">← All articles</Link>
        <Link href="/learn/position-sizing" className="font-mono text-xs text-muted hover:text-amber transition-colors">Next: Position Sizing →</Link>
      </div>
    </div>
  );
}

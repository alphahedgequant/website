import Link from "next/link";

export const metadata = {
  title: "Position Sizing Before Everything | AHQ Learn",
  description: "Why sizing decides survival: fixed fractional, volatility targeting, and Kelly Criterion with real numbers.",
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

function NumberExample({ title, rows }) {
  return (
    <div className="my-4 rounded-lg border border-line overflow-hidden">
      {title && <div className="bg-raised/40 px-4 py-2 font-mono text-xs text-muted tracking-wider">{title}</div>}
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value, highlight], i) => (
            <tr key={i} className={`border-t border-line ${highlight ? "bg-amber/[0.03]" : ""}`}>
              <td className="px-4 py-2.5 text-muted">{label}</td>
              <td className={`px-4 py-2.5 font-mono text-right ${highlight ? "text-amber font-semibold" : "text-body"}`}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PositionSizingArticle() {
  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <Link href="/learn" className="font-mono text-xs text-muted hover:text-amber transition-colors">
        ← Back to Learn
      </Link>

      <div className="mt-6 mb-10">
        <div className="flex gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-wider uppercase border border-amber/40 text-amber px-2 py-0.5 rounded">intermediate</span>
          <span className="font-mono text-[10px] tracking-wider text-muted">14 min · Risk</span>
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tight leading-tight">
          Position Sizing Before Everything
        </h1>
        <p className="text-muted mt-3 text-base leading-relaxed">
          A brilliant strategy with terrible sizing will blow up. A mediocre strategy with excellent sizing survives and compounds. 
          This is the most important — and most ignored — skill in trading.
        </p>
      </div>

      {/* ── SECTION 1 ── */}
      <Section title="1. Why Sizing Is the Real Edge">
        <p className="text-muted leading-relaxed mb-4">
          Most traders obsess over entry signals. Where to buy, which indicator, what pattern. 
          The dirty secret: <strong className="text-body">your entry explains almost none of your long-run outcome</strong>. 
          Sizing and risk management explain almost all of it.
        </p>
        <p className="text-muted leading-relaxed mb-4">
          Here's why: a strategy with 55% win rate and 1:1 risk-reward is profitable in expectation. 
          But bet 50% of capital on each trade and a 5-loss streak — which happens — wipes you out. 
          That same strategy with 1% risk per trade survives indefinitely.
        </p>
        <NumberExample
          title="THE MATH OF RUIN — Same strategy, different sizing"
          rows={[
            ["Win rate",                      "55%",        false],
            ["Risk:Reward",                   "1:1",        false],
            ["Expected value per trade",      "+10%",       false],
            ["Sizing: 50% of capital/trade",  "",           false],
            ["P(ruin after 10-loss streak)",  "0.1%  →  capital down 99.9%",  true],
            ["Sizing: 2% of capital/trade",   "",           false],
            ["P(ruin after 10-loss streak)",  "0.0%  →  capital down 18%",    true],
          ]}
        />
        <Callout type="insight">
          Position sizing doesn't improve your strategy. It determines whether you <em>survive long enough</em> 
          for the strategy's edge to materialise. Without survival, edge is irrelevant.
        </Callout>
      </Section>

      {/* ── SECTION 2 ── */}
      <Section title="2. Fixed Fractional — The Baseline Method">
        <p className="text-muted leading-relaxed mb-4">
          The simplest robust approach. Risk a fixed percentage of your <em>current</em> capital on each trade. 
          As your account grows, your absolute bet size grows. As it shrinks, your bet shrinks automatically — 
          protecting you during drawdowns.
        </p>
        <Formula label="FIXED FRACTIONAL SIZING">
{`Position Size = (Account × Risk%) / (Entry - Stop)

Risk% = typically 1–2% for stocks, 0.5–1% for futures

Example:
  Account:    ₹10,00,000
  Risk%:      1%
  Entry:      ₹2,500
  Stop:       ₹2,425   (₹75 risk per share)

→ Max loss per trade = ₹10,00,000 × 1% = ₹10,000
→ Shares = ₹10,000 / ₹75 = 133 shares
→ Position value = 133 × ₹2,500 = ₹3,32,500 (33% of capital)`}
        </Formula>
        <p className="text-muted leading-relaxed mb-4">
          Notice the position value (33%) is a <em>consequence</em> of the risk rule, not an input. 
          If your stop is tight, you buy more shares. If your stop is wide, you buy fewer. 
          The risk is constant; the position size adjusts.
        </p>
        <Callout type="warn">
          <strong>Never set your stop based on your desired position size.</strong> 
          Set your stop at the price that invalidates your trade thesis, then calculate position size from there.
        </Callout>
        <div className="my-4 p-4 rounded-lg border border-line bg-raised font-mono text-sm overflow-x-auto">
          <pre className="text-muted whitespace-pre">{`def fixed_fractional_size(account, risk_pct, entry, stop):
    """
    account  : total portfolio value in ₹
    risk_pct : e.g., 0.01 for 1%
    entry    : entry price per share
    stop     : stop-loss price per share
    """
    max_loss   = account * risk_pct
    risk_per_share = abs(entry - stop)
    
    if risk_per_share == 0:
        raise ValueError("Entry and stop cannot be the same")
    
    shares     = int(max_loss / risk_per_share)
    pos_value  = shares * entry
    pct_capital = (pos_value / account) * 100
    
    return {
        'shares':      shares,
        'pos_value':   pos_value,
        'pct_capital': round(pct_capital, 1),
        'max_loss':    shares * risk_per_share,
    }`}
          </pre>
        </div>
      </Section>

      {/* ── SECTION 3 ── */}
      <Section title="3. Volatility Targeting — Sizing to Risk, Not to Dollars">
        <p className="text-muted leading-relaxed mb-4">
          Fixed fractional relies on you setting a stop. But what if you're running a strategy 
          without hard stops — like mean reversion? Or what if two trades both have 
          ₹100 stop, but one stock moves ₹5/day and the other moves ₹50/day?
        </p>
        <p className="text-muted leading-relaxed mb-4">
          <strong className="text-body">Volatility targeting</strong> solves this by sizing positions 
          so that each one contributes equal <em>realised volatility</em> to the portfolio. 
          Used by every major quant fund (Renaissance, AQR, Two Sigma).
        </p>
        <Formula label="VOLATILITY TARGETING">
{`Daily Vol Target = Portfolio Vol Target / √252

Position Size (₹) = (Portfolio × Daily Vol Target) / σ_stock

where σ_stock = stock's daily volatility (ATR or rolling std of returns)

Example:
  Portfolio:          ₹10,00,000
  Target annual vol:  15%  (modest)
  Daily vol target:   15% / √252 = 0.944%

  Stock A (σ = 2%/day):   Size = ₹10L × 0.944% / 2%   = ₹4,72,000
  Stock B (σ = 0.5%/day): Size = ₹10L × 0.944% / 0.5% = ₹18,88,000

→ Same risk contribution. Different position sizes.`}
        </Formula>
        <Callout type="insight">
          This is why quant funds can hold seemingly huge positions in low-volatility stocks — 
          they're sizing to equalize risk, not dollars. A ₹20L position in a 0.3% daily vol stock 
          is lower risk than a ₹5L position in a 3% daily vol stock.
        </Callout>
        <div className="my-4 p-4 rounded-lg border border-line bg-raised font-mono text-sm overflow-x-auto">
          <pre className="text-muted whitespace-pre">{`import numpy as np
import pandas as pd

def vol_target_size(portfolio, annual_vol_target, returns_series, price):
    """
    portfolio         : total portfolio value in ₹
    annual_vol_target : e.g., 0.15 for 15%
    returns_series    : pd.Series of daily % returns (last 20 days)
    price             : current stock price
    """
    daily_vol_target = annual_vol_target / np.sqrt(252)
    
    # Rolling 20-day realised vol
    sigma = returns_series.tail(20).std()
    
    if sigma == 0:
        return 0
    
    position_value = portfolio * (daily_vol_target / sigma)
    shares = int(position_value / price)
    
    return {
        'shares':         shares,
        'position_value': shares * price,
        'stock_daily_vol': f"{sigma*100:.2f}%",
        'pct_capital':    round((shares * price / portfolio) * 100, 1),
    }`}
          </pre>
        </div>
      </Section>

      {/* ── SECTION 4 ── */}
      <Section title="4. Kelly Criterion — The Optimal Growth Formula">
        <p className="text-muted leading-relaxed mb-4">
          John Kelly (Bell Labs, 1956) derived the <strong className="text-body">mathematically optimal fraction 
          of capital to risk</strong> to maximise long-run geometric growth. It's elegant and dangerous.
        </p>
        <Formula label="KELLY CRITERION">
{`f* = (p·b - q) / b = (p·b - (1-p)) / b

where:
  f*  = optimal fraction of capital to bet
  p   = probability of win
  q   = 1 - p = probability of loss
  b   = reward/risk ratio (e.g., if risk 1 to make 1.5, b = 1.5)

Concrete example:
  Win rate (p):      0.55
  Risk:Reward (b):   1.5
  
  f* = (0.55 × 1.5 - 0.45) / 1.5
     = (0.825 - 0.45) / 1.5
     = 0.375 / 1.5
     = 0.25  → bet 25% of capital`}
        </Formula>
        <NumberExample
          title="KELLY EXAMPLES — Various edge profiles"
          rows={[
            ["Win 55%, R:R 1:1",   "Kelly = 10%",  false],
            ["Win 55%, R:R 1.5:1", "Kelly = 25%",  false],
            ["Win 60%, R:R 1:1",   "Kelly = 20%",  false],
            ["Win 50%, R:R 2:1",   "Kelly = 0%  (zero edge!)",  true],
            ["Win 45%, R:R 3:1",   "Kelly = 13%",  false],
            ["Win 40%, R:R 1:1",   "Kelly = NEGATIVE (don't bet)", true],
          ]}
        />
        <Callout type="danger">
          <strong>Full Kelly is almost never used in practice.</strong> It maximises long-run growth 
          but produces catastrophic drawdowns (often 50%+ even with positive edge). 
          Most professionals use <strong>half-Kelly or quarter-Kelly</strong> — dramatically smoother equity curve 
          with only marginally lower long-run growth.
        </Callout>
        <p className="text-muted leading-relaxed mb-4">
          The Kelly formula also assumes you know <em>exactly</em> your win rate and R:R in advance. 
          In live trading, you don't. Estimation error makes full Kelly dangerous. 
          If your estimated p is 55% but the true p is 48%, full Kelly is ruinous.
        </p>
        <div className="my-4 p-4 rounded-lg border border-line bg-raised font-mono text-sm overflow-x-auto">
          <pre className="text-muted whitespace-pre">{`def kelly_fraction(win_rate, reward_risk_ratio, fraction=0.5):
    """
    win_rate          : e.g., 0.55 for 55%
    reward_risk_ratio : e.g., 1.5 means risk 1 to make 1.5
    fraction          : 0.5 = half Kelly (recommended)
    """
    p = win_rate
    q = 1 - p
    b = reward_risk_ratio
    
    full_kelly = (p * b - q) / b
    
    if full_kelly <= 0:
        return {
            'full_kelly': full_kelly,
            'use_fraction': 0,
            'note': "Negative Kelly — no edge, do not trade this setup"
        }
    
    adjusted = full_kelly * fraction
    
    return {
        'full_kelly':      round(full_kelly * 100, 1),  # %
        'half_kelly':      round(adjusted * 100, 1),    # %
        'recommendation':  f"Risk {round(adjusted * 100, 1)}% per trade",
        'note': f"Full Kelly is {round(full_kelly*100,1)}% — use {int(fraction*100)}% of that"
    }`}
          </pre>
        </div>
      </Section>

      {/* ── SECTION 5 ── */}
      <Section title="5. Portfolio-Level Controls — Drawdown Circuit Breakers">
        <p className="text-muted leading-relaxed mb-4">
          Individual position sizing is necessary but not sufficient. You need 
          <strong className="text-body"> portfolio-level rules</strong> that override individual position logic 
          when things go wrong systemically.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 my-4">
          {[
            {
              title: "Max portfolio heat",
              body: "Total risk-at-stop across all open positions. Limit to 5–8% of capital max. If 6 positions each risk 1%, you're at 6% heat — approaching limit."
            },
            {
              title: "Daily drawdown limit",
              body: "If portfolio drops X% in one day, stop trading. Period. Common values: 2–3% for discretionary, 1–2% for systematic. Loss recovery is expensive — down 10% needs +11% to recover."
            },
            {
              title: "Monthly drawdown circuit",
              body: "If down 6–8% in a month, cut position sizes in half and do not scale back up until monthly PnL is positive. Prevents 'tilt' cascades."
            },
            {
              title: "Correlation constraint",
              body: "Don't hold 5 IT stocks if they all move together. Treat correlated positions as one fat position. Effective risk = n × size if correlation = 1."
            },
          ].map(({ title, body }) => (
            <div key={title} className="p-4 rounded-lg border border-line bg-surface">
              <p className="font-semibold text-body mb-1.5">{title}</p>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <Formula label="PORTFOLIO HEAT CALCULATION">
{`Portfolio Heat = Σ (position_size_i × stop_distance_i) / Account

Example (3 positions):
  RELIANCE: 100 shares × ₹80 stop = ₹8,000 at risk
  TCS:       40 shares × ₹150 stop = ₹6,000 at risk
  INFY:      60 shares × ₹60 stop  = ₹3,600 at risk

Total heat = ₹17,600 / ₹10,00,000 = 1.76%  → OK

Rule: if heat > 6%, no new positions until existing ones are trimmed.`}
        </Formula>
      </Section>

      {/* ── SECTION 6 ── */}
      <Section title="6. Bringing It Together — A Complete Sizing Framework">
        <p className="text-muted leading-relaxed mb-4">
          Here's the decision tree to use on every trade, in order:
        </p>
        <div className="space-y-3 my-4">
          {[
            { step: "1", text: "Define stop first. Where does my thesis break? That's your stop, not ₹X away from entry." },
            { step: "2", text: "Apply fixed fractional: Size = (1% × Account) / (Entry − Stop). This is your base size." },
            { step: "3", text: "Volatility check: if σ_stock > 3%/day, cut position by half regardless. High vol means outsized gap risk." },
            { step: "4", text: "Kelly sanity check: compute f*. If < your fixed fractional %, use f* instead. Never exceed Kelly." },
            { step: "5", text: "Portfolio heat check: does this push total heat > 5%? If yes, wait for an existing position to close." },
            { step: "6", text: "Correlation check: do I already have >2 positions in this sector? If yes, treat as one position and halve size." },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-4 p-4 rounded-lg border border-line bg-surface/60">
              <span className="font-mono text-2xl font-bold text-amber/30 shrink-0">{step}</span>
              <p className="text-sm text-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Practice */}
      <div className="mt-10 p-6 rounded-xl border border-amber/20 bg-amber/[0.03]">
        <p className="font-mono text-xs text-amber tracking-wider mb-4">[ PRACTICE PROBLEMS ]</p>
        <div className="space-y-4">
          {[
            "Account: ₹5,00,000. Risk per trade: 1.5%. Entry: ₹1,200. Stop: ₹1,140. Calculate: (a) max loss, (b) shares to buy, (c) position value, (d) % of capital.",
            "A strategy has 58% win rate and 1.2:1 risk-reward. Calculate full Kelly and half-Kelly fractions. If account = ₹10L, what's the rupee size at half-Kelly?",
            "You have 4 open positions: HDFC (₹12k at risk), TCS (₹8k at risk), Infosys (₹9k at risk), Wipro (₹7k at risk). Account = ₹10L. What is your portfolio heat? Can you take a 5th position with ₹6k risk?",
            "Stock X has a daily vol of 3.5%. Using volatility targeting with 12% annual portfolio vol target, what position size (as % of a ₹10L account) would you take?",
            "Design a full circuit-breaker rulebook for a day trader with ₹5L capital: daily loss limit, weekly limit, max concurrent positions, max sector concentration, and position max size. Justify each number.",
          ].map((q, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono text-amber text-sm shrink-0">{i + 1}.</span>
              <p className="text-sm text-muted leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-line flex justify-between">
        <Link href="/learn/cointegration-pairs-trading" className="font-mono text-xs text-muted hover:text-amber transition-colors">← Cointegration & Pairs</Link>
        <Link href="/learn/options-greeks" className="font-mono text-xs text-muted hover:text-amber transition-colors">Next: Options Greeks →</Link>
      </div>
    </div>
  );
}

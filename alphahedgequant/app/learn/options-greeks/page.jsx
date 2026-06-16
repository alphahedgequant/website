import Link from "next/link";

export const metadata = {
  title: "Options Greeks in Practice | AHQ Learn",
  description: "Delta, Gamma, Theta, Vega — managed as a portfolio, not memorized as definitions.",
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

function GreekCard({ greek, symbol, oneLiner, intuition, sign, example }) {
  const colors = {
    Δ: "border-[#5aa9f5]/30 bg-[#5aa9f5]/[0.06]",
    Γ: "border-[#b79bff]/30 bg-[#b79bff]/[0.06]",
    Θ: "border-loss/30 bg-loss/[0.04]",
    V: "border-gain/30 bg-gain/[0.04]",
    ρ: "border-amber/30 bg-amber/[0.04]",
  };
  return (
    <div className={`p-5 rounded-xl border ${colors[symbol] || "border-line"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-display text-3xl font-bold text-body">{symbol}</span>
          <span className="ml-2 font-semibold text-lg">{greek}</span>
        </div>
        <span className={`font-mono text-xs px-2 py-0.5 rounded border ${sign === "+" ? "border-gain/30 text-gain" : "border-loss/30 text-loss"}`}>
          {sign === "+" ? "Long = beneficial" : "Long = costly"}
        </span>
      </div>
      <p className="text-sm font-semibold text-body mb-2">{oneLiner}</p>
      <p className="text-sm text-muted leading-relaxed mb-3">{intuition}</p>
      <div className="p-3 rounded bg-raised/40 border border-line">
        <p className="font-mono text-xs text-muted tracking-wider mb-1">EXAMPLE</p>
        <p className="font-mono text-xs text-body leading-relaxed">{example}</p>
      </div>
    </div>
  );
}

export default function OptionsGreeksArticle() {
  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <Link href="/learn" className="font-mono text-xs text-muted hover:text-amber transition-colors">
        ← Back to Learn
      </Link>

      <div className="mt-6 mb-10">
        <div className="flex gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-wider uppercase border border-amber/40 text-amber px-2 py-0.5 rounded">intermediate</span>
          <span className="font-mono text-[10px] tracking-wider text-muted">18 min · Derivatives</span>
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tight leading-tight">
          Options Greeks in Practice
        </h1>
        <p className="text-muted mt-3 text-base leading-relaxed">
          Delta, Gamma, Theta, Vega — understood as a system, not memorised as definitions. 
          This is how professionals manage options risk across a portfolio.
        </p>
      </div>

      {/* ── SECTION 1 ── */}
      <Section title="1. The Dashboard Metaphor — Reading Your Greeks">
        <p className="text-muted leading-relaxed mb-4">
          Think of options Greeks as your trading dashboard, not a formula sheet. 
          When you buy or sell an option, you're simultaneously taking on <strong className="text-body">five exposures at once</strong>. 
          Each Greek is a dial that tells you how much your P&L will change as one input moves.
        </p>
        <div className="my-4 p-4 rounded-lg border border-line bg-surface font-mono text-sm">
          <p className="text-muted text-xs tracking-wider mb-3">OPTIONS P&L — ALL EXPOSURES AT ONCE</p>
          <div className="space-y-2 text-body">
            <p><span className="text-[#5aa9f5]">Δ Delta</span>   → How much does my option move when stock moves ₹1?</p>
            <p><span className="text-[#b79bff]">Γ Gamma</span>  → How much does my Delta change when stock moves ₹1?</p>
            <p><span className="text-loss">Θ Theta</span>   → How much value do I lose each day that passes?</p>
            <p><span className="text-gain">V Vega</span>   → How much does my option move when IV changes 1%?</p>
            <p><span className="text-amber">ρ Rho</span>     → How much does my option move when rates change 1%?</p>
          </div>
        </div>
        <p className="text-muted leading-relaxed">
          In this article we'll focus on Delta, Gamma, Theta, and Vega — 
          the four that dominate most real-world options positions. 
          Rho matters mainly for LEAPS and longer-dated instruments.
        </p>
      </Section>

      {/* ── SECTION 2 — GREEKS OVERVIEW ── */}
      <Section title="2. The Four Greeks — Intuition First">
        <div className="space-y-4">
          <GreekCard
            greek="Delta"
            symbol="Δ"
            sign="+"
            oneLiner="Your directional exposure — how much you're 'like' stock"
            intuition="Delta is the P&L velocity. A delta of 0.6 means your option moves ₹0.60 for every ₹1 the stock moves. Think of it as the probability the option expires ITM — though this interpretation has caveats."
            example="You're long 1 lot NIFTY 22000 CE (delta = 0.55). NIFTY moves from 21,800 to 21,850 (+50 pts). Option gains approx 50 × 0.55 × 75 = ₹2,062 (lot size 75)."
          />
          <GreekCard
            greek="Gamma"
            symbol="Γ"
            sign="+"
            oneLiner="The acceleration — how Delta changes as price moves"
            intuition="If Delta is velocity, Gamma is acceleration. High Gamma = your Delta changes rapidly as the market moves — meaning your position gets more long as market rises, more short as it falls. This is the 'convexity' of options."
            example="ATM option has Gamma = 0.04. NIFTY moves up 100 pts. Your Delta goes from 0.50 to 0.50 + (100 × 0.04) = 0.54. You're now more directional than when you entered."
          />
          <GreekCard
            greek="Theta"
            symbol="Θ"
            sign="-"
            oneLiner="Time decay — the daily 'rent' you pay for optionality"
            intuition="Options lose value every day due to time decay. Theta is usually negative for long options (you lose money as time passes). The decay is non-linear — it accelerates in the last 30 days before expiry."
            example="You're long a ₹200 option with Theta = -5. Each day you hold it, you lose ₹5. After 10 days with no stock movement: option is now worth ₹200 - ₹50 = ₹150. Time killed 25% of your value."
          />
          <GreekCard
            greek="Vega"
            symbol="V"
            sign="+"
            oneLiner="Your exposure to implied volatility — the fear gauge"
            intuition="Vega tells you how much your option gains/loses if IV rises 1%. Long options benefit from IV expansion (Vega positive). Sold options benefit from IV contraction. This is separate from whether IV actually predicts moves."
            example="You're long a straddle, Vega = +₹300 per IV point. NIFTY IV jumps from 14% to 18% (+4 points) before earnings. Your straddle gains ₹300 × 4 = ₹1,200 in Vega alone, even if NIFTY doesn't move."
          />
        </div>
      </Section>

      {/* ── SECTION 3 ── */}
      <Section title="3. Delta — Managing Directional Exposure">
        <p className="text-muted leading-relaxed mb-4">
          Delta is your most important real-time risk number. Professionals track <strong className="text-body">dollar delta</strong> — 
          not just the dimensionless Greek, but how much cash you'd make or lose on a 1% stock move.
        </p>
        <Formula label="DOLLAR DELTA">
{`Dollar Delta = Δ × Lot Size × Stock Price × Number of Contracts

Example:
  RELIANCE ATM call: Δ = 0.50, lot = 250, price = ₹2,800, 2 contracts

  Dollar Delta = 0.50 × 250 × ₹2,800 × 2 = ₹7,00,000

This means: RELIANCE moves 1% → your option book moves ≈ ₹7,000
(because 1% of ₹7L exposure = ₹7,000)`}
        </Formula>
        <h3 className="font-semibold text-body mb-2 mt-6">Delta Hedging</h3>
        <p className="text-muted leading-relaxed mb-4">
          To be delta-neutral — to not care about direction and only trade vol — 
          you offset your option delta with stock or futures.
        </p>
        <div className="my-4 p-4 rounded-lg border border-line bg-raised font-mono text-sm overflow-x-auto">
          <pre className="text-muted whitespace-pre">{`# Delta neutral hedge

option_delta = 0.60      # long 1 NIFTY call, delta 0.60
lot_size     = 50        # NIFTY lot
contracts    = 10        # 10 lots

total_delta = option_delta * lot_size * contracts  # = 300

# To hedge: short futures equal to total delta
# 1 NIFTY future = 50 delta
futures_to_short = total_delta / lot_size  # = 6 lots of futures

print(f"Long {contracts} CE lots → {total_delta} delta exposure")
print(f"Short {futures_to_short} futures → portfolio delta = 0")
print(f"Now P&L driven purely by Gamma, Theta, Vega")`}
          </pre>
        </div>
        <Callout type="info">
          Delta hedging is only valid at a point in time. As the stock moves, your delta changes (Gamma). 
          Professionals re-hedge periodically — the frequency depends on Gamma and trading costs.
        </Callout>

        <h3 className="font-semibold text-body mb-2 mt-6">Delta Across Strike Prices</h3>
        <div className="my-4 rounded-lg border border-line overflow-hidden">
          <div className="bg-raised/40 px-4 py-2 font-mono text-xs text-muted tracking-wider">
            DELTA VALUES BY MONEYNESS (approx, at 30 DTE)
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-left font-mono text-xs text-muted">Strike vs ATM</th>
                <th className="px-4 py-2.5 text-left font-mono text-xs text-muted">Call Delta</th>
                <th className="px-4 py-2.5 text-left font-mono text-xs text-muted">Put Delta</th>
                <th className="px-4 py-2.5 text-left font-mono text-xs text-muted">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Deep ITM (−10%)",    "0.85 – 0.95", "−0.05 – −0.15", "Almost like stock"],
                ["Slightly ITM (−3%)", "0.60 – 0.70", "−0.30 – −0.40", "Significant exposure"],
                ["ATM",               "~0.50",        "~−0.50",         "50/50 coin flip"],
                ["Slightly OTM (+3%)", "0.30 – 0.40", "−0.60 – −0.70", "Mostly premium bet"],
                ["Far OTM (+10%)",     "0.05 – 0.15", "−0.85 – −0.95", "Lottery ticket"],
              ].map(([strike, call, put, note], i) => (
                <tr key={i} className="border-t border-line">
                  <td className="px-4 py-2.5 font-mono text-xs text-body">{strike}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gain">{call}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-loss">{put}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── SECTION 4 ── */}
      <Section title="4. Gamma — Convexity Is Everything">
        <p className="text-muted leading-relaxed mb-4">
          Gamma is why options buyers love big moves and options sellers fear them. 
          It's the source of "convexity" — the non-linearity that makes options fundamentally different from stocks.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 my-4">
          <div className="p-4 rounded-lg border border-gain/20 bg-gain/[0.04]">
            <p className="font-semibold text-gain mb-2">Long Gamma (buy options)</p>
            <ul className="text-sm text-muted space-y-1.5 leading-relaxed">
              <li>• You WANT big moves in either direction</li>
              <li>• Pay Theta daily (the cost of convexity)</li>
              <li>• As market moves your way, Delta increases (you get more long/short)</li>
              <li>• Classic: long straddle before earnings</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg border border-loss/20 bg-loss/[0.04]">
            <p className="font-semibold text-loss mb-2">Short Gamma (sell options)</p>
            <ul className="text-sm text-muted space-y-1.5 leading-relaxed">
              <li>• You WANT the market to stay still</li>
              <li>• Collect Theta daily (the premium for risk)</li>
              <li>• As market moves against you, you keep getting more exposed</li>
              <li>• Classic: covered calls, iron condors</li>
            </ul>
          </div>
        </div>
        <Callout type="danger">
          Short Gamma is the most dangerous position in options. Your loss is theoretically unlimited 
          on sharp moves. The 2018 VIX spike (VIX went from 13 to 37 in one day) destroyed 
          several short-vol funds that were short Gamma without understanding their true risk.
        </Callout>
        <Formula label="GAMMA P&L — THE SECOND-ORDER EFFECT">
{`P&L due to Gamma ≈ ½ × Γ × (ΔS)²

Example:
  Long straddle, Gamma = 0.05 (per ₹1 move)
  NIFTY moves 200 pts in one day

  Gamma P&L = ½ × 0.05 × 200² = ½ × 0.05 × 40,000 = ₹1,000 per unit

This is in ADDITION to the linear Delta P&L.
The (ΔS)² term is why buyers love big moves — gains are convex, losses are capped.`}
        </Formula>
      </Section>

      {/* ── SECTION 5 ── */}
      <Section title="5. Theta vs Gamma — The Central Trade-off">
        <p className="text-muted leading-relaxed mb-4">
          Here's the core insight that professional options traders live by: 
          <strong className="text-body"> Theta and Gamma are always in opposition</strong>. 
          You cannot have both positive Gamma (convexity) and positive Theta (time decay working for you) 
          unless you are doing something very exotic.
        </p>
        <div className="my-4 p-4 rounded-lg border border-amber/20 bg-amber/[0.03]">
          <p className="font-mono text-xs text-amber tracking-wider mb-3">THE THETA-GAMMA RELATIONSHIP</p>
          <div className="space-y-2 font-mono text-sm text-body">
            <p>Long options:  Gamma (+), Theta (−) → pays rent, benefits from big moves</p>
            <p>Short options: Gamma (−), Theta (+) → collects rent, exposed to big moves</p>
            <p className="mt-3 text-muted text-xs">Mathematically (from Black-Scholes PDE):</p>
            <p className="text-amber">Θ = −(½ × σ² × S² × Γ) − r × S × Δ − r × V</p>
            <p className="text-muted text-xs mt-1">The Gamma and Theta terms move together — you cannot escape this.</p>
          </div>
        </div>
        <p className="text-muted leading-relaxed mb-4">
          This explains why options selling strategies (collecting Theta) are not "free money." 
          You're short Gamma — you're exposed to blow-up risk from large moves. 
          The historical win rate looks great, but the occasional blowout is the price.
        </p>
        <Callout type="insight">
          The question isn't "which is better, long or short options?" It's: <em>is the implied volatility 
          (the price you're paying) rich or cheap relative to realised volatility?</em> 
          If IV &gt; realised vol → sell. If IV &lt; realised vol → buy. That's the vol risk premium in a sentence.
        </Callout>
      </Section>

      {/* ── SECTION 6 ── */}
      <Section title="6. Vega — Trading Volatility Itself">
        <p className="text-muted leading-relaxed mb-4">
          Vega is your exposure to changes in <strong className="text-body">implied volatility (IV)</strong> — 
          the market's forecast of future stock volatility. This is separate from realised vol. 
          IV is driven by supply/demand for options (fear, events, uncertainty).
        </p>
        <Formula label="VEGA EXPOSURE">
{`Dollar Vega = Vega × Contracts × Lot Size

Change in option value ≈ Vega × ΔIV (in percentage points)

Example:
  Long 5 NIFTY straddles (ATM), Vega per straddle = ₹250
  IV jumps from 15% to 20% (+5 points) ahead of RBI policy

  Vega P&L = ₹250 × 5 × 5 = ₹6,250 gain
  (this is BEFORE any move in NIFTY itself)`}
        </Formula>
        <div className="grid sm:grid-cols-2 gap-4 my-4">
          {[
            { when: "Long Vega trades (buy options)", plays: ["Buy straddle before earnings", "Buy options into low-IV calm markets", "Buy NIFTY puts before budget/event", "Long OTM options in low-VIX environment"] },
            { when: "Short Vega trades (sell options)", plays: ["Sell condors after IV spike", "Sell covered calls in high-IV periods", "Iron condor in range-bound markets", "Sell premium after earnings crush"] },
          ].map(({ when, plays }) => (
            <div key={when} className="p-4 rounded-lg border border-line bg-surface">
              <p className="font-semibold text-body text-sm mb-2">{when}</p>
              <ul className="space-y-1">
                {plays.map((p, i) => (
                  <li key={i} className="text-xs text-muted flex gap-2"><span className="text-amber">→</span>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ── SECTION 7 ── */}
      <Section title="7. Greeks as a Portfolio — Net Exposure">
        <p className="text-muted leading-relaxed mb-4">
          Professional options desks track <strong className="text-body">net Greeks</strong> across the entire book, 
          not per position. The sum tells you your aggregate risk.
        </p>
        <div className="my-4 rounded-lg border border-line overflow-hidden">
          <div className="bg-raised/40 px-4 py-2 font-mono text-xs text-muted tracking-wider">SAMPLE PORTFOLIO GREEK REPORT</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 text-left font-mono text-xs text-muted">Position</th>
                <th className="px-4 py-2.5 text-right font-mono text-xs text-[#5aa9f5]">Delta</th>
                <th className="px-4 py-2.5 text-right font-mono text-xs text-[#b79bff]">Gamma</th>
                <th className="px-4 py-2.5 text-right font-mono text-xs text-loss">Theta</th>
                <th className="px-4 py-2.5 text-right font-mono text-xs text-gain">Vega</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Long 2 NIFTY 22000 CE", "+0.52", "+0.04", "−₹180", "+₹240"],
                ["Short 2 NIFTY 22500 CE", "−0.28", "−0.02", "+₹120", "−₹140"],
                ["Long 1 NIFTY 21500 PE", "−0.35", "+0.03", "−₹160", "+₹190"],
                ["Short 3 NIFTY Futures",  "−3.00", "0",     "0",     "0"],
              ].map(([pos, d, g, t, v]) => (
                <tr key={pos} className="border-t border-line">
                  <td className="px-4 py-2.5 text-xs text-muted">{pos}</td>
                  <td className={`px-4 py-2.5 font-mono text-xs text-right ${d.startsWith("+") ? "text-gain" : "text-loss"}`}>{d}</td>
                  <td className={`px-4 py-2.5 font-mono text-xs text-right ${g.startsWith("+") ? "text-gain" : g === "0" ? "text-muted" : "text-loss"}`}>{g}</td>
                  <td className={`px-4 py-2.5 font-mono text-xs text-right ${t.startsWith("+") ? "text-gain" : "text-loss"}`}>{t}</td>
                  <td className={`px-4 py-2.5 font-mono text-xs text-right ${v.startsWith("+") ? "text-gain" : "text-loss"}`}>{v}</td>
                </tr>
              ))}
              <tr className="border-t border-line bg-raised/40">
                <td className="px-4 py-2.5 font-semibold text-xs text-body">NET BOOK</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right text-body font-semibold">−3.11</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right text-gain font-semibold">+0.05</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right text-loss font-semibold">−₹220</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right text-gain font-semibold">+₹290</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Reading this book: net delta is −3.11 (slightly net short), long Gamma (+0.05 — benefits from big moves), 
          paying Theta (−₹220/day), and long Vega (+₹290 — benefits if IV rises). 
          This is a <strong className="text-body">long volatility bias</strong> — expects a move or IV spike, pays ₹220/day for that view.
        </p>
      </Section>

      {/* Practice */}
      <div className="mt-10 p-6 rounded-xl border border-amber/20 bg-amber/[0.03]">
        <p className="font-mono text-xs text-amber tracking-wider mb-4">[ PRACTICE PROBLEMS ]</p>
        <div className="space-y-4">
          {[
            "You're long 5 lots of NIFTY 22000 CE (Delta = 0.55, lot = 50). NIFTY moves from 21,800 to 22,100 (+300 pts). Estimate your P&L using just Delta. Now add Gamma = 0.03 and recompute using the quadratic approximation. What's the difference?",
            "An ATM option has Theta = −₹150/day. You buy it 25 days before expiry for ₹3,500. If the stock stays at the same price, what is the option worth at expiry? What does this tell you about the 'break-even' move needed?",
            "You sold a straddle (ATM call + ATM put). Each leg has Vega = ₹200. IV was 18% when you sold. Before earnings, IV jumps to 26%. What is your Vega P&L? Does the stock even need to move for you to lose money?",
            "Construct an iron condor on NIFTY (short 22200 CE, long 22400 CE, short 21800 PE, long 21600 PE). Estimate the net Delta, Gamma, Theta, and Vega of the position. What market conditions does this profit from?",
            "A fund has a book with net Delta = +150, Gamma = +2, Theta = −₹5,000/day, Vega = +₹8,000. NIFTY drops 200 pts and IV falls 3 pts. Estimate the P&L impact from each Greek separately. Which Greek helped and which hurt?",
          ].map((q, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono text-amber text-sm shrink-0">{i + 1}.</span>
              <p className="text-sm text-muted leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-line flex justify-between">
        <Link href="/learn/position-sizing" className="font-mono text-xs text-muted hover:text-amber transition-colors">← Position Sizing</Link>
        <Link href="/learn" className="font-mono text-xs text-muted hover:text-amber transition-colors">All Articles →</Link>
      </div>
    </div>
  );
}

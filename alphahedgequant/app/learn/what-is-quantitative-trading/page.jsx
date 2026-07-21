import Link from "next/link";

export const metadata = {
  title: "What Is Quantitative Trading? | AHQ Learn",
  description: "Systematic vs discretionary, where edges come from, and why process beats prediction.",
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

export default function WhatIsQuantTradingArticle() {
  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <Link href="/learn" className="font-mono text-xs text-muted hover:text-amber transition-colors">
        ← Back to Learn
      </Link>

      <div className="mt-6 mb-10">
        <div className="flex gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-wider uppercase border border-gain/40 text-gain px-2 py-0.5 rounded">beginner</span>
          <span className="font-mono text-[10px] tracking-wider text-muted">8 min · Foundations</span>
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tight leading-tight">
          What Is Quantitative Trading?
        </h1>
        <p className="text-muted mt-3 text-base leading-relaxed">
          Strip away the mystique: quantitative trading is deciding your rules before the market opens,
          testing them on history, and then following them. Everything else is detail.
        </p>
      </div>

      <Section title="1. Systematic vs Discretionary — The Real Difference">
        <p className="text-muted leading-relaxed mb-4">
          A <strong className="text-body">discretionary</strong> trader looks at a chart, weighs the news, feels the
          setup, and decides. A <strong className="text-body">systematic (quantitative)</strong> trader wrote the
          decision down months ago as a rule — <em>if X and Y, then buy this much, with this stop</em> — and today
          merely executes it.
        </p>
        <p className="text-muted leading-relaxed mb-4">
          The difference is not intelligence or tools. It is <em>when the decision is made</em>. Discretionary
          decisions are made in the heat of the moment, where fear and greed live. Systematic decisions are made in
          cold blood, then tested against years of data before a single rupee is risked.
        </p>
        <NumberExample
          title="THE SAME TRADE, TWO WAYS"
          rows={[
            ["Discretionary", "“RELIANCE looks strong today, I'll buy some”", false],
            ["Systematic", "“Buy when 50-DMA crosses above 200-DMA; risk 1%; exit on reverse cross”", true],
            ["Testable in advance?", "No vs Yes", false],
            ["Repeatable under stress?", "Rarely vs Always", false],
          ]}
        />
        <Callout type="insight">
          A rule you can write down is a rule you can test. A rule you can test is a rule you can trust —
          or discard <em>before</em> it costs you money. That is the entire quant advantage.
        </Callout>
      </Section>

      <Section title="2. Where Edges Actually Come From">
        <p className="text-muted leading-relaxed mb-4">
          An <strong className="text-body">edge</strong> is a repeatable statistical tilt in your favour — a situation
          where the average outcome of your rule, over many trades, is positive after costs. Edges exist for
          identifiable reasons, and knowing the reason tells you when the edge might die:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 my-4">
          {[
            { title: "Risk premia", body: "Being paid to hold risk others avoid — equity risk premium, volatility premium (option sellers), illiquidity premium. Durable, but with painful drawdowns." },
            { title: "Behavioural effects", body: "Momentum (people chase), mean reversion (people overreact), post-earnings drift (people underreact). Persist because human nature persists." },
            { title: "Structural flows", body: "Index rebalancing, expiry-day option flows, forced institutional selling. Exist because someone must trade regardless of price." },
            { title: "Speed and information", body: "HFT and latency edges. Real, but an arms race you will not win from a laptop — ignore this category as a retail quant." },
          ].map(({ title, body }) => (
            <div key={title} className="p-4 rounded-lg border border-line bg-surface">
              <p className="font-semibold text-body mb-1.5">{title}</p>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <Callout type="warn">
          If you cannot articulate <strong>why</strong> an edge exists — who is on the other side and why they
          keep losing — you probably do not have an edge. You have a backtest that fit the past.
        </Callout>
      </Section>

      <Section title="3. Anatomy of a Quant Strategy">
        <p className="text-muted leading-relaxed mb-4">
          Every systematic strategy, from a two-line moving-average cross to a Renaissance-grade model, has the
          same four organs:
        </p>
        <div className="space-y-3 my-4">
          {[
            { step: "1", text: "Signal — the condition that says “the odds are tilted now”. E.g. RSI(14) < 30, or price crossing a moving average." },
            { step: "2", text: "Sizing — how much to bet when the signal fires. This decides survival. (See: Position Sizing Before Everything.)" },
            { step: "3", text: "Execution — how the order actually gets filled: at next open, with limit orders, with slippage assumptions. Backtests that fill at the signal bar's close are lying to you." },
            { step: "4", text: "Risk management — the exits: stops, time exits, drawdown circuit breakers. The part that keeps a bad month from becoming a dead account." },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-4 p-4 rounded-lg border border-line bg-surface/60">
              <span className="font-mono text-2xl font-bold text-amber/30 shrink-0">{step}</span>
              <p className="text-sm text-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-muted leading-relaxed mb-4">
          Beginners spend 95% of their time on the signal. Professionals spend most of theirs on sizing, execution
          and risk — because that is where the money is actually won or lost.
        </p>
      </Section>

      <Section title="4. Process Beats Prediction — Expectancy">
        <p className="text-muted leading-relaxed mb-4">
          Quants do not predict where the market goes tomorrow. They build rules with positive
          <strong className="text-body"> expectancy</strong> — the average profit per trade over many repetitions —
          and let the law of large numbers do the work.
        </p>
        <Formula label="EXPECTANCY">
{`Expectancy = (WinRate × AvgWin) − (LossRate × AvgLoss)

Example:
  Win rate:  45%   Avg win:  ₹2,000
  Loss rate: 55%   Avg loss: ₹1,000

  E = (0.45 × 2,000) − (0.55 × 1,000)
    = 900 − 550
    = +₹350 per trade

→ You can be wrong MOST of the time and still make money,
  if winners are bigger than losers. Prediction accuracy ≠ profit.`}
        </Formula>
        <Callout type="insight">
          A coin-flipper with a 45% win rate and 2:1 winners beats a forecaster with a 60% win rate and 1:2
          winners. Stop asking “will it go up?” and start asking “what is my expectancy after costs?”
        </Callout>
      </Section>

      <Section title="5. What You Actually Need to Start">
        <p className="text-muted leading-relaxed mb-4">
          Not a PhD, not co-located servers. You need: basic statistics (mean, standard deviation, correlation),
          one rule you can write in a sentence, historical daily data, and the discipline to test honestly —
          including costs, slippage, and the trades you would have hated taking.
        </p>
        <p className="text-muted leading-relaxed mb-4">
          A practical path: pick one idea (e.g. a moving-average cross with an ATR stop), backtest it on the
          <Link href="/copilot" className="text-amber hover:underline"> AHQ Copilot</Link> or the
          <Link href="/backtest" className="text-amber hover:underline"> Strategy Backtester</Link>, study
          where it loses, then read the Position Sizing article before risking anything real.
        </p>
        <Callout type="danger">
          The failure mode to avoid: testing 50 ideas, picking the one with the prettiest backtest, and trading it
          at full size. That is curve-fitting — the backtest “worked” by luck. Fewer ideas, tested more honestly,
          sized smaller.
        </Callout>
      </Section>

      <div className="mt-10 p-6 rounded-xl border border-amber/20 bg-amber/[0.03]">
        <p className="font-mono text-xs text-amber tracking-wider mb-4">[ PRACTICE PROBLEMS ]</p>
        <div className="space-y-4">
          {[
            "Write one trading rule you believe in as a single testable sentence (signal + size + exit). If you can't, what's missing?",
            "A strategy wins 38% of the time with average win ₹3,000 and average loss ₹1,200. Compute its expectancy. Is it tradeable?",
            "Classify these edges by source (risk premium / behavioural / structural): (a) selling index options monthly, (b) buying stocks entering the Nifty 50, (c) buying 12-month momentum leaders.",
            "Your backtest fills orders at the same bar's close as the signal. Why does this overstate results, and what's the honest alternative?",
            "A friend shows a backtest with 80% win rate found after testing 60 indicator combinations. List three reasons to distrust it and one way to validate it.",
          ].map((q, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono text-amber text-sm shrink-0">{i + 1}.</span>
              <p className="text-sm text-muted leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-line flex justify-between">
        <Link href="/learn" className="font-mono text-xs text-muted hover:text-amber transition-colors">← Back to Learn</Link>
        <Link href="/learn/reading-an-option-chain" className="font-mono text-xs text-muted hover:text-amber transition-colors">Next: Reading an Option Chain →</Link>
      </div>
    </div>
  );
}

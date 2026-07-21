import Link from "next/link";

export const metadata = {
  title: "Candlesticks Without the Mythology | AHQ Learn",
  description: "What price action genuinely encodes — and which patterns are statistical noise.",
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

export default function CandlesticksArticle() {
  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <Link href="/learn" className="font-mono text-xs text-muted hover:text-amber transition-colors">
        ← Back to Learn
      </Link>

      <div className="mt-6 mb-10">
        <div className="flex gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-wider uppercase border border-gain/40 text-gain px-2 py-0.5 rounded">beginner</span>
          <span className="font-mono text-[10px] tracking-wider text-muted">9 min · Technical</span>
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tight leading-tight">
          Candlesticks Without the Mythology
        </h1>
        <p className="text-muted mt-3 text-base leading-relaxed">
          A candle is four numbers drawn as a picture. The picture is useful; the folklore around it mostly is not.
          Here's what price action genuinely encodes — and which famous patterns fail when you actually count.
        </p>
      </div>

      <Section title="1. What a Candle Actually Is">
        <p className="text-muted leading-relaxed mb-4">
          One candle = one period's <strong className="text-body">Open, High, Low, Close</strong>. The body spans
          open→close; the wicks span to high and low. That's it. Everything a candle can tell you must be a
          function of those four numbers (plus volume). No pattern contains information beyond OHLCV — it can
          only <em>summarise</em> it.
        </p>
        <Formula label="THE ONLY REAL SIGNALS IN A CANDLE">
{`Range        = High − Low              → how much energy this period
Body ratio   = |Close − Open| / Range  → how one-sided the fight was
Close location = (Close − Low) / Range → who won: near 1 = buyers,
                                          near 0 = sellers
Gap          = Open − PrevClose        → overnight information shock`}
        </Formula>
        <Callout type="insight">
          Every named pattern — doji, hammer, engulfing, marubozu — is just a region in this 3-number space
          (body ratio, close location, gap). Naming it doesn't add predictive power; testing it does.
        </Callout>
      </Section>

      <Section title="2. The Information That Is Really There">
        <p className="text-muted leading-relaxed mb-4">
          Decades of academic and practitioner research agree that price series do carry some exploitable
          structure — just not where the folklore says. The robust findings:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 my-4">
          {[
            { title: "Volatility clusters", body: "Big ranges follow big ranges; quiet follows quiet. The single most reliable fact in markets — the basis of GARCH, ATR sizing, and vol targeting." },
            { title: "Gaps carry news", body: "An open far from the prior close means real overnight information. Gap size and direction have measurable short-horizon drift, especially with volume confirmation." },
            { title: "Range breakouts + volume", body: "A close beyond a multi-week high/low on elevated volume has modest positive drift — this is just momentum wearing candlestick clothes." },
            { title: "Close location streaks", body: "Repeated closes near highs (or lows) measure persistent one-sided pressure — a crude but honest trend gauge." },
          ].map(({ title, body }) => (
            <div key={title} className="p-4 rounded-lg border border-line bg-surface">
              <p className="font-semibold text-body mb-1.5">{title}</p>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="3. Patterns That Fail the Count">
        <p className="text-muted leading-relaxed mb-4">
          Large-sample studies that tested classical patterns mechanically (define the pattern precisely, measure
          forward returns, subtract costs) keep reaching the same verdict: most single- and two-candle reversal
          patterns have <strong className="text-body">no edge distinguishable from chance</strong> on liquid
          instruments at daily frequency.
        </p>
        <NumberExample
          title="TYPICAL MECHANICAL TEST RESULTS (daily, liquid stocks, after costs)"
          rows={[
            ["Doji “indecision reversal”", "≈ coin flip", true],
            ["Hammer / shooting star alone", "≈ coin flip", true],
            ["Bullish/bearish engulfing alone", "tiny effect, dies after costs", false],
            ["Morning/evening star", "too rare for stable statistics", false],
            ["Breakout + volume (momentum)", "small but persistent edge", true],
          ]}
        />
        <Callout type="danger">
          Why the folklore survives anyway: confirmation bias (you remember the hammer that nailed the low, forget
          the twenty that didn't), and hindsight charts that only show the winners. If a pattern can't be written
          as code and tested, treat every claim about it as marketing.
        </Callout>
        <Callout type="warn">
          The honest caveat: patterns <em>conditioned on context</em> (at a multi-month level, after a volatility
          spike, with a volume anomaly) sometimes test better than the pattern alone. The context is doing the
          work — the candle is just the trigger.
        </Callout>
      </Section>

      <Section title="4. How a Quant Actually Uses Price Action">
        <div className="space-y-3 my-4">
          {[
            { step: "1", text: "Range → risk. ATR (average true range) sets stop distances and position sizes. This is candles' single most valuable use." },
            { step: "2", text: "Close location → trend filter. Average close-location over 10 bars > 0.6 = persistent buying. Use as a regime gate, not an entry." },
            { step: "3", text: "Gaps → event flags. Large gaps mark information days; many strategies simply stand aside or tighten risk after them." },
            { step: "4", text: "Levels → liquidity. Multi-week highs/lows attract stops and orders. Trade the breakout or the failure — but define both mechanically." },
            { step: "5", text: "Everything gets tested. Any candle idea you like → write it as a rule → backtest with costs → keep only what survives." },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-4 p-4 rounded-lg border border-line bg-surface/60">
              <span className="font-mono text-2xl font-bold text-amber/30 shrink-0">{step}</span>
              <p className="text-sm text-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <Formula label="EXAMPLE: A TESTABLE PRICE-ACTION RULE">
{`Instead of: "buy the hammer at support"  (untestable folklore)

Write:      BUY when  Close > highest High of last 20 bars
            AND Volume > 1.5 × 20-bar average volume
            Stop = 2 × ATR(14) below entry
            Exit = Close < 10-bar low

→ This is momentum + volume + volatility sizing.
  Every term is computable. Now it can be backtested —
  try it in the AHQ Copilot.`}
        </Formula>
      </Section>

      <div className="mt-10 p-6 rounded-xl border border-amber/20 bg-amber/[0.03]">
        <p className="font-mono text-xs text-amber tracking-wider mb-4">[ PRACTICE PROBLEMS ]</p>
        <div className="space-y-4">
          {[
            "A candle has O=500, H=520, L=496, C=518. Compute range, body ratio, and close location. Who controlled this period?",
            "Write a precise, testable definition of a 'hammer' using only OHLC arithmetic (thresholds included). Why do different books' hammers give different backtest results?",
            "Yesterday's range was 3× the 20-day average. What does volatility clustering predict for today, and what should happen to your position size?",
            "Design a test for 'bullish engulfing at 20-day lows': entry, exit, sample, and the null hypothesis you are trying to reject.",
            "A stock gaps up 4% on 5× volume and closes at its high. Name two structural/behavioural reasons this might drift higher, and one risk of chasing it.",
          ].map((q, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono text-amber text-sm shrink-0">{i + 1}.</span>
              <p className="text-sm text-muted leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-line flex justify-between">
        <Link href="/learn/reading-an-option-chain" className="font-mono text-xs text-muted hover:text-amber transition-colors">← Reading an Option Chain</Link>
        <Link href="/learn/position-sizing" className="font-mono text-xs text-muted hover:text-amber transition-colors">Next: Position Sizing →</Link>
      </div>
    </div>
  );
}

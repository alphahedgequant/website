import Link from "next/link";

export const metadata = {
  title: "Reading an Option Chain | AHQ Learn",
  description: "Strikes, premiums, OI and IV — what each column actually tells you about positioning.",
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

export default function ReadingOptionChainArticle() {
  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <Link href="/learn" className="font-mono text-xs text-muted hover:text-amber transition-colors">
        ← Back to Learn
      </Link>

      <div className="mt-6 mb-10">
        <div className="flex gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-wider uppercase border border-gain/40 text-gain px-2 py-0.5 rounded">beginner</span>
          <span className="font-mono text-[10px] tracking-wider text-muted">10 min · Derivatives</span>
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tight leading-tight">
          Reading an Option Chain
        </h1>
        <p className="text-muted mt-3 text-base leading-relaxed">
          The option chain is a live map of what thousands of traders are paying for the right to buy or sell.
          Learn to read four columns — strike, premium, OI, IV — and the map starts talking.
        </p>
      </div>

      <Section title="1. What the Chain Is">
        <p className="text-muted leading-relaxed mb-4">
          An option chain lists, for one underlying (say NIFTY) and one expiry, every available
          <strong className="text-body"> strike price</strong> — with <strong className="text-body">calls</strong> on
          one side and <strong className="text-body">puts</strong> on the other. A call is the right to buy at the
          strike; a put is the right to sell at the strike. The chain is symmetric around the current price
          (the <em>at-the-money</em> or ATM strike).
        </p>
        <NumberExample
          title="MINI CHAIN — NIFTY at 25,000 (illustrative)"
          rows={[
            ["CALL 24,800 (ITM)", "premium ₹310 · OI 8.1L", false],
            ["CALL 25,000 (ATM)", "premium ₹180 · OI 14.2L", true],
            ["CALL 25,200 (OTM)", "premium ₹85 · OI 21.5L", false],
            ["PUT 25,000 (ATM)", "premium ₹165 · OI 12.9L", true],
            ["PUT 24,800 (OTM)", "premium ₹90 · OI 19.8L", false],
          ]}
        />
        <Callout type="info">
          ITM = in the money (strike already favourable). ATM = at the money (strike ≈ spot). OTM = out of the
          money (needs a move to pay off). Premiums fall as you go further OTM — you are paying less for a
          less likely outcome.
        </Callout>
      </Section>

      <Section title="2. Premium — What You're Actually Paying For">
        <p className="text-muted leading-relaxed mb-4">
          Every premium splits into two parts. <strong className="text-body">Intrinsic value</strong> is what the
          option would be worth if exercised right now. <strong className="text-body">Time value</strong> is
          everything else — the price of possibility before expiry.
        </p>
        <Formula label="PREMIUM DECOMPOSITION">
{`Premium = Intrinsic value + Time value

Call intrinsic = max(Spot − Strike, 0)
Put intrinsic  = max(Strike − Spot, 0)

Example: NIFTY at 25,000
  CALL 24,800 @ ₹310 → intrinsic = 200, time value = 110
  CALL 25,200 @ ₹85  → intrinsic = 0,   time value = 85  (all hope)

Time value decays to ZERO at expiry — this decay is theta,
and it is what option sellers are farming.`}
        </Formula>
        <Callout type="warn">
          OTM options are 100% time value. Buying them is buying a melting ice cube — you need the move to
          happen <em>fast</em>, not just eventually.
        </Callout>
      </Section>

      <Section title="3. Open Interest — The Positioning Map">
        <p className="text-muted leading-relaxed mb-4">
          <strong className="text-body">Open interest (OI)</strong> is the number of contracts currently open
          (created and not yet closed). It is not volume — volume counts trades today, OI counts positions
          still alive. OI tells you <em>where</em> the market has committed money.
        </p>
        <p className="text-muted leading-relaxed mb-4">
          The key: in index options, large OI is dominated by <strong className="text-body">sellers</strong>
          (institutions writing options for premium). Sellers at a strike are betting the index will NOT cross it.
          So huge call OI marks a level the sellers defend as resistance; huge put OI marks defended support.
        </p>
        <NumberExample
          title="READING OI — NIFTY at 25,000"
          rows={[
            ["25,500 CALL OI: 45L (highest)", "→ sellers bet NIFTY stays below 25,500 = resistance", true],
            ["24,500 PUT OI: 38L (highest)", "→ sellers bet NIFTY stays above 24,500 = support", true],
            ["Expected expiry range", "24,500 – 25,500", false],
            ["Rising OI + rising price", "longs building (bullish confirmation)", false],
            ["Rising OI + falling price", "shorts building (bearish confirmation)", false],
            ["Falling OI", "positions unwinding — old trend losing fuel", false],
          ]}
        />
        <Callout type="insight">
          Change in OI matters more than the level. A strike where call OI jumped 30% today is fresh conviction;
          a big stale number may be months old. Most platforms (and the AHQ Options desk) show ΔOI for this reason.
        </Callout>
      </Section>

      <Section title="4. Implied Volatility — The Price of Fear">
        <p className="text-muted leading-relaxed mb-4">
          <strong className="text-body">Implied volatility (IV)</strong> is the market's forecast of how much the
          underlying will move, reverse-engineered from the premium. High IV = expensive options = the market
          expects turbulence. Low IV = cheap options = calm expected.
        </p>
        <Formula label="RULE-OF-THUMB: EXPECTED MOVE">
{`Expected 1-day move ≈ Spot × IV / √252
Expected move to expiry ≈ ATM straddle price (call + put premium)

Example: NIFTY 25,000, ATM call ₹180 + ATM put ₹165 = ₹345
→ market prices a ±345 point move (≈1.4%) by expiry.

If you think the move will be BIGGER → buy options.
If you think it will be SMALLER → sell them (with defined risk).`}
        </Formula>
        <Callout type="danger">
          The classic beginner trap: buying calls before a known event (budget, earnings) and losing money even
          when you are right about direction — because IV was pumped beforehand and collapsed after
          (<em>IV crush</em>). You paid for the fear, and the fear left.
        </Callout>
      </Section>

      <Section title="5. A 60-Second Chain Read — Checklist">
        <div className="space-y-3 my-4">
          {[
            { step: "1", text: "Find the ATM strike (nearest to spot). Note the straddle price — that's the market's expected move." },
            { step: "2", text: "Find max call OI above and max put OI below. That's the market's expected range and its support/resistance." },
            { step: "3", text: "Scan ΔOI: which strikes gained the most today? Fresh positioning beats stale positioning." },
            { step: "4", text: "Check IV vs its own recent history. High IV favours selling strategies, low IV favours buying." },
            { step: "5", text: "Sanity-check with price: OI walls mean little if price is trending through them with rising volume." },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-4 p-4 rounded-lg border border-line bg-surface/60">
              <span className="font-mono text-2xl font-bold text-amber/30 shrink-0">{step}</span>
              <p className="text-sm text-muted leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-muted leading-relaxed mb-4">
          Practice on the live chain in the <Link href="/options" className="text-amber hover:underline">AHQ Options
          desk</Link> — click any LTP to build the position and see its payoff. When you're ready for the risk
          mathematics behind premiums, continue to <Link href="/learn/options-greeks" className="text-amber hover:underline">
          Options Greeks in Practice</Link>.
        </p>
      </Section>

      <div className="mt-10 p-6 rounded-xl border border-amber/20 bg-amber/[0.03]">
        <p className="font-mono text-xs text-amber tracking-wider mb-4">[ PRACTICE PROBLEMS ]</p>
        <div className="space-y-4">
          {[
            "NIFTY is at 24,750. Classify these as ITM/ATM/OTM: (a) 24,500 call, (b) 25,000 call, (c) 25,000 put, (d) 24,000 put.",
            "A 24,500 call trades at ₹390 with NIFTY at 24,750. Split the premium into intrinsic and time value.",
            "Max call OI sits at 25,000 (52L) and max put OI at 24,200 (47L). What range is the market pricing for expiry, and who is defending each boundary?",
            "ATM straddle costs ₹410 with NIFTY at 24,750. What % move is priced in? If you expect a 0.8% move, should you be a net buyer or seller of premium?",
            "Before results, a stock's IV is 68% (usual: 30%). You are bullish. Explain two ways to express the view that don't just buy an OTM call at peak IV.",
          ].map((q, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono text-amber text-sm shrink-0">{i + 1}.</span>
              <p className="text-sm text-muted leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-line flex justify-between">
        <Link href="/learn/what-is-quantitative-trading" className="font-mono text-xs text-muted hover:text-amber transition-colors">← What Is Quant Trading?</Link>
        <Link href="/learn/candlesticks-without-mythology" className="font-mono text-xs text-muted hover:text-amber transition-colors">Next: Candlesticks Without the Mythology →</Link>
      </div>
    </div>
  );
}

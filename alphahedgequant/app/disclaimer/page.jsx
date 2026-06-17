export const metadata = {
  title: "Disclaimer — AlphaHedgeQuant",
  description: "Important risk disclosure and disclaimer for AlphaHedgeQuant. Educational and research purposes only.",
};

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function Disclaimer() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : LEGAL — DISCLAIMER ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">Disclaimer &amp; Risk Disclosure</h1>
      <p className="text-muted text-sm mt-2">Last updated: June 2026</p>

      <div className="card p-5 mt-8 border-amber/30 bg-amber/[0.03]">
        <p className="text-sm text-body leading-relaxed">
          <strong className="text-amber">AlphaHedgeQuant is an educational and research platform only.</strong>{" "}
          It is <strong>not</strong> a SEBI-registered investment adviser, research analyst, or
          stockbroker. Nothing on this platform is investment advice or a recommendation to buy,
          sell, or hold any security. All content is for informational and educational purposes.
        </p>
      </div>

      <div className="mt-10">
        <Section title="1. Not Investment Advice">
          <p>
            The signals, scores, backtests, models, screeners, articles, and any other content
            provided by AlphaHedgeQuant ("AHQ", "we", "the platform") are produced by automated
            quantitative models and for educational illustration. They do not constitute investment,
            financial, legal, tax, or trading advice, and must not be relied upon as the basis for
            any investment decision.
          </p>
          <p>
            We are not registered with the Securities and Exchange Board of India (SEBI) or any
            other financial regulator as an investment adviser or research analyst. You should
            consult a SEBI-registered investment adviser before making any financial decision.
          </p>
        </Section>

        <Section title="2. No Buy / Sell Recommendations">
          <p>
            Any "BUY", "SELL", "HOLD", or similar label shown on the platform is the output of a
            mathematical model applied to historical and live market data. These labels are
            illustrations of how the underlying models classify data — they are not personalised
            recommendations and do not account for your financial situation, risk tolerance, or
            objectives.
          </p>
        </Section>

        <Section title="3. Market Risk">
          <p>
            Trading and investing in securities, derivatives, commodities, and other financial
            instruments involves substantial risk of loss and is not suitable for every investor.
            You may lose some or all of your invested capital. Leveraged products such as futures
            and options carry an even higher level of risk.
          </p>
          <p>
            Past performance — including any backtested or simulated results shown on this platform
            — is not indicative of future results. Backtests are hypothetical, do not represent
            actual trading, and do not account for transaction costs, slippage, market impact,
            liquidity, or other real-world factors.
          </p>
        </Section>

        <Section title="4. Data Accuracy">
          <p>
            Market data on this platform is sourced from third parties (including exchange feeds and
            public data providers) and may be delayed, incomplete, or inaccurate. We do not warrant
            the accuracy, completeness, or timeliness of any data and are not liable for any errors
            or omissions, or for any action taken in reliance on such data.
          </p>
        </Section>

        <Section title="5. No Liability">
          <p>
            To the maximum extent permitted by law, AlphaHedgeQuant and its operators shall not be
            liable for any direct, indirect, incidental, consequential, or other loss or damage
            arising from your use of the platform or reliance on any content, including any trading
            or investment losses.
          </p>
        </Section>

        <Section title="6. Your Responsibility">
          <p>
            You are solely responsible for your own investment and trading decisions. You should do
            your own research, understand the risks, and seek advice from a qualified, registered
            professional. By using this platform you acknowledge and accept these terms.
          </p>
        </Section>

        <Section title="7. Research Content">
          <p>
            Research papers, articles, and references on this platform — including the operator's own
            published work — are for academic and educational discussion. They do not constitute a
            recommendation and may reflect methods that are experimental or simplified for clarity.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this disclaimer can be sent to{" "}
            <a href="mailto:hello@alphahedgequant.com" className="text-amber hover:underline">
              hello@alphahedgequant.com
            </a>.
          </p>
        </Section>
      </div>
    </div>
  );
}

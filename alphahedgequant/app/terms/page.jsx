export const metadata = {
  title: "Terms of Use — AlphaHedgeQuant",
  description: "Terms governing your use of the AlphaHedgeQuant platform.",
};

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : LEGAL — TERMS ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">Terms of Use</h1>
      <p className="text-muted text-sm mt-2">Last updated: June 2026</p>

      <div className="mt-10">
        <Section title="1. Acceptance">
          <p>
            By accessing or using AlphaHedgeQuant ("AHQ", "the platform"), you agree to these Terms
            of Use and our Disclaimer and Privacy Policy. If you do not agree, do not use the platform.
          </p>
        </Section>

        <Section title="2. Educational Purpose">
          <p>
            The platform is provided for educational and research purposes only. It does not provide
            investment advice and is not a substitute for advice from a SEBI-registered professional.
            See our{" "}
            <a href="/disclaimer" className="text-amber hover:underline">full Disclaimer</a>{" "}
            for the complete risk disclosure.
          </p>
        </Section>

        <Section title="3. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-amber">→</span><span>Scrape, harvest, or systematically extract data or content beyond normal personal use.</span></li>
            <li className="flex gap-2"><span className="text-amber">→</span><span>Attempt to disrupt, overload, reverse-engineer, or gain unauthorised access to the platform or its infrastructure.</span></li>
            <li className="flex gap-2"><span className="text-amber">→</span><span>Resell, redistribute, or commercially exploit the content without written permission.</span></li>
            <li className="flex gap-2"><span className="text-amber">→</span><span>Use the platform for any unlawful purpose.</span></li>
          </ul>
        </Section>

        <Section title="4. Intellectual Property">
          <p>
            All original content, code, models, articles, and design on the platform are the property
            of the operator unless otherwise stated. Third-party research and data referenced on the
            platform remain the property of their respective owners and are linked for reference.
          </p>
        </Section>

        <Section title="5. No Warranty">
          <p>
            The platform is provided "as is" and "as available", without warranties of any kind,
            express or implied, including accuracy, reliability, or fitness for a particular purpose.
            We do not guarantee the platform will be uninterrupted, error-free, or secure.
          </p>
        </Section>

        <Section title="6. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, the operator shall not be liable for any loss or
            damage — including trading or investment losses — arising from your use of, or inability
            to use, the platform or any content on it.
          </p>
        </Section>

        <Section title="7. Third-Party Links">
          <p>
            The platform may link to third-party websites and resources (such as research papers and
            data sources). We are not responsible for the content, accuracy, or practices of those
            external sites.
          </p>
        </Section>

        <Section title="8. Changes &amp; Governing Law">
          <p>
            We may update these terms at any time; continued use constitutes acceptance of the
            updated terms. These terms are governed by the laws of India, and any disputes are
            subject to the jurisdiction of the courts of Pune, Maharashtra.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms:{" "}
            <a href="mailto:hello@alphahedgequant.com" className="text-amber hover:underline">
              hello@alphahedgequant.com
            </a>.
          </p>
        </Section>
      </div>
    </div>
  );
}

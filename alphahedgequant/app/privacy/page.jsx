export const metadata = {
  title: "Privacy Policy — AlphaHedgeQuant",
  description: "How AlphaHedgeQuant collects, uses, and protects your personal data.",
};

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : LEGAL — PRIVACY ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">Privacy Policy</h1>
      <p className="text-muted text-sm mt-2">Last updated: June 2026</p>

      <div className="mt-10">
        <Section title="1. Who We Are">
          <p>
            AlphaHedgeQuant ("AHQ", "we", "us") operates the website at alphahedgequant.com. This
            policy explains what personal data we collect, why, and your rights over it.
          </p>
        </Section>

        <Section title="2. What We Collect">
          <p>We keep data collection minimal. We collect:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2"><span className="text-amber">→</span><span><strong className="text-body">Email address</strong> — when you voluntarily join our waitlist.</span></li>
            <li className="flex gap-2"><span className="text-amber">→</span><span><strong className="text-body">Signup source &amp; timestamp</strong> — which page you signed up from and when, to understand interest.</span></li>
            <li className="flex gap-2"><span className="text-amber">→</span><span><strong className="text-body">Approximate IP / network info</strong> — used only for rate limiting and abuse prevention.</span></li>
            <li className="flex gap-2"><span className="text-amber">→</span><span><strong className="text-body">Basic analytics</strong> — aggregated, non-identifying usage data (pages viewed, device type) if analytics is enabled.</span></li>
          </ul>
          <p>
            We do <strong>not</strong> collect financial account details, trading credentials, or
            payment information through this website.
          </p>
        </Section>

        <Section title="3. How We Use It">
          <p>
            We use your email solely to notify you about platform launches and updates you signed
            up for. We use technical data to keep the service secure and functioning. We do not sell,
            rent, or trade your personal data to third parties.
          </p>
        </Section>

        <Section title="4. Where It's Stored">
          <p>
            Waitlist data is stored in a managed PostgreSQL database (Neon). The website is hosted on
            Vercel and our API on Render. These providers process data on our behalf under their own
            security and privacy commitments. Data may be processed on servers located outside your
            country of residence.
          </p>
        </Section>

        <Section title="5. Cookies">
          <p>
            We use minimal cookies — primarily those strictly necessary for the site to function and,
            if enabled, privacy-respecting analytics. We do not use advertising or cross-site tracking
            cookies.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>
            You can ask us to access, correct, or delete your personal data at any time. To be
            removed from the waitlist or to request deletion of your data, email us and we will
            action it promptly.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p>
            We retain waitlist emails until you ask us to remove them or until the data is no longer
            needed for the purpose it was collected.
          </p>
        </Section>

        <Section title="8. Changes">
          <p>
            We may update this policy as the platform evolves. Material changes will be reflected by
            updating the "last updated" date above.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any privacy request or question, contact{" "}
            <a href="mailto:hello@alphahedgequant.com" className="text-amber hover:underline">
              hello@alphahedgequant.com
            </a>.
          </p>
        </Section>
      </div>
    </div>
  );
}

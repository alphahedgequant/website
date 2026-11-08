import InsightsPrivacyControl from "@/components/InsightsPrivacyControl";
import Ga4PrivacyControl from "@/components/Ga4PrivacyControl";
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
      <p className="text-muted text-sm mt-2">Last updated: November 2026</p>

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
            <li className="flex gap-2"><span className="text-amber">→</span><span><strong className="text-body">Basic analytics</strong> — first-party page visits, broad feature-use counts and estimated active reading time where your browser permits analytics.</span></li>
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

        <Section title="5. First-Party Product Analytics">
          <p>AlphaHedgeQuant uses its own first-party analytics collector and our managed PostgreSQL database. The first-party collector is separate from the optional, consent-gated Google Analytics 4 integration described below. We do not send these first-party collector records to PostHog. The private, owner-only dashboard summarizes daily, weekly and monthly pseudonymous browser visits, most visited pages, approximate active reading time, coarse feature use and source categories such as X, LinkedIn or search.</p>
          <p>Where browser settings permit, a random browser identifier is stored locally to estimate distinct and returning visitors. Identifiers are transformed into a keyed hash before being stored. We record only the page pathname (not its query or search terms), whitelisted event names, measured active seconds and sanitized campaign labels. We do not log the visitor's raw IP address, email, portfolio holdings, searched tickers, strategy parameters or individual financial account details as analytics events. Server-confirmed waitlist registrations are counted separately without storing email in the analytics events table.</p>
          <p>We honor Global Privacy Control and Do Not Track where available. You can opt out and request removal of your browser identifier's analytics records using the control below. Analytics events are retained for up to approximately 180 days and then automatically removed during subsequent collection. Records collected by the previous provider, where applicable, are subject to that provider's separate retention controls.</p>
          <InsightsPrivacyControl/>
        </Section>
        <Section title="5A. Optional Google Analytics 4">
          <p>Google Analytics 4 (Google LLC) is a separate, optional service. It remains off until we configure a valid measurement property and you explicitly opt in below. When enabled, the Google tag processes coarse page groups and selected feature-use events. We exclude sensitive routes, query strings, searched tickers, strategy parameters and account identifiers from custom events. Google may process analytics identifiers and use analytics cookies under its own service and retention terms. Advertising personalization and Google Signals are not enabled in our integration. You may revoke future collection here; revoking consent does not automatically delete data previously held by Google.</p>
          <Ga4PrivacyControl/>
        </Section>
        <Section title="6. Cookies">
          <p>
            We use minimal cookies — primarily those strictly necessary for the site to function and,
            if enabled, the first-party analytics identifier described above. We do not use advertising or cross-site tracking
            cookies.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>
            You can ask us to access, correct, or delete your personal data at any time. To be
            removed from the waitlist or to request deletion of your data, email us and we will
            action it promptly.
          </p>
        </Section>

        <Section title="8. Data Retention">
          <p>
            We retain waitlist emails until you ask us to remove them or until the data is no longer
            needed for the purpose it was collected.
          </p>
        </Section>

        <Section title="9. Changes">
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

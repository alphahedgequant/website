import IpoScreen from "@/components/IpoScreen";

export const metadata = {
  title: "IPO Intelligence India — Upcoming IPOs, GMP & Listing Performance | AlphaHedgeQuant",
  description: "Explore Indian IPO opening and closing dates, price bands, lot sizes, subscription, unofficial grey market premium (GMP), and recently listed IPO performance. Free to view.",
  alternates: { canonical: "/ipo" },
  openGraph: {
    title: "IPO Intelligence India | AlphaHedgeQuant",
    description: "Free Indian IPO calendar, GMP indications, price bands, subscription figures and listing performance with freshness and uncertainty notes.",
    url: "/ipo",
    type: "website",
  },
};

const pageSchema={
  "@context":"https://schema.org",
  "@type":"CollectionPage",
  name:"IPO Intelligence India — Calendar, GMP & Listing Performance",
  url:"https://www.alphahedgequant.com/ipo",
  description:"Free Indian IPO intelligence: opening and closing dates, prices, lot sizes, unofficial GMP indications and historical listing performance.",
  isAccessibleForFree:true,
  inLanguage:"en-IN",
  publisher:{"@type":"Organization",name:"AlphaHedgeQuant",url:"https://www.alphahedgequant.com"}
};

export default function Page() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(pageSchema).replace(/</g,"\\u003c")}} />
    <section className="mx-auto max-w-[1200px] px-6 pt-12 md:pt-16 text-body">
      <p className="eyebrow tracking-[.24em]">ALPHAHEDGEQUANT / IPO INTELLIGENCE</p>
      <h1 className="mt-5 max-w-4xl font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">Indian IPO Intelligence<span className="text-amber">.</span></h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-muted md:text-lg">Track upcoming and open Indian IPOs, compare price bands and subscription, and review unofficial grey-market premiums alongside actual listing performance. Free to explore — no account required.</p>
    </section>
    <IpoScreen />
    <section className="mx-auto max-w-[1200px] px-6 pb-16 text-body" aria-label="IPO research glossary">
      <div className="border-t border-line pt-9">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">Understand IPO pricing and listing gains</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-lg">What is an IPO grey market premium?</h3>
            <p className="mt-3 leading-7 text-muted">A grey market premium (GMP) is an unofficial indication of a premium or discount over an IPO's issue price. It is not an exchange-reported price and may be incomplete, disputed or stale. An implied listing price is not a prediction.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">What does listing gain mean?</h3>
            <p className="mt-3 leading-7 text-muted">Listing gain or loss compares an IPO's trading debut with its issue price. It can differ substantially from the pre-listing GMP because demand, risk appetite and market conditions change. Check source timestamps before making comparisons.</p>
          </div>
        </div>
      </div>
    </section>
  </>;
}

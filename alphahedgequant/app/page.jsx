import PremiumEditorial from "@/components/PremiumEditorial";
import "./premium-editorial.css";

// Homepage SEO metadata is intentionally page-scoped: a global "/" canonical
// would incorrectly mark all authenticated product pages as homepage duplicates.
export const metadata = {
  title: "AlphaHedgeQuant | Quant Finance Research, IPO Intelligence & Market Tools",
  description: "AlphaHedgeQuant (AHQ) offers Indian IPO intelligence with unofficial GMP indications, NSE and US stock screeners, options analytics, quant models, research, backtesting and educational resources.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AlphaHedgeQuant — Quant Finance, Indian IPOs & Market Intelligence",
    description: "Explore AlphaHedgeQuant's Indian IPO Intelligence, quantitative research, market intelligence, options analytics, models, backtesting and learning resources.",
    url: "/",
    type: "website",
    siteName: "AlphaHedgeQuant",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.alphahedgequant.com/#organization",
      name: "AlphaHedgeQuant",
      alternateName: ["Alpha Hedge Quant", "AHQ"],
      url: "https://www.alphahedgequant.com",
      description: "Independent quantitative finance research, IPO intelligence, market tools and education."
    },
    {
      "@type": "WebSite",
      "@id": "https://www.alphahedgequant.com/#website",
      name: "AlphaHedgeQuant",
      alternateName: "AHQ",
      url: "https://www.alphahedgequant.com",
      inLanguage: "en-IN",
      publisher: { "@id": "https://www.alphahedgequant.com/#organization" }
    }
  ]
};

export default function Home() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData).replace(/</g,"\\u003c")}}/>
    <PremiumEditorial/>
  </>;
}

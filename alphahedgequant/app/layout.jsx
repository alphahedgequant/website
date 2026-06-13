import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata = {
  title: "AlphaHedgeQuant — Quant research, market intelligence & AI backtesting",
  description:
    "AlphaHedgeQuant (AHQ) is a quantitative finance platform: live NSE & US market intelligence, a 10-strategy quant scanner, an AI backtesting agent, and a serious quant education hub.",
  metadataBase: new URL("https://alphahedgequant.com"),
  openGraph: {
    title: "AlphaHedgeQuant",
    description: "Quant research, market intelligence & AI backtesting.",
    url: "https://alphahedgequant.com",
    siteName: "AlphaHedgeQuant",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body min-h-screen flex flex-col">
        <div className="bg-field" aria-hidden="true">
          <span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" /><span className="orb orb-d" />
        </div>
        <div className="grain" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

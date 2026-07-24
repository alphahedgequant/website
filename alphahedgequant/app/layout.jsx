import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
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

// Dark theming + premium gold-shimmer TEXT on the sign-in / sign-up buttons.
const clerkAppearance = {
  variables: {
    colorPrimary: "#E3BE4F",
    colorBackground: "#0C0D11",
    colorText: "#E6EAF2",
    colorTextSecondary: "#8A94A8",
    colorInputBackground: "#13151B",
    colorInputText: "#E6EAF2",
    colorDanger: "#F0564F",
    borderRadius: "0.6rem",
  },
  elements: {
    card: { backgroundColor: "#0C0D11", border: "1px solid rgba(148,163,184,0.14)" },
    headerTitle: { color: "#ECEAE0" },
    // Social buttons (Apple / Google): dark frame + gold border + gold shimmer text.
    socialButtonsBlockButton: "ahq-authbtn",
    socialButtonsBlockButtonText: "ahq-goldtext",
    socialButtonsProviderIcon__apple: "ahq-apple-icon",
    // Primary "Continue" button: same premium gold-shimmer text treatment.
    formButtonPrimary: "ahq-authbtn ahq-goldtext",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-body min-h-screen flex flex-col">
          <div className="bg-field" aria-hidden="true">
            <span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" /><span className="orb orb-d" />
          </div>
          <div className="grain" aria-hidden="true" />
          <div className="grid-field" aria-hidden="true" />
          <div className="vignette" aria-hidden="true" />
          <div className="alpha-mark" aria-hidden="true">&#945;</div>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}

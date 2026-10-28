import Link from "next/link";

export default function Footer() {
  return (
    <footer className="ahq-site-footer border-t border-line mt-20">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-16 grid gap-10 md:grid-cols-3">
        <div>
          <Link href="/" className="ahq-logo inline-flex items-center gap-2.5 mb-5" aria-label="AlphaHedgeQuant home">
            <span className="ahq-logo-mark text-amber border border-amber/60">α</span>
            <span className="font-semibold tracking-tight">alphahedgequant</span>
          </Link>
          <a href="https://x.com/Shreyy214" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-muted hover:text-body mb-3" aria-label="Follow AlphaHedgeQuant founder Shreyash on X">
            
            <span>Founder: Shreyash</span>
            <span aria-hidden="true">· 𝕏</span>
            <span>@Shreyy214</span>
          </a>
          <p className="max-w-sm font-display text-xl sm:text-2xl font-semibold leading-snug tracking-tight text-body">
            Decoding market inefficiencies by quantifying{" "}
            <span className="text-amber">opportunities.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Independent quantitative research, market intelligence and options analytics.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 text-sm">
          <div className="flex flex-col gap-2.5">
            <span className="eyebrow !text-muted">Platform</span>
            <Link href="/screener" className="text-muted hover:text-body">Screener</Link>
            <Link href="/models" className="text-muted hover:text-body">Quant models</Link>
            <Link href="/backtest" className="text-muted hover:text-body">AI backtest</Link>
            <Link href="/research" className="text-muted hover:text-body">Research</Link>
            <Link href="/learn" className="text-muted hover:text-body">Learn</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="eyebrow !text-muted">Company</span>
            <a href="mailto:hello@alphahedgequant.com" className="text-muted hover:text-body">Contact</a>
            <a href="https://github.com/ZerohedgeQuantbyShrey" target="_blank" rel="noreferrer" className="text-muted hover:text-body">GitHub</a>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="eyebrow !text-muted">Legal</span>
            <Link href="/disclaimer" className="text-muted hover:text-body">Disclaimer</Link>
            <Link href="/privacy" className="text-muted hover:text-body">Privacy</Link>
            <Link href="/terms" className="text-muted hover:text-body">Terms</Link>
          </div>
        </div>

        <div className="text-sm text-muted md:text-right flex flex-col md:items-end justify-between gap-4">
          <p className="font-mono text-xs">NSE · NYSE · NASDAQ</p>
          <p>
            © {new Date().getFullYear()} AlphaHedgeQuant. Market data for
            research and education only — not investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

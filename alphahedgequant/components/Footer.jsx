import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="max-w-shell mx-auto px-5 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="font-mono text-amber border border-amber/50 rounded px-1.5 py-0.5 text-xs tracking-widest">
              AHQ
            </span>
            <span className="font-display font-medium">AlphaHedgeQuant</span>
          </div>
          <p className="text-sm text-muted leading-relaxed max-w-xs">
            Quantitative research, live market intelligence and AI-assisted
            backtesting for NSE &amp; US markets.
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

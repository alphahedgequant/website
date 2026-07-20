"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/screener", label: "Screener" },
  { href: "/models", label: "Quant Models" },
  { href: "/backtest", label: "AI Backtest" },
  { href: "/options", label: "Options" },
  { href: "/copilot", label: "Copilot" },
  { href: "/ipo", label: "IPO" },
  { href: "/research", label: "Research" },
  { href: "/reports", label: "Reports" },
  { href: "/tracker", label: "Trust Tracker" },
  { href: "/learn", label: "Learn" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur">
      <div className="max-w-shell mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-mono text-amber border border-amber/50 rounded px-1.5 py-0.5 text-xs tracking-widest">
            AHQ
          </span>
          <span className="font-display font-medium tracking-tight">
            AlphaHedgeQuant
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                path === l.href ? "text-amber" : "text-muted hover:text-body"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/#waitlist" className="btn-primary !py-2 !px-4">
            Join waitlist
          </Link>
        </nav>

        <button
          className="md:hidden text-muted"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-line px-5 py-4 flex flex-col gap-4 bg-ink">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`text-sm ${path === l.href ? "text-amber" : "text-muted"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/#waitlist" onClick={() => setOpen(false)} className="btn-primary w-fit">
            Join waitlist
          </Link>
        </nav>
      )}
    </header>
  );
}

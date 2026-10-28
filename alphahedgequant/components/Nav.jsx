"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";

const products = [
  { href: "/screener", label: "Market Intelligence", description: "NSE & US equity screeners", glyph: "▤" },
  { href: "/models", label: "Quant Models", description: "Systematic strategies & signals", glyph: "∑" },
  { href: "/backtest", label: "AI Backtesting", description: "Test and evaluate ideas", glyph: "↗" },
  { href: "/copilot", label: "AI Copilot", description: "Natural-language strategy research", glyph: "✳" },
  { href: "/options", label: "Options Analytics", description: "Option-chain intelligence", glyph: "◈" },
];
const research = [
  { href: "/research", label: "Research Papers" },
  { href: "/reports", label: "Macro Outlooks" },
  { href: "/ipo", label: "IPO Intelligence" },
  { href: "/tracker", label: "Trust Tracker" },
];
const isActive = (path, links) => links.some(l => path === l.href);

export default function Nav() {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenu(null);
  }, [path]);

  useEffect(() => {
    function dismiss(event) {
      if (event.key === "Escape") setMenu(null);
    }
    function outside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) setMenu(null);
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);

  return (
    <header className="ahq-site-nav sticky top-0 z-50 border-b border-line backdrop-blur">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10 h-[76px] flex items-center justify-between gap-3">
        <Link href="/" className="ahq-logo flex shrink-0 items-center gap-2.5" aria-label="AlphaHedgeQuant home">
          <span className="ahq-logo-mark text-amber border border-amber/60">α</span>
          <span className="font-semibold tracking-tight">alphahedgequant</span>
        </Link>

        <div ref={panelRef} className="hidden md:flex items-center gap-5 h-full">
          <nav aria-label="Main navigation" className="flex h-full items-center gap-5">
            {[
              { key: "products", label: "Products", links: products },
              { key: "research", label: "Research", links: research },
            ].map(group => (
              <div key={group.key} className="relative flex h-full items-center">
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={menu === group.key}
                  onClick={() => setMenu(menu === group.key ? null : group.key)}
                  className={`inline-flex items-center gap-1.5 text-sm transition-colors hover:text-body ${isActive(path, group.links) ? "text-amber" : "text-muted"}`}
                >
                  {group.label}
                  <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {menu === group.key && (
                  <div className={`ahq-nav-panel absolute top-full right-0 mt-2 border border-line bg-surface p-4 shadow-2xl ${group.key === "products" ? "w-[520px]" : "w-60"}`}>
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-[.2em] text-amber">
                      {group.key === "products" ? "Explore our products" : "Explore research"}
                    </p>
                    <div className={group.key === "products" ? "grid grid-cols-2 gap-2" : "grid gap-1"}>
                      {group.links.map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenu(null)}
                          className="flex items-start gap-3 rounded-lg p-3 hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber">
                          {item.glyph && <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-raised font-mono text-amber">{item.glyph}</span>}
                          <span className="min-w-0"><span className="block text-sm font-medium text-body">{item.label}</span>
                            {item.description && <span className="mt-1 block text-xs leading-relaxed text-muted">{item.description}</span>}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link href="/learn" className={`text-sm hover:text-body ${path === "/learn" ? "text-amber" : "text-muted"}`}>Learn</Link>
            <Link href="/about" className={`text-sm hover:text-body ${path === "/about" ? "text-amber" : "text-muted"}`}>About</Link>
          </nav>
          <ThemeToggle />
          <SignedOut>
            <Link href="/sign-in" className="text-sm text-muted hover:text-body">Sign in</Link>
            <Link href="/sign-up" className="btn-primary !py-2 !px-4">Sign up</Link>
          </SignedOut>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button type="button" className="p-2 text-muted" onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} aria-controls="ahq-mobile-navigation">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="ahq-mobile-navigation" aria-label="Mobile navigation" className="md:hidden max-h-[calc(100vh-4.75rem)] overflow-y-auto border-t border-line bg-surface px-5 py-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-amber">Products</p>
          <div className="grid grid-cols-1 gap-1">
            {products.map(item => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-body hover:bg-raised">{item.label}</Link>)}
          </div>
          <div className="my-4 border-t border-line" />
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-amber">Research</p>
          <div className="grid grid-cols-1 gap-1">
            {research.map(item => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-body hover:bg-raised">{item.label}</Link>)}
          </div>
          <div className="my-4 border-t border-line" />
          <Link href="/learn" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-body">Learn</Link>
          <Link href="/about" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm text-body">About</Link>
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <SignedOut>
              <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="text-sm text-muted">Sign in</Link>
              <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="btn-primary">Sign up</Link>
            </SignedOut>
            <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
          </div>
        </nav>
      )}
    </header>
  );
}

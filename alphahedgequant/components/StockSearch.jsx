"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/config";

// Search actual returned provider universes; never fabricate a search match.
export default function StockSearch() {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("NSE");
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("idle");
  useEffect(() => {
    let active = true;
    setRows([]);
    setState("loading");
    api(market === "US" ? "/api/us-screener" : "/api/screener")
      .then(r => {
        if (!active) return;
        setRows(Array.isArray(r?.data) ? r.data : []);
        setState("ready");
      })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [market]);
  const term = query.trim().toLowerCase();
  const matches = term.length >= 1 ? rows.filter(x => String(x.symbol || "").toLowerCase().includes(term) || String(x.name || "").toLowerCase().includes(term)).slice(0, 8) : [];
  return (
    <div className="card rounded-xl p-4 md:p-5 max-w-2xl" role="search" aria-label="Find a company">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-amber">Explore a company</span>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-raised p-1" aria-label="Select market">
          {["NSE", "US"].map(m => <button type="button" key={m} aria-pressed={market === m}
            onClick={() => { setMarket(m); setQuery(""); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${market === m ? "bg-surface text-body" : "text-muted hover:text-body"}`}>{m === "NSE" ? "India · NSE" : "United States"}</button>)}
        </div>
      </div>
      <label htmlFor="ahq-company-search" className="sr-only">Search company name or ticker symbol</label>
      <input id="ahq-company-search" type="search" value={query} onChange={e => setQuery(e.target.value)}
        placeholder={market === "NSE" ? "Search RELIANCE, TCS, HDFCBANK…" : "Search AAPL, MSFT, NVDA…"}
        className="w-full rounded-lg border border-line bg-raised px-4 py-3 text-body placeholder:text-muted focus-visible:outline-2 focus-visible:outline-amber"/>
      {state === "loading" && <p className="mt-3 text-sm text-muted">Loading available symbols…</p>}
      {state === "error" && <p role="status" className="mt-3 text-sm text-loss">Market-data service is unavailable. Please try again later.</p>}
      {state === "ready" && term && matches.length === 0 && <p className="mt-3 text-sm text-muted">No matching company in the currently available {market} universe. Coverage is not guaranteed to include every listing.</p>}
      {matches.length > 0 && <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-line">
        {matches.map(x => <Link key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}?market=${market}`}
          className="flex items-center justify-between gap-3 rounded-lg p-3 hover:bg-raised">
          <span className="min-w-0"><span className="block text-sm font-medium text-body">{x.symbol}</span><span className="block text-xs text-muted truncate">{x.name || "Company name unavailable"}</span></span>
          <span className="text-xs text-amber shrink-0">Explore →</span>
        </Link>)}
      </div>}
      <p className="mt-3 text-xs leading-relaxed text-muted">Search results reflect the connected feed's current coverage, not the full exchange registry. Prices may be delayed or unavailable.</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/config";

const fmt = (v, d = 2) => (v == null ? "--" : Number(v).toFixed(d));

export default function Markets() {
  const [indices, setIndices] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | live | waking | error
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ col: "changePct", dir: -1 });

  useEffect(() => {
    let alive = true;
    const wakeTimer = setTimeout(() => {
      if (alive) setStatus((s) => (s === "loading" ? "waking" : s));
    }, 4000);

    async function load() {
      try {
        const [idx, scr] = await Promise.all([
          api("/api/indices"),
          api("/api/screener"),
        ]);
        if (!alive) return;
        setIndices(idx?.data || null);
        setRows(Array.isArray(scr?.data) ? scr.data : []);
        setStatus("live");
      } catch {
        if (alive) setStatus("error");
      }
    }
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearTimeout(wakeTimer);
      clearInterval(t);
    };
  }, []);

  const filtered = rows
    .filter(
      (r) =>
        !q ||
        r.symbol?.toLowerCase().includes(q.toLowerCase()) ||
        r.name?.toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) =>
      sort.col === "symbol"
        ? sort.dir * String(b.symbol ?? "").localeCompare(String(a.symbol ?? ""))
        : sort.dir * ((b[sort.col] ?? 0) - (a[sort.col] ?? 0))
    );

  const th = (label, col) => (
    <th
      className="text-left font-mono text-[11px] tracking-wider text-muted uppercase px-3 py-2.5 cursor-pointer hover:text-amber select-none"
      onClick={() =>
        setSort((s) => ({ col, dir: s.col === col ? -s.dir : -1 }))
      }
    >
      {label}
      {sort.col === col && (sort.dir === -1 ? " ↓" : " ↑")}
    </th>
  );

  return (
    <div className="max-w-shell mx-auto px-5 py-12">
      <p className="eyebrow mb-3">[ AHQ : MKT — NSE LIVE ]</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">Markets</h1>
      <p className="text-muted text-sm mt-2 max-w-xl">
        Live NSE indices and screener powered by the AlphaHedgeQuant data
        engine. Auto-refreshes every 30 seconds during market hours.
      </p>

      {status === "waking" && (
        <div className="card mt-8 p-5 text-sm text-muted border-amber/30">
          Waking the data engine — free-tier servers sleep when idle. First
          load can take up to a minute, then it&apos;s instant.
        </div>
      )}
      {status === "error" && (
        <div className="card mt-8 p-5 text-sm text-loss/90">
          Data engine unreachable. The market-data token may need a refresh, or
          the backend is redeploying. Try again in a minute.
        </div>
      )}

      {/* INDICES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {(indices ? Object.entries(indices) : []).map(([name, v]) => (
          <div key={name} className="card p-4">
            <p className="font-mono text-[11px] tracking-wider text-muted uppercase">{name}</p>
            <p className="font-display text-xl mt-1">{fmt(v?.value ?? v?.price)}</p>
            <p className={`text-sm font-mono mt-0.5 ${(v?.changePct ?? v?.pct ?? 0) >= 0 ? "tick-up" : "tick-down"}`}>
              {fmt(v?.changePct ?? v?.pct)}%
            </p>
          </div>
        ))}
        {!indices && status !== "error" && (
          <div className="card p-4 col-span-2 md:col-span-4 text-sm text-muted">
            Loading indices…
          </div>
        )}
      </div>

      {/* SCREENER */}
      <div className="mt-10 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-display text-xl font-medium">Screener</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search symbol or name…"
          className="bg-surface border border-line rounded-lg px-4 py-2 text-sm w-64 outline-none focus:border-amber/60"
        />
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="border-b border-line">
            <tr>
              {th("Symbol", "symbol")}
              {th("Price ₹", "price")}
              {th("Change %", "changePct")}
              {th("Volume", "volume")}
              <th className="text-left font-mono text-[11px] tracking-wider text-muted uppercase px-3 py-2.5">
                Sector
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((r) => (
              <tr key={r.symbol} className="border-b border-line/60 hover:bg-raised/60">
                <td className="px-3 py-2.5 font-mono text-amber">{r.symbol}</td>
                <td className="px-3 py-2.5 font-mono">{fmt(r.price)}</td>
                <td className={`px-3 py-2.5 font-mono ${(r.changePct ?? 0) >= 0 ? "tick-up" : "tick-down"}`}>
                  {fmt(r.changePct)}%
                </td>
                <td className="px-3 py-2.5 font-mono text-muted">
                  {r.volume ? Number(r.volume).toLocaleString("en-IN") : "--"}
                </td>
                <td className="px-3 py-2.5 text-muted">{r.sector || "--"}</td>
              </tr>
            ))}
            {filtered.length === 0 && status === "live" && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  No stocks match that search.
                </td>
              </tr>
            )}
            {status !== "live" && status !== "error" && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  Loading screener…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[11px] text-muted mt-4">
        DATA: UPSTOX + YAHOO FINANCE · RESEARCH &amp; EDUCATION ONLY · NOT INVESTMENT ADVICE
      </p>
    </div>
  );
}

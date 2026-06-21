"use client";
import { useState, useEffect, useCallback } from "react";

// Tracker API routes live in THIS Next.js app (same domain), so use relative paths.
const RATING_COLORS = { BUY: "text-gain", SELL: "text-loss", HOLD: "text-amber" };

function scoreColor(s) {
  if (s == null) return "text-muted";
  if (s >= 70) return "text-gain";
  if (s >= 50) return "text-amber";
  return "text-loss";
}
function scoreBand(s) {
  if (s == null) return "Unrated";
  if (s >= 80) return "Excellent";
  if (s >= 70) return "Good";
  if (s >= 50) return "Fair";
  if (s >= 30) return "Poor";
  return "Very Poor";
}

export default function TrackerPage() {
  const [tab, setTab] = useState("leaderboard");
  const [leaderboard, setLeaderboard] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ house: "", symbol: "", rating: "BUY", target_price: "", price_at_call: "", call_date: "", horizon_days: 365, note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lb, cl] = await Promise.all([
        fetch(`/api/tracker/leaderboard`).then((r) => r.json()),
        fetch(`/api/tracker/calls`).then((r) => r.json()),
      ]);
      if (lb.success) setLeaderboard(lb.leaderboard);
      if (cl.success) setCalls(cl.calls);
    } catch (e) {
      setMsg({ type: "error", text: "Could not load tracker data. The price service may be waking up (cold start ~50s) — try again shortly." });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setSubmitting(true); setMsg(null);
    try {
      const r = await fetch(`/api/tracker/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        setMsg({ type: "ok", text: `Added: ${form.house} · ${form.symbol} ${form.rating} @ target ${form.target_price}` });
        setForm({ house: form.house, symbol: "", rating: "BUY", target_price: "", price_at_call: "", call_date: "", horizon_days: 365, note: "" });
        load();
        setTab("calls");
      } else {
        setMsg({ type: "error", text: j.error || "Failed to add call." });
      }
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSubmitting(false);
  };

  const del = async (id) => {
    await fetch(`/api/tracker/calls/${id}`, { method: "DELETE" });
    load();
  };

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const formValid = form.house && form.symbol && form.target_price && form.price_at_call && form.call_date;

  return (
    <div className="max-w-shell mx-auto px-5 py-10">
      <p className="eyebrow mb-3">[ AHQ : ANALYST TRUST TRACKER ]</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Who Can You Trust?</h1>
          <p className="text-muted text-sm mt-1.5 max-w-2xl leading-relaxed">
            A credit-score-style track record for brokerages and research houses. Every stock call is logged with its
            target and the price at the time — then scored against what actually happened. The Trust Score is simply the
            % of a house&apos;s resolved calls that made money in the called direction.
          </p>
        </div>
        <div className="flex gap-1.5">
          {[["leaderboard", "LEADERBOARD"], ["calls", `CALLS${calls.length ? ` (${calls.length})` : ""}`], ["add", "+ ADD CALL"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${tab === k ? "border-amber text-amber" : "border-line text-muted hover:text-body"}`}>{label}</button>
          ))}
        </div>
      </div>

      {msg && (
        <div className={`mt-4 p-3 rounded-lg border font-mono text-xs ${msg.type === "ok" ? "border-gain/30 bg-gain/10 text-gain" : "border-loss/30 bg-loss/10 text-loss"}`}>{msg.text}</div>
      )}

      {loading && (
        <div className="mt-8 h-40 rounded-lg border border-line bg-surface flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && tab === "leaderboard" && (
        leaderboard.length === 0 ? (
          <EmptyState onAdd={() => setTab("add")} />
        ) : (
          <div className="mt-6 rounded-lg border border-line bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="font-mono text-[10px] text-muted tracking-wider border-b border-line">
                    <th className="py-2.5 px-4 text-left font-normal">#</th>
                    <th className="py-2.5 px-4 text-left font-normal">RESEARCH HOUSE</th>
                    <th className="py-2.5 px-4 text-center font-normal">TRUST SCORE</th>
                    <th className="py-2.5 px-4 text-center font-normal">RATING</th>
                    <th className="py-2.5 px-4 text-center font-normal">TARGET HIT</th>
                    <th className="py-2.5 px-4 text-center font-normal">AVG RETURN</th>
                    <th className="py-2.5 px-4 text-center font-normal">CALLS</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((h, i) => (
                    <tr key={h.house} className="border-b border-line/40 hover:bg-raised/20">
                      <td className="py-3 px-4 font-mono text-muted">{i + 1}</td>
                      <td className="py-3 px-4 font-medium text-body">{h.house}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono text-2xl font-bold ${scoreColor(h.trustScore)}`}>{h.trustScore ?? "–"}</span>
                        {h.trustScore != null && <span className="font-mono text-[10px] text-muted">/100</span>}
                      </td>
                      <td className={`py-3 px-4 text-center font-mono text-xs ${scoreColor(h.trustScore)}`}>{scoreBand(h.trustScore)}</td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-muted">{h.targetHitRate != null ? h.targetHitRate + "%" : "–"}</td>
                      <td className={`py-3 px-4 text-center font-mono text-xs ${(h.avgReturn ?? 0) >= 0 ? "text-gain" : "text-loss"}`}>{h.avgReturn != null ? (h.avgReturn > 0 ? "+" : "") + h.avgReturn + "%" : "–"}</td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-muted">{h.resolvedCalls}/{h.totalCalls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-2.5 font-mono text-[10px] text-muted border-t border-line">
              Trust Score = % of resolved calls that made money in the called direction. Resolved = we have a current price to compare. Prices via Yahoo Finance.
            </p>
          </div>
        )
      )}

      {!loading && tab === "calls" && (
        calls.length === 0 ? (
          <EmptyState onAdd={() => setTab("add")} />
        ) : (
          <div className="mt-6 rounded-lg border border-line bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="font-mono text-[10px] text-muted tracking-wider border-b border-line">
                    <th className="py-2.5 px-3 text-left font-normal">HOUSE</th>
                    <th className="py-2.5 px-3 text-left font-normal">STOCK</th>
                    <th className="py-2.5 px-3 text-center font-normal">CALL</th>
                    <th className="py-2.5 px-3 text-right font-normal">@ PRICE</th>
                    <th className="py-2.5 px-3 text-right font-normal">TARGET</th>
                    <th className="py-2.5 px-3 text-right font-normal">NOW</th>
                    <th className="py-2.5 px-3 text-right font-normal">RETURN</th>
                    <th className="py-2.5 px-3 text-center font-normal">DATE</th>
                    <th className="py-2.5 px-3 text-center font-normal">OUTCOME</th>
                    <th className="py-2.5 px-3 text-center font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((c) => (
                    <tr key={c.id} className="border-b border-line/40 hover:bg-raised/20 font-mono text-xs">
                      <td className="py-2.5 px-3 text-body">{c.house}</td>
                      <td className="py-2.5 px-3 text-body font-semibold">{c.symbol}</td>
                      <td className={`py-2.5 px-3 text-center font-bold ${RATING_COLORS[c.rating] || "text-muted"}`}>{c.rating}</td>
                      <td className="py-2.5 px-3 text-right text-muted">{Number(c.price_at_call).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-body">{Number(c.target_price).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-body">{c.priceNow != null ? Number(c.priceNow).toFixed(2) : "–"}</td>
                      <td className={`py-2.5 px-3 text-right ${(c.returnPct ?? 0) >= 0 ? "text-gain" : "text-loss"}`}>{c.returnPct != null ? (c.returnPct > 0 ? "+" : "") + c.returnPct + "%" : "–"}</td>
                      <td className="py-2.5 px-3 text-center text-muted">{c.call_date ? String(c.call_date).slice(0, 10) : "–"}</td>
                      <td className="py-2.5 px-3 text-center">
                        {!c.resolved ? <span className="text-muted">pending</span>
                          : c.madeMoney ? <span className="text-gain">✓ {c.targetHit ? "hit target" : "profit"}</span>
                          : <span className="text-loss">✗ failed</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button onClick={() => del(c.id)} className="text-muted hover:text-loss">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {tab === "add" && (
        <div className="mt-6 max-w-2xl">
          <div className="rounded-lg border border-line bg-surface p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="RESEARCH HOUSE / ANALYST" placeholder="e.g. Citi, Morgan Stanley, Motilal Oswal" value={form.house} onChange={(v) => setF("house", v)} />
              <Field label="STOCK SYMBOL (NSE/US)" placeholder="e.g. RELIANCE" value={form.symbol} onChange={(v) => setF("symbol", v.toUpperCase())} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-mono text-xs text-muted tracking-wider mb-1.5">RATING</label>
                <div className="flex gap-1.5">
                  {["BUY", "HOLD", "SELL"].map((r) => (
                    <button key={r} onClick={() => setF("rating", r)} className={`font-mono text-xs px-3 py-2 rounded border flex-1 ${form.rating === r ? (r === "BUY" ? "border-gain text-gain" : r === "SELL" ? "border-loss text-loss" : "border-amber text-amber") : "border-line text-muted hover:text-body"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <Field label="TARGET PRICE" type="number" placeholder="1500" value={form.target_price} onChange={(v) => setF("target_price", v)} />
              <Field label="PRICE AT CALL" type="number" placeholder="1400" value={form.price_at_call} onChange={(v) => setF("price_at_call", v)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="CALL DATE" type="date" value={form.call_date} onChange={(v) => setF("call_date", v)} />
              <Field label="HORIZON (DAYS)" type="number" placeholder="365" value={form.horizon_days} onChange={(v) => setF("horizon_days", v)} />
            </div>
            <Field label="NOTE (OPTIONAL)" placeholder="Source / thesis / link" value={form.note} onChange={(v) => setF("note", v)} />
            <button onClick={submit} disabled={!formValid || submitting} className="w-full py-3 rounded bg-amber text-ink font-display font-semibold text-sm hover:bg-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "Adding…" : "Add Call to Tracker"}
            </button>
            <p className="font-mono text-[10px] text-muted leading-relaxed">
              The outcome is scored automatically from the live price — you only enter what the house actually said
              (house, stock, rating, target, the price when they said it, and the date). Use NSE symbols (RELIANCE) or US tickers (AAPL).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block font-mono text-xs text-muted tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-raised/40 border border-line rounded px-3 py-2 font-mono text-sm text-body focus:outline-none focus:border-amber/40"
      />
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="mt-8 h-56 rounded-lg border border-line bg-surface flex flex-col items-center justify-center text-muted px-6 text-center">
      <div className="text-4xl mb-3 opacity-30">📊</div>
      <p className="font-display text-lg opacity-50">No calls tracked yet</p>
      <p className="text-xs mt-1.5 opacity-40 font-mono max-w-sm leading-relaxed">Add your first analyst call — house, stock, rating, target, and the price when the call was made. The tracker scores the rest automatically.</p>
      <button onClick={onAdd} className="mt-4 font-mono text-xs px-4 py-2 rounded border border-amber/40 text-amber hover:bg-amber/10">+ Add the first call</button>
    </div>
  );
}

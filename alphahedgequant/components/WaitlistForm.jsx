"use client";
// components/WaitlistForm.jsx
// Usage: <WaitlistForm source="landing" />

import { useState } from "react";

export default function WaitlistForm({ source = "landing", compact = false }) {
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  const submit = async () => {
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const json = await r.json();
      if (json.success) {
        setStatus("success");
        setMessage(json.message || "You're on the list.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(json.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Connection failed. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className={`flex items-center gap-3 ${compact ? "text-sm" : ""}`}>
        <span className="text-gain font-mono">✓</span>
        <p className="text-gain font-mono text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className={compact ? "flex gap-2" : "flex flex-col sm:flex-row gap-3 max-w-md"}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="your@email.com"
        disabled={status === "loading"}
        className={`flex-1 bg-white/[0.04] border border-line rounded px-4 font-mono text-sm text-body placeholder:text-muted focus:outline-none focus:border-amber/40 disabled:opacity-50 ${compact ? "py-1.5 text-xs" : "py-3"}`}
      />
      <button
        onClick={submit}
        disabled={status === "loading" || !email.trim()}
        className={`rounded bg-amber text-ink font-display font-semibold hover:bg-amber/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${compact ? "px-4 py-1.5 text-xs" : "px-6 py-3 text-sm"}`}
      >
        {status === "loading" ? "..." : "Join Waitlist"}
      </button>
      {status === "error" && (
        <p className="text-loss font-mono text-xs mt-1 sm:col-span-2">{message}</p>
      )}
    </div>
  );
}

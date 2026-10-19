// AlphaHedgeQuant launch audit: read-only HTTP checks, no logins or mutations.
// Run: node tools/launch-audit.mjs
const targets = [
  { name: "Homepage", url: process.env.AHQ_SITE_URL || "https://www.alphahedgequant.com", required: true },
  { name: "Backend reachability", url: process.env.AHQ_API_URL || "https://zerohedgequant-backend.onrender.com", required: false },
];
const timeoutMs = Number(process.env.AHQ_TIMEOUT_MS || 12000);
const findings = [];
for (const t of targets) {
  const started = Date.now();
  try {
    const response = await fetch(t.url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "AlphaHedgeQuant-LaunchAudit/0.1" },
    });
    // A backend root may legitimately be 404. Only check reachability until a health path is verified.
    const okay = t.required ? response.ok : response.status < 500;
    findings.push({ name: t.name, url: t.url, status: response.status,
      latencyMs: Date.now() - started, result: okay ? "pass" : "fail",
      note: t.required ? "Page HTTP status" : "Reachability only; not an API health certification" });
  } catch (error) {
    findings.push({ name: t.name, url: t.url, result: "fail", latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error) });
  }
}
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2));
if (findings.some(f => f.result === "fail" && targets.find(t => t.name === f.name)?.required)) process.exitCode = 1;

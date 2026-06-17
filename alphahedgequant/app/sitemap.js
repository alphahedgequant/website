// app/sitemap.js  → Next.js auto-serves this at /sitemap.xml
export default function sitemap() {
  const base = "https://alphahedgequant.com";
  const now = new Date();

  const routes = [
    "",                 // home
    "/screener",
    "/models",
    "/backtest",
    "/research",
    "/learn",
    "/learn/cointegration-pairs-trading",
    "/learn/position-sizing",
    "/learn/options-greeks",
    "/disclaimer",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/screener" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/learn/") ? 0.6 : 0.8,
  }));
}

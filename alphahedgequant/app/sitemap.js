// Only public, crawlable pages belong in the sitemap. Product routes
// currently require Clerk login, so listing them would point crawlers at
// an authentication redirect instead of indexable content.
export default function sitemap() {
  const base = "https://www.alphahedgequant.com";
  const routes = ["", "/about", "/privacy", "/terms", "/disclaimer"];
  return routes.map(route => ({
    url: base + route,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/about" ? 0.7 : 0.3,
  }));
}

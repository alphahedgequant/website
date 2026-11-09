import {RESEARCH_LIBRARY,LIBRARY_PUBLISHED} from "../lib/publicResearchLibrary.mjs";
// Only public, crawlable pages belong in the sitemap. Product routes
// currently require Clerk login, so listing them would point crawlers at
// an authentication redirect instead of indexable content.
export default function sitemap() {
  const base = "https://www.alphahedgequant.com";
  const routes = ["", "/about", "/ipo", "/library", "/privacy", "/terms", "/disclaimer"];
  const index=routes.map(route => ({
    url: base + route,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/library" ? 0.8 : route === "/about" || route === "/ipo" ? 0.7 : 0.3,
  }));
  const notes=RESEARCH_LIBRARY.map(note=>({
    url: base + "/library/" + note.slug,
    lastModified: new Date(LIBRARY_PUBLISHED + "T00:00:00Z"),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...index,...notes];
}

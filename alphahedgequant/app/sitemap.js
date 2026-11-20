import {RESEARCH_LIBRARY,LIBRARY_PUBLISHED} from "../lib/publicResearchLibrary.mjs";
import {PUBLIC_RESEARCH_SERIES,RESEARCH_PREVIEWS,PREVIEW_RELEASE_DATE} from "../lib/publicResearchPreviews.mjs";
import {COMPETITIONS,VERIFIED_AS_OF} from "../lib/competitionEvents.mjs";
import {VERIFIED_IPO_REFERENCES,IPO_REFERENCE_AS_OF} from "../lib/ipoVerifiedEvents.mjs";
// Only public, crawlable pages belong in the sitemap. Authenticated
// workspaces are intentionally excluded; public product and research pages
// are listed so search engines can discover their open-access content.
export default function sitemap() {
  const base = "https://www.alphahedgequant.com";
  const routes = ["", "/about", "/ipo", "/tracker", "/dark-pool", "/library", "/learn", "/competitions", "/privacy", "/terms", "/disclaimer"];
  const index=routes.map(route => ({
    url: base + route,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/library" || route === "/learn" ? 0.8 : route === "/about" || route === "/ipo" || route === "/tracker" || route === "/dark-pool" ? 0.7 : 0.3,
  }));
  const notes=RESEARCH_LIBRARY.map(note=>({
    url: base + "/library/" + note.slug,
    lastModified: new Date(LIBRARY_PUBLISHED + "T00:00:00Z"),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  // Only preview URLs are public. The complete /research, /models and
  // /reports workspaces remain behind Clerk and must never be in this XML.
  const series=PUBLIC_RESEARCH_SERIES.map(item=>({
    url:base+"/library/series/"+item.id,
    lastModified:new Date(PREVIEW_RELEASE_DATE+"T00:00:00Z"),
    changeFrequency:"monthly",
    priority:0.65,
  }));
  const previews=RESEARCH_PREVIEWS.map(item=>({
    url:base+"/library/series/"+item.series+"/"+item.slug,
    lastModified:new Date(PREVIEW_RELEASE_DATE+"T00:00:00Z"),
    changeFrequency:"monthly",
    priority:0.55,
  }));
  const publishedMacro=[{
    url:base+"/library/series/macro-outlook/october-2026",
    lastModified:new Date("2026-11-13T17:30:00Z"),
    changeFrequency:"monthly",priority:0.82
  }];
  const competitionPages=COMPETITIONS.map(item=>({
    url:base+"/competitions/"+item.slug,
    lastModified:new Date(VERIFIED_AS_OF+"T00:00:00Z"),
    changeFrequency:"weekly",priority:0.55
  }));
  const verifiedIpos=Object.keys(VERIFIED_IPO_REFERENCES).map(slug=>({
    url:base+"/ipo/"+slug,
    lastModified:new Date(IPO_REFERENCE_AS_OF+"T00:00:00Z"),
    changeFrequency:"daily",priority:0.62
  }));
  return [...index,...notes,...series,...previews,...publishedMacro,...competitionPages,...verifiedIpos];
}

// app/robots.js  → Next.js auto-serves this at /robots.txt
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://alphahedgequant.com/sitemap.xml",
  };
}

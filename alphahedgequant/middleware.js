import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — everything else requires sign-in.
// Homepage, the auth pages, legal pages, the waitlist API, and the cron endpoint stay open.
const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  // Public, read-only IPO calendar and listing intelligence for visitors and search engines.
  "/ipo",
  // Open educational library only. Do not expose authenticated research tools or APIs.
  "/library(.*)",
  // All six Quant Learning modules are free; interview and mental maths routes remain protected.
  "/learn",
  // Public read-only Trust Tracker; every mutation still requires verified editor auth inside the API.
  "/tracker",
  "/api/tracker/leaderboard",
  "/api/tracker/calls(.*)",
  "/api/tracker/editor",
  "/api/ipo",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/terms",
  "/disclaimer",
  // Search engines must access crawl directives and site map without Clerk login.
  "/robots.txt",
  "/sitemap.xml",
  "/api/waitlist(.*)",
  // Only the bounded event collector is public; dashboard/admin endpoints stay private.
  "/api/insights/event",
  "/api/cron(.*)",
  // GitHub Actions uses short-lived OIDC, not Clerk sessions; endpoint validates signed identity itself.
  "/api/terminal/ingest",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static files...
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // ...and always run on API routes.
    "/(api|trpc)(.*)",
  ],
};

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — everything else requires sign-in.
// Homepage, the auth pages, legal pages, the waitlist API, and the cron endpoint stay open.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/api/waitlist(.*)",
  "/api/cron(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
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

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// First line of defence only: every page and action re-checks permissions server-side.
const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/messages(.*)",
  "/profile(.*)",
  "/requests/new",
  "/requests/(.*)/edit",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

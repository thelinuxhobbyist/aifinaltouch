import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { clerkEnabled } from "@/lib/clerk-config";

// First line of defence only: every page and action re-checks permissions server-side.
const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/messages(.*)",
  "/profile(.*)",
  "/requests/new",
  "/requests/(.*)/edit",
  "/admin(.*)",
]);

const clerk = clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  return clerkEnabled ? clerk(req, event) : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

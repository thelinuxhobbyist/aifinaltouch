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

const clerk = clerkMiddleware(
  async (auth, req) => {
    if (!isProtected(req)) return;
    // Clerk's protect()/redirectToSignIn() answer client-side navigations with a 404 instead of a redirect.
    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(signIn);
    }
  },
  { signInUrl: "/sign-in", signUpUrl: "/sign-up" },
);

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  return clerkEnabled ? clerk(req, event) : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthUnavailable } from "@/components/auth-unavailable";
import { PostRequestAuthIntro, hiddenClerkHeader, isPostRequestRedirect } from "@/components/auth-intro";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in/[[...sign-in]]">) {
  if (!clerkEnabled) return <AuthUnavailable />;
  const redirectUrl = (await searchParams).redirect_url;
  const postingRequest = isPostRequestRedirect(typeof redirectUrl === "string" ? redirectUrl : undefined);

  return (
    <div className="container page auth-page">
      {postingRequest && <PostRequestAuthIntro mode="sign-in" />}
      {/* Remount so Clerk picks up a new redirect_url after a client-side navigation. */}
      <SignIn key={postingRequest ? "post-request" : "default"} appearance={postingRequest ? hiddenClerkHeader : undefined} />
    </div>
  );
}

import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthUnavailable } from "@/components/auth-unavailable";
import { PostRequestAuthIntro, hiddenClerkHeader, isPostRequestRedirect } from "@/components/auth-intro";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up/[[...sign-up]]">) {
  if (!clerkEnabled) return <AuthUnavailable />;
  const redirectUrl = (await searchParams).redirect_url;
  const postingRequest = isPostRequestRedirect(typeof redirectUrl === "string" ? redirectUrl : undefined);

  return (
    <div className="container page auth-page">
      {postingRequest && <PostRequestAuthIntro mode="sign-up" />}
      {/* Remount so Clerk picks up a new redirect_url after a client-side navigation. */}
      <SignUp key={postingRequest ? "post-request" : "default"} appearance={postingRequest ? hiddenClerkHeader : undefined} />
    </div>
  );
}

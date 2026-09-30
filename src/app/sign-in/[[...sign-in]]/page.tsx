import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthUnavailable } from "@/components/auth-unavailable";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  if (!clerkEnabled) return <AuthUnavailable />;
  return (
    <div className="container page auth-page">
      <SignIn />
    </div>
  );
}

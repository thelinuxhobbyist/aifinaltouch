import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthUnavailable } from "@/components/auth-unavailable";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };

export default function SignUpPage() {
  if (!clerkEnabled) return <AuthUnavailable />;
  return (
    <div className="container page auth-page">
      <SignUp />
    </div>
  );
}

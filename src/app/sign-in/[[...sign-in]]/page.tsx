import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  return (
    <div className="container-page flex justify-center py-16">
      <SignIn />
    </div>
  );
}

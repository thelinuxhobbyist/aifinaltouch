import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { clerkEnabled } from "@/lib/clerk-config";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://aifinaltouch.com"),
  title: {
    default: "AI Final Touch — AI built most of it. A person can finish it.",
    template: "%s · AI Final Touch",
  },
  description:
    "Made a website or app with AI and stuck on the last part? Tell us what's not quite right and we'll introduce you to someone who can fix it.",
  openGraph: { siteName: "AI Final Touch", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const page = (
    <html lang="en" className={jakarta.variable}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
  if (!clerkEnabled) return page;
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{ variables: { colorPrimary: "#0a7d62", borderRadius: "12px" } }}
    >
      {page}
    </ClerkProvider>
  );
}

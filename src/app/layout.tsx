import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { clerkEnabled } from "@/lib/clerk-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://aifinaltouch.com"),
  title: {
    default: "AI Final Touch — Made with AI. Finished by humans.",
    template: "%s · AI Final Touch",
  },
  description:
    "AI got you 90% there. Find the human for the other 10%. Connect with designers and developers who finish AI-built websites and apps.",
  openGraph: { siteName: "AI Final Touch", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const page = (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
  if (!clerkEnabled) return page;
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{ variables: { colorPrimary: "#1d4ed8", borderRadius: "0.375rem" } }}
    >
      {page}
    </ClerkProvider>
  );
}

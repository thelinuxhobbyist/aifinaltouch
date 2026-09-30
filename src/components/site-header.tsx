import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/auth";
import { unreadMessageCount } from "@/lib/queries";
import { Logo } from "@/components/logo";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await unreadMessageCount(user.id) : 0;

  const nav = [
    { href: "/requests", label: "Browse Requests" },
    { href: "/specialists", label: "Find a Specialist" },
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(user?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="AI Final Touch home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex" aria-label="Main">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/messages" className="relative text-sm text-ink-soft hover:text-ink">
                Messages
                {unread > 0 && (
                  <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] leading-5 font-semibold text-white">
                    {unread > 99 ? "99+" : unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </Link>
              <Link href="/requests/new" className="btn-primary hidden sm:inline-flex">
                Post a Request
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/requests/new" className="btn-primary">
                Post a Request
              </Link>
            </>
          )}

          <details className="relative md:hidden">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-line [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Menu</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </summary>
            <nav className="absolute right-0 mt-2 w-60 rounded-md border border-line bg-white p-2 shadow-lg" aria-label="Mobile">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded px-3 py-2.5 text-sm hover:bg-mist">
                  {item.label}
                </Link>
              ))}
              {user ? (
                <Link href="/requests/new" className="block rounded px-3 py-2.5 text-sm font-semibold text-brand hover:bg-mist">
                  Post a Request
                </Link>
              ) : (
                <Link href="/sign-in" className="block rounded px-3 py-2.5 text-sm hover:bg-mist">
                  Sign in
                </Link>
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

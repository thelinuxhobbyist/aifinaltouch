import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/auth";
import { unreadMessageCount } from "@/lib/queries";
import { Logo } from "@/components/logo";
import { NavLinks, type NavItem } from "@/components/nav-links";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await unreadMessageCount(user.id) : 0;

  const nav: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/requests", label: "Browse Requests" },
    { href: "/specialists", label: "Find a Specialist" },
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(user?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" aria-label="AI Final Touch home">
          <Logo />
        </Link>

        <nav className="nav" aria-label="Main">
          <NavLinks items={nav} className="nav__link" />
        </nav>

        <div className="site-header__actions">
          {user ? (
            <>
              <Link href="/messages" className="header-link">
                Messages
                {unread > 0 && (
                  <span className="count">
                    {unread > 99 ? "99+" : unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </Link>
              <Link href="/requests/new" className="btn btn--primary only-wide">
                Post a Request
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="btn btn--ghost only-wide">
                Sign in
              </Link>
              <Link href="/requests/new" className="btn btn--primary">
                Post a Request
              </Link>
            </>
          )}

          <details className="menu">
            <summary className="menu__button">
              <span className="sr-only">Menu</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </summary>
            <nav className="menu__panel" aria-label="Mobile">
              <NavLinks items={nav} className="menu__link" />
              {user ? (
                <Link href="/requests/new" className="menu__link menu__link--brand">
                  Post a Request
                </Link>
              ) : (
                <Link href="/sign-in" className="menu__link">
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

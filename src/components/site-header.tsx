import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { unreadMessageCount } from "@/lib/queries";
import { AccountMenu, MobileAccountActions } from "@/components/account-menu";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { NavLinks, type NavItem } from "@/components/nav-links";

const publicNav: NavItem[] = [
  { href: "/#how", label: "How it works" },
  { href: "/requests", label: "Browse requests" },
  { href: "/specialists", label: "Find a specialist" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await unreadMessageCount(user.id) : 0;

  const accountNav: NavItem[] = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/messages", label: "Messages", badge: unread > 0 ? unread : undefined },
        { href: "/profile", label: "My profile" },
        ...(user.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-header__logo" aria-label="AI Final Touch home">
          <Logo />
        </Link>

        <nav className="nav" aria-label="Main">
          <NavLinks items={publicNav} className="nav__link" />
        </nav>

        <div className="site-header__actions">
          {user ? (
            <Link href="/messages" className="header-link header-messages">
              Messages
              {unread > 0 && (
                <span className="count">
                  {unread > 99 ? "99+" : unread}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </Link>
          ) : (
            <Link href="/sign-in" className="header-link only-wide">
              Sign in
            </Link>
          )}
          <Link href="/requests/new" className="btn btn--primary">
            Post a request
          </Link>
          {user ? <AccountMenu isAdmin={user.isAdmin} unread={unread} /> : null}

          <MobileMenu>
            <summary className="menu__button">
              <span className="sr-only">Menu</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
              {unread > 0 ? (
                <span className="count menu__count">
                  {unread > 99 ? "99+" : unread}
                  <span className="sr-only"> unread messages</span>
                </span>
              ) : null}
            </summary>
            <nav className="menu__panel" aria-label="Menu">
              <div className="menu__group">
                <NavLinks items={publicNav} className="menu__link" />
              </div>
              {user ? (
                <div className="menu__group">
                  <NavLinks items={accountNav} className="menu__link" />
                  <MobileAccountActions />
                </div>
              ) : (
                <Link href="/sign-in" className="menu__link">
                  Sign in
                </Link>
              )}
              <Link href="/requests/new" className="menu__link menu__link--brand">
                Post a request
              </Link>
            </nav>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}

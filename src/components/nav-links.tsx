"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; exact?: boolean; badge?: number };

function isActive(pathname: string, { href, exact }: NavItem): boolean {
  return exact || href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ items, className }: { items: NavItem[]; className: string }) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={className}
          aria-current={isActive(pathname, item) ? "page" : undefined}
        >
          {item.label}
          {item.badge ? (
            <span className="count">
              {item.badge > 99 ? "99+" : item.badge}
              <span className="sr-only"> unread</span>
            </span>
          ) : null}
        </Link>
      ))}
    </>
  );
}

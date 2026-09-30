"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; exact?: boolean };

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
        </Link>
      ))}
    </>
  );
}

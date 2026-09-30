import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/profiles", label: "Profiles" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdminPage();
  return (
    <div className="container-page py-10">
      <nav className="flex gap-6 overflow-x-auto border-b border-line-soft pb-3 text-sm" aria-label="Admin">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 text-ink-soft hover:text-ink">
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="pt-8">{children}</div>
    </div>
  );
}

import type { Metadata } from "next";
import { NavLinks } from "@/components/nav-links";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/profiles", label: "Profiles" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdminPage();
  return (
    <div className="container page">
      <nav className="tabs" aria-label="Admin">
        <NavLinks items={NAV} className="tabs__link" />
      </nav>
      {children}
    </div>
  );
}

import { desc, like, or } from "drizzle-orm";
import { StatusBadge } from "@/components/ui";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { formatDate } from "@/lib/format";
import { param } from "@/lib/search-params";
import { moderateUser } from "../actions";
import { AdminButton, AdminSearch, AdminTable } from "../components";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const q = param((await searchParams).q);
  const me = await getCurrentUser();
  const rows = await getDb()
    .select()
    .from(users)
    .where(q ? or(like(users.email, `%${q}%`), like(users.displayName, `%${q}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(200);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Users</h1>
      <AdminSearch q={q} placeholder="Search name or email" />
      <AdminTable head={["Name", "Email", "Joined", "Status", ""]}>
        {rows.map((u) => (
          <tr key={u.id}>
            <td className="py-3 pr-4 font-medium">
              {u.displayName}
              {u.isAdmin && <span className="ml-2 text-xs text-brand">admin</span>}
            </td>
            <td className="py-3 pr-4 text-ink-soft">{u.email}</td>
            <td className="py-3 pr-4 text-muted">{formatDate(u.createdAt)}</td>
            <td className="py-3 pr-4">
              <StatusBadge status={u.status} />
            </td>
            <td className="py-3 text-right">
              {u.id !== me?.id &&
                (u.status === "active" ? (
                  <AdminButton action={moderateUser} id={u.id} op="suspend" danger>
                    Suspend
                  </AdminButton>
                ) : (
                  <AdminButton action={moderateUser} id={u.id} op="reinstate">
                    Reinstate
                  </AdminButton>
                ))}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

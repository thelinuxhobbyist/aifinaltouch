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
      <h1 className="h2 mb-6">Users</h1>
      <AdminSearch q={q} placeholder="Search name or email" />
      <AdminTable head={["Name", "Email", "Joined", "Status", ""]}>
        {rows.map((u) => (
          <tr key={u.id}>
            <td className="strong">
              {u.displayName} {u.isAdmin && <span className="tag">admin</span>}
            </td>
            <td className="soft">{u.email}</td>
            <td className="muted">{formatDate(u.createdAt)}</td>
            <td>
              <StatusBadge status={u.status} />
            </td>
            <td>
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

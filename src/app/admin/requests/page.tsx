import Link from "next/link";
import { desc, eq, like } from "drizzle-orm";
import { StatusBadge } from "@/components/ui";
import { requests, users } from "@/db/schema";
import { getDb } from "@/lib/cf";
import { formatDate } from "@/lib/format";
import { param } from "@/lib/search-params";
import { moderateRequest } from "../actions";
import { AdminButton, AdminSearch, AdminTable } from "../components";

export default async function AdminRequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  const q = param((await searchParams).q);
  const rows = await getDb()
    .select({ request: requests, ownerEmail: users.email })
    .from(requests)
    .innerJoin(users, eq(users.id, requests.userId))
    .where(q ? like(requests.title, `%${q}%`) : undefined)
    .orderBy(desc(requests.createdAt))
    .limit(200);

  return (
    <div>
      <h1 className="h2 mb-6">Requests</h1>
      <AdminSearch q={q} placeholder="Search titles" />
      <AdminTable head={["Title", "Owner", "Created", "Status", ""]}>
        {rows.map(({ request, ownerEmail }) => (
          <tr key={request.id}>
            <td>
              <Link href={`/requests/${request.slug}`} className="strong hover-brand">
                {request.title}
              </Link>
            </td>
            <td className="soft">{ownerEmail}</td>
            <td className="muted">{formatDate(request.createdAt)}</td>
            <td>
              <StatusBadge status={request.status} />
            </td>
            <td>
              {request.status === "removed" ? (
                <AdminButton action={moderateRequest} id={request.id} op="restore">
                  Restore
                </AdminButton>
              ) : (
                <AdminButton action={moderateRequest} id={request.id} op="remove" danger>
                  Remove
                </AdminButton>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

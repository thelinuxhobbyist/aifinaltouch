import Link from "next/link";
import { desc, eq, like, or } from "drizzle-orm";
import { StatusBadge } from "@/components/ui";
import { specialistProfiles, users } from "@/db/schema";
import { getDb } from "@/lib/cf";
import { formatDate } from "@/lib/format";
import { param } from "@/lib/search-params";
import { moderateProfile } from "../actions";
import { AdminButton, AdminSearch, AdminTable } from "../components";

export default async function AdminProfilesPage({ searchParams }: PageProps<"/admin/profiles">) {
  const q = param((await searchParams).q);
  const rows = await getDb()
    .select({ profile: specialistProfiles, ownerEmail: users.email })
    .from(specialistProfiles)
    .innerJoin(users, eq(users.id, specialistProfiles.userId))
    .where(q ? or(like(specialistProfiles.name, `%${q}%`), like(specialistProfiles.title, `%${q}%`)) : undefined)
    .orderBy(desc(specialistProfiles.updatedAt))
    .limit(200);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Specialist profiles</h1>
      <AdminSearch q={q} placeholder="Search name or title" />
      <AdminTable head={["Name", "Owner", "Updated", "Status", ""]}>
        {rows.map(({ profile, ownerEmail }) => (
          <tr key={profile.id}>
            <td className="py-3 pr-4">
              <Link href={`/specialists/${profile.slug}`} className="font-medium hover:text-brand">
                {profile.name}
              </Link>
              <span className="ml-2 text-muted">{profile.title}</span>
            </td>
            <td className="py-3 pr-4 text-ink-soft">{ownerEmail}</td>
            <td className="py-3 pr-4 text-muted">{formatDate(profile.updatedAt)}</td>
            <td className="py-3 pr-4">
              <StatusBadge status={profile.status} />
            </td>
            <td className="py-3 text-right">
              {profile.status === "removed" ? (
                <AdminButton action={moderateProfile} id={profile.id} op="restore">
                  Restore
                </AdminButton>
              ) : (
                <AdminButton action={moderateProfile} id={profile.id} op="remove" danger>
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

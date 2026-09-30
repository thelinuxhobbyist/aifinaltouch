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
      <h1 className="h2 mb-6">Specialist profiles</h1>
      <AdminSearch q={q} placeholder="Search name or title" />
      <AdminTable head={["Name", "Owner", "Updated", "Status", ""]}>
        {rows.map(({ profile, ownerEmail }) => (
          <tr key={profile.id}>
            <td>
              <Link href={`/specialists/${profile.slug}`} className="strong hover-brand">
                {profile.name}
              </Link>{" "}
              <span className="muted">{profile.title}</span>
            </td>
            <td className="soft">{ownerEmail}</td>
            <td className="muted">{formatDate(profile.updatedAt)}</td>
            <td>
              <StatusBadge status={profile.status} />
            </td>
            <td>
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

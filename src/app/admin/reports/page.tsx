import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { StatusBadge } from "@/components/ui";
import { conversations, reports, requests, specialistProfiles, users } from "@/db/schema";
import { getDb } from "@/lib/cf";
import { formatDateTime } from "@/lib/format";
import { moderateProfile, moderateRequest, resolveReport } from "../actions";
import { AdminButton } from "../components";

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  const showAll = (await searchParams).all === "1";
  const db = getDb();
  const rows = await db
    .select({ report: reports, reporterName: users.displayName, reporterEmail: users.email })
    .from(reports)
    .innerJoin(users, eq(users.id, reports.reporterUserId))
    .where(showAll ? undefined : eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt))
    .limit(200);

  const ids = (type: string) => rows.filter((r) => r.report.targetType === type).map((r) => r.report.targetId);
  const [reqs, profiles, convos] = await Promise.all([
    ids("request").length ? db.select().from(requests).where(inArray(requests.id, ids("request"))) : [],
    ids("profile").length ? db.select().from(specialistProfiles).where(inArray(specialistProfiles.id, ids("profile"))) : [],
    ids("message").length ? db.select().from(conversations).where(inArray(conversations.id, ids("message"))) : [],
  ]);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <Link href={showAll ? "/admin/reports" : "/admin/reports?all=1"} className="link text-sm">
          {showAll ? "Show open only" : "Show all"}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No {showAll ? "" : "open "}reports.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line-soft border-y border-line-soft">
          {rows.map(({ report, reporterName, reporterEmail }) => {
            const req = report.targetType === "request" ? reqs.find((r) => r.id === report.targetId) : undefined;
            const profile = report.targetType === "profile" ? profiles.find((p) => p.id === report.targetId) : undefined;
            const convo = report.targetType === "message" ? convos.find((c) => c.id === report.targetId) : undefined;
            return (
              <li key={report.id} className="grid gap-3 py-5 lg:grid-cols-[1fr_auto] lg:gap-8">
                <div className="min-w-0 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={report.status} />
                    <span className="font-medium capitalize">{report.targetType === "message" ? "conversation" : report.targetType}</span>
                    {req && (
                      <Link href={`/requests/${req.slug}`} className="link">
                        {req.title}
                      </Link>
                    )}
                    {profile && (
                      <Link href={`/specialists/${profile.slug}`} className="link">
                        {profile.name}
                      </Link>
                    )}
                    {convo && (
                      <Link href={`/admin/conversations/${convo.id}`} className="link">
                        Review messages
                      </Link>
                    )}
                    {(req?.status === "removed" || profile?.status === "removed") && <StatusBadge status="removed" />}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-ink-soft">{report.reason}</p>
                  <p className="mt-2 text-xs text-muted">
                    {reporterName} ({reporterEmail}) · {formatDateTime(report.createdAt)}
                  </p>
                </div>
                {report.status === "open" && (
                  <div className="flex flex-wrap items-start gap-4">
                    {req && req.status !== "removed" && (
                      <AdminButton action={moderateRequest} id={req.id} op="remove" danger>
                        Remove Request
                      </AdminButton>
                    )}
                    {profile && profile.status !== "removed" && (
                      <AdminButton action={moderateProfile} id={profile.id} op="remove" danger>
                        Remove profile
                      </AdminButton>
                    )}
                    <AdminButton action={resolveReport} id={report.id} op="resolve">
                      Mark resolved
                    </AdminButton>
                    <AdminButton action={resolveReport} id={report.id} op="dismiss">
                      Dismiss
                    </AdminButton>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

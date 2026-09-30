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
      <div className="section-head">
        <h1 className="h2">Reports</h1>
        <Link href={showAll ? "/admin/reports" : "/admin/reports?all=1"} className="link small">
          {showAll ? "Show open only" : "Show all"}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="small muted">No {showAll ? "" : "open "}reports.</p>
      ) : (
        <ul className="rows">
          {rows.map(({ report, reporterName, reporterEmail }) => {
            const req = report.targetType === "request" ? reqs.find((r) => r.id === report.targetId) : undefined;
            const profile = report.targetType === "profile" ? profiles.find((p) => p.id === report.targetId) : undefined;
            const convo = report.targetType === "message" ? convos.find((c) => c.id === report.targetId) : undefined;
            return (
              <li key={report.id} className="row">
                <div className="row__main small">
                  <p className="cluster cluster--tight">
                    <StatusBadge status={report.status} />
                    <span className="strong">{report.targetType === "message" ? "Conversation" : report.targetType === "request" ? "Request" : "Profile"}</span>
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
                  <p className="prose mt-2">{report.reason}</p>
                  <p className="xsmall muted mt-2">
                    {reporterName} ({reporterEmail}) · {formatDateTime(report.createdAt)}
                  </p>
                </div>
                {report.status === "open" && (
                  <div className="row__side">
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

import Link from "next/link";
import { count, desc, eq, gt, sql } from "drizzle-orm";
import {
  adminActions,
  analyticsEvents,
  conversations,
  interests,
  messages,
  reports,
  requests,
  specialistProfiles,
  users,
} from "@/db/schema";
import { getDb } from "@/lib/cf";
import { daysAgo, formatDateTime } from "@/lib/format";

const EVENT_LABELS: Record<string, string> = {
  homepage_visit: "Homepage visits",
  sign_up: "Sign-ups",
  specialist_profile_created: "Specialist profiles created",
  request_created: "Requests created",
  request_published: "Requests published",
  request_viewed: "Request views",
  interest_submitted: "Interests submitted",
  conversation_started: "Conversations started",
  message_sent: "Messages sent",
};

function Stat({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
  return <div className="stat">{href ? <Link href={href} className="block">{inner}</Link> : inner}</div>;
}

export default async function AdminOverview() {
  const db = getDb();
  const since = daysAgo(30);

  const [
    [{ users: userCount }],
    profileStatus,
    requestStatus,
    [{ n: interestCount }],
    [{ n: conversationCount }],
    [{ n: messageCount }],
    [{ n: openReports }],
    events,
    recentActions,
    introductions,
    requestsWithInterest,
  ] = await Promise.all([
    db.select({ users: count() }).from(users),
    db.select({ status: specialistProfiles.status, n: count() }).from(specialistProfiles).groupBy(specialistProfiles.status),
    db.select({ status: requests.status, n: count() }).from(requests).groupBy(requests.status),
    db.select({ n: count() }).from(interests),
    db.select({ n: count() }).from(conversations),
    db.select({ n: count() }).from(messages),
    db.select({ n: count() }).from(reports).where(eq(reports.status, "open")),
    db
      .select({ name: analyticsEvents.name, n: count() })
      .from(analyticsEvents)
      .where(gt(analyticsEvents.createdAt, since))
      .groupBy(analyticsEvents.name),
    db
      .select({ action: adminActions, adminName: users.displayName })
      .from(adminActions)
      .innerJoin(users, eq(users.id, adminActions.adminUserId))
      .orderBy(desc(adminActions.createdAt))
      .limit(10),
    // A conversation where both sides have written counts as an introduction that happened.
    db.get<{ n: number }>(sql`
      select count(*) as n from conversations c
      where exists (select 1 from messages m where m.conversation_id = c.id and m.sender_user_id = c.requester_user_id)
        and exists (select 1 from messages m where m.conversation_id = c.id and m.sender_user_id = c.specialist_user_id)`),
    db.get<{ n: number }>(sql`select count(distinct request_id) as n from interests`),
  ]);

  const byStatus = (rows: { status: string; n: number }[], s: string) => rows.find((r) => r.status === s)?.n ?? 0;
  const eventCount = (name: string) => events.find((e) => e.name === name)?.n ?? 0;
  const published = byStatus(requestStatus, "published") + byStatus(requestStatus, "closed");

  return (
    <div className="stack stack--xl">
      <section>
        <h1 className="h2">Overview</h1>
        <dl className="stats mt-6">
          <Stat label="Users" value={userCount} href="/admin/users" />
          <Stat label="Public profiles" value={byStatus(profileStatus, "published")} href="/admin/profiles" />
          <Stat label="Open Requests" value={byStatus(requestStatus, "published")} href="/admin/requests" />
          <Stat label="Open reports" value={openReports} href="/admin/reports" />
          <Stat label="Interests" value={interestCount} />
          <Stat label="Conversations" value={conversationCount} />
          <Stat label="Messages" value={messageCount} />
          <Stat label="Draft Requests" value={byStatus(requestStatus, "draft")} />
        </dl>
      </section>

      <section>
        <h2 className="h3">Is the core loop working?</h2>
        <p className="small muted mt-1">All time. An introduction is a conversation where both people have written.</p>
        <dl className="stats mt-6">
          <Stat label="Requests published" value={published} />
          <Stat
            label="…with at least one interest"
            value={`${requestsWithInterest?.n ?? 0}${published ? ` (${Math.round(((requestsWithInterest?.n ?? 0) / published) * 100)}%)` : ""}`}
          />
          <Stat label="Conversations" value={conversationCount} />
          <Stat label="Introductions" value={introductions?.n ?? 0} />
        </dl>
      </section>

      <section>
        <h2 className="h3">Activity — last 30 days</h2>
        <dl className="stats stats--3 mt-6">
          {Object.entries(EVENT_LABELS).map(([name, label]) => (
            <Stat key={name} label={label} value={eventCount(name)} />
          ))}
        </dl>
      </section>

      <section>
        <h2 className="h3">Recent moderation</h2>
        {recentActions.length === 0 ? (
          <p className="small muted mt-3">No moderation actions yet.</p>
        ) : (
          <ul className="rows mt-4">
            {recentActions.map(({ action, adminName }) => (
              <li key={action.id} className="row small">
                <span className="row__main">
                  <span className="strong">{adminName}</span> · {action.action.replace(/_/g, " ")}{" "}
                  <span className="mono xsmall muted">{action.targetId.slice(0, 8)}</span>
                </span>
                <span className="muted shrink-0">{formatDateTime(action.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

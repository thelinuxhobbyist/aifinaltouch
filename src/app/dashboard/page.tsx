import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { StatusBadge } from "@/components/ui";
import { conversations, interests, requests } from "@/db/schema";
import { requireUserPage } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { formatDate, timeAgo } from "@/lib/format";
import { getOwnProfile, listConversationsForUser } from "@/lib/queries";
import { setEmailNotifications } from "./actions";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="divider-top">
      <div className="section-head">
        <h2 className="h3">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUserPage("/dashboard");
  const db = getDb();

  const [myRequests, myInterests, convos, profile] = await Promise.all([
    db
      .select({ request: requests, interestCount: count(interests.id) })
      .from(requests)
      .leftJoin(interests, eq(interests.requestId, requests.id))
      .where(eq(requests.userId, user.id))
      .groupBy(requests.id)
      .orderBy(desc(requests.createdAt)),
    db
      .select({ interest: interests, request: requests, conversationId: conversations.id })
      .from(interests)
      .innerJoin(requests, eq(requests.id, interests.requestId))
      .leftJoin(conversations, eq(conversations.interestId, interests.id))
      .where(eq(interests.specialistUserId, user.id))
      .orderBy(desc(interests.createdAt))
      .limit(50),
    listConversationsForUser(user.id),
    getOwnProfile(user.id),
  ]);
  const unreadConvos = convos.filter((c) => c.unread > 0);

  return (
    <div className="container page">
      <div className="page-header mb-8">
        <div className="page-header__text">
          <p className="eyebrow">Dashboard</p>
          <h1 className="h1">Hello, {user.displayName.split(" ")[0]}</h1>
        </div>
        <div className="page-header__actions">
          <Link href="/requests/new" className="btn btn--primary">
            Post a Request
          </Link>
          <Link href="/requests" className="btn btn--secondary">
            Browse Requests
          </Link>
        </div>
      </div>

      {user.status !== "active" && (
        <p className="alert alert--error mb-8">
          Your account is suspended. You can read existing content but can&apos;t post, respond or send messages.
        </p>
      )}

      <div className="with-sidebar">
        <div className="stack stack--xl min-w-0">
          <Section
            title="Messages"
            action={
              <Link href="/messages" className="link small">
                All messages →
              </Link>
            }
          >
            {convos.length === 0 ? (
              <p className="small muted">Your conversations will appear here when you connect with a specialist.</p>
            ) : unreadConvos.length === 0 ? (
              <p className="small muted">
                You&apos;re all caught up across {convos.length} conversation{convos.length === 1 ? "" : "s"}.
              </p>
            ) : (
              <ul className="rows rows--flush">
                {unreadConvos.slice(0, 5).map((c) => (
                  <li key={c.conversation.id}>
                    <Link href={`/messages/${c.conversation.id}`} className="row hover-brand">
                      <span className="row__main truncate small">
                        <span className="strong">{c.otherName}</span>
                        <span className="muted"> · {c.requestTitle}</span>
                      </span>
                      <span className="count">{c.unread}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="My Requests">
            {myRequests.length === 0 ? (
              <p className="small muted">
                You haven&apos;t posted a Request yet.{" "}
                <Link href="/requests/new" className="link">
                  Tell us what AI made
                </Link>
                .
              </p>
            ) : (
              <ul className="rows">
                {myRequests.map(({ request, interestCount }) => (
                  <li key={request.id} className="row">
                    <div className="row__main">
                      <Link href={`/requests/${request.slug}`} className="strong hover-brand">
                        {request.title}
                      </Link>
                      <p className="xsmall muted mt-1">Created {formatDate(request.createdAt)}</p>
                    </div>
                    <div className="row__side">
                      <span className="muted">{interestCount} interested</span>
                      <StatusBadge status={request.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="My Interests">
            {myInterests.length === 0 ? (
              <p className="small muted">
                Requests you respond to as a specialist will appear here.{" "}
                <Link href="/requests" className="link">
                  Browse Requests
                </Link>
                .
              </p>
            ) : (
              <ul className="rows">
                {myInterests.map(({ interest, request, conversationId }) => (
                  <li key={interest.id} className="row">
                    <div className="row__main">
                      <Link href={`/requests/${request.slug}`} className="strong hover-brand">
                        {request.title}
                      </Link>
                      <p className="xsmall muted mt-1">Interested {timeAgo(interest.createdAt)}</p>
                    </div>
                    <div className="row__side">
                      {request.status !== "published" && <StatusBadge status={request.status} />}
                      {conversationId && (
                        <Link href={`/messages/${conversationId}`} className="link">
                          Conversation
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="stack stack--lg">
          <div className="box stack stack--sm">
            <h2 className="h4">Specialist profile</h2>
            {profile ? (
              <>
                <p className="cluster cluster--tight small">
                  <span className="strong">{profile.name}</span> <StatusBadge status={profile.status} />
                </p>
                <div className="cluster cluster--tight">
                  <Link href="/profile/edit" className="btn btn--secondary btn--sm">
                    Edit profile
                  </Link>
                  {profile.status === "published" && (
                    <Link href={`/specialists/${profile.slug}`} className="btn btn--ghost btn--sm">
                      View
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="small muted">Do you finish AI-built websites or apps? Create a profile to respond to Requests.</p>
                <Link href="/profile/edit" className="btn btn--secondary btn--block">
                  Create a specialist profile
                </Link>
              </>
            )}
          </div>

          <form action={setEmailNotifications} className="box stack stack--sm">
            <h2 className="h4">Email notifications</h2>
            <p className="small muted">
              {user.emailNotifications
                ? `We email ${user.email} when someone is interested in your Request or sends you a message.`
                : "Email notifications are off. You'll still see everything on the site."}
            </p>
            <input type="hidden" name="enabled" value={user.emailNotifications ? "0" : "1"} />
            <button type="submit" className="btn btn--secondary btn--sm">
              {user.emailNotifications ? "Turn off emails" : "Turn on emails"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

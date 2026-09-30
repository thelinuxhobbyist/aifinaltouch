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
    <section className="border-t border-line pt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
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
    <div className="container-page py-12">
      <div className="flex flex-col gap-4 pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hello, {user.displayName.split(" ")[0]}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/requests/new" className="btn-primary">
            Post a Request
          </Link>
          <Link href="/requests" className="btn-secondary">
            Browse Requests
          </Link>
        </div>
      </div>

      {user.status !== "active" && (
        <p className="mb-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Your account is suspended. You can read existing content but can&apos;t post, respond or send messages.
        </p>
      )}

      <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <Section
            title="Messages"
            action={
              <Link href="/messages" className="link text-sm">
                All messages
              </Link>
            }
          >
            {convos.length === 0 ? (
              <p className="text-sm text-muted">Your conversations will appear here when you connect with a specialist.</p>
            ) : unreadConvos.length === 0 ? (
              <p className="text-sm text-muted">
                You&apos;re all caught up across {convos.length} conversation{convos.length === 1 ? "" : "s"}.
              </p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {unreadConvos.slice(0, 5).map((c) => (
                  <li key={c.conversation.id}>
                    <Link href={`/messages/${c.conversation.id}`} className="flex justify-between gap-4 py-3 text-sm hover:text-brand">
                      <span className="truncate">
                        <span className="font-semibold">{c.otherName}</span>
                        <span className="text-muted"> · {c.requestTitle}</span>
                      </span>
                      <span className="shrink-0 font-medium text-brand">{c.unread} new</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="My Requests">
            {myRequests.length === 0 ? (
              <p className="text-sm text-muted">
                You haven&apos;t posted a Request yet.{" "}
                <Link href="/requests/new" className="link">
                  Tell us what AI made
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {myRequests.map(({ request, interestCount }) => (
                  <li key={request.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <Link href={`/requests/${request.slug}`} className="font-medium hover:text-brand">
                        {request.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">Created {formatDate(request.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-sm">
                      <span className="text-muted">
                        {interestCount} interested
                      </span>
                      <StatusBadge status={request.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="My Interests">
            {myInterests.length === 0 ? (
              <p className="text-sm text-muted">
                Requests you respond to as a specialist will appear here.{" "}
                <Link href="/requests" className="link">
                  Browse Requests
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {myInterests.map(({ interest, request, conversationId }) => (
                  <li key={interest.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <Link href={`/requests/${request.slug}`} className="font-medium hover:text-brand">
                        {request.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">Interested {timeAgo(interest.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-sm">
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

        <aside className="space-y-10">
          <Section title="Specialist profile">
            {profile ? (
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <span className="font-medium">{profile.name}</span> <StatusBadge status={profile.status} />
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/profile/edit" className="btn-secondary">
                    Edit profile
                  </Link>
                  {profile.status === "published" && (
                    <Link href={`/specialists/${profile.slug}`} className="btn-ghost">
                      View
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted">
                <p>Do you finish AI-built websites or apps? Create a profile to respond to Requests.</p>
                <Link href="/profile/edit" className="btn-secondary">
                  Create a specialist profile
                </Link>
              </div>
            )}
          </Section>

          <Section title="Email notifications">
            <form action={setEmailNotifications} className="space-y-3 text-sm">
              <p className="text-muted">
                {user.emailNotifications
                  ? `We email ${user.email} when someone is interested in your Request or sends you a message.`
                  : "Email notifications are off. You'll still see everything on the site."}
              </p>
              <input type="hidden" name="enabled" value={user.emailNotifications ? "0" : "1"} />
              <button type="submit" className="btn-secondary">
                {user.emailNotifications ? "Turn off emails" : "Turn on emails"}
              </button>
            </form>
          </Section>
        </aside>
      </div>
    </div>
  );
}

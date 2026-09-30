import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { listConversationsForUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function MessagesPage() {
  const user = await requireUserPage("/messages");
  const conversations = await listConversationsForUser(user.id);

  return (
    <div className="container-narrow py-12">
      <PageHeader title="Messages" />
      {conversations.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No conversations yet"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/requests/new" className="btn-primary">
                  Post a Request
                </Link>
                <Link href="/requests" className="btn-secondary">
                  Browse Requests
                </Link>
              </div>
            }
          >
            Your conversations will appear here when you connect with a specialist — or, as a specialist, when you express
            interest in a Request.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-line-soft">
          {conversations.map((c) => (
            <li key={c.conversation.id}>
              <Link href={`/messages/${c.conversation.id}`} className="group flex items-start gap-4 py-5">
                <span
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${c.unread > 0 ? "bg-brand" : "bg-transparent"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className={`truncate ${c.unread > 0 ? "font-semibold" : "font-medium"} group-hover:text-brand`}>
                      {c.otherName}
                      <span className="ml-2 text-xs font-normal text-muted">
                        {c.iAmRequester ? "Specialist" : "Requester"}
                      </span>
                    </p>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(c.conversation.lastMessageAt)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">{c.requestTitle}</p>
                  {c.unread > 0 && (
                    <p className="mt-1 text-xs font-medium text-brand">
                      {c.unread} unread message{c.unread === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

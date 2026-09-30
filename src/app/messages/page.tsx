import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { listConversationsForUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function MessagesPage() {
  const user = await requireUserPage("/messages");
  const conversations = await listConversationsForUser(user.id);

  return (
    <div className="container container--narrow page">
      <PageHeader title="Messages" />
      {conversations.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No conversations yet"
            action={
              <>
                <Link href="/requests/new" className="btn btn--primary">
                  Post a Request
                </Link>
                <Link href="/requests" className="btn btn--secondary">
                  Browse Requests
                </Link>
              </>
            }
          >
            Your conversations will appear here when you connect with a specialist — or, as a specialist, when you express
            interest in a Request.
          </EmptyState>
        </div>
      ) : (
        <ul className="rows rows--flush">
          {conversations.map((c) => (
            <li key={c.conversation.id}>
              <Link href={`/messages/${c.conversation.id}`} className="convo">
                <span className={`unread-dot${c.unread > 0 ? " unread-dot--on" : ""}`} aria-hidden />
                <Avatar name={c.otherName} />
                <div className="convo__main">
                  <div className="cluster cluster--between cluster--baseline">
                    <p className={`convo__name truncate ${c.unread > 0 ? "strong" : ""}`}>
                      {c.otherName} <span className="xsmall muted">{c.iAmRequester ? "Specialist" : "Requester"}</span>
                    </p>
                    <span className="xsmall muted shrink-0">{timeAgo(c.conversation.lastMessageAt)}</span>
                  </div>
                  <p className="small muted truncate">{c.requestTitle}</p>
                  {c.unread > 0 && (
                    <p className="xsmall link mt-1">
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

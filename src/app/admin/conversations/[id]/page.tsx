import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { conversations, messages, requests, users } from "@/db/schema";
import { getDb } from "@/lib/cf";
import { formatDateTime } from "@/lib/format";
import { moderateMessage } from "../../actions";
import { AdminButton } from "../../components";

export default async function AdminConversationPage({ params }: PageProps<"/admin/conversations/[id]">) {
  const { id } = await params;
  const db = getDb();
  const convo = await db
    .select({ conversation: conversations, request: requests })
    .from(conversations)
    .innerJoin(requests, eq(requests.id, conversations.requestId))
    .where(eq(conversations.id, id))
    .get();
  if (!convo) notFound();

  const rows = await db
    .select({ message: messages, senderName: users.displayName, senderEmail: users.email })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderUserId))
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Conversation</h1>
      <p className="mt-1 text-sm text-muted">
        Re:{" "}
        <Link href={`/requests/${convo.request.slug}`} className="link">
          {convo.request.title}
        </Link>
      </p>
      <ul className="mt-6 divide-y divide-line-soft border-y border-line-soft">
        {rows.map(({ message, senderName, senderEmail }) => (
          <li key={message.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:gap-6">
            <div className="min-w-0 text-sm">
              <p className="text-xs text-muted">
                <span className="font-medium text-ink">{senderName}</span> ({senderEmail}) ·{" "}
                {message.senderUserId === convo.conversation.requesterUserId ? "Requester" : "Specialist"} ·{" "}
                {formatDateTime(message.createdAt)}
              </p>
              <p className={`mt-1 whitespace-pre-wrap break-words ${message.removed ? "text-muted line-through" : "text-ink-soft"}`}>
                {message.body}
              </p>
            </div>
            <AdminButton action={moderateMessage} id={message.id} op={message.removed ? "restore" : "remove"} danger={!message.removed}>
              {message.removed ? "Restore" : "Remove"}
            </AdminButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

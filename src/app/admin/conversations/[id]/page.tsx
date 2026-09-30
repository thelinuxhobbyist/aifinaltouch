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
    <div className="container--narrow">
      <h1 className="h2">Conversation</h1>
      <p className="small muted mt-1">
        Re:{" "}
        <Link href={`/requests/${convo.request.slug}`} className="link">
          {convo.request.title}
        </Link>
      </p>
      <ul className="rows mt-6">
        {rows.map(({ message, senderName, senderEmail }) => (
          <li key={message.id} className="row">
            <div className="row__main small">
              <p className="xsmall muted">
                <span className="strong">{senderName}</span> ({senderEmail}) ·{" "}
                {message.senderUserId === convo.conversation.requesterUserId ? "Requester" : "Specialist"} ·{" "}
                {formatDateTime(message.createdAt)}
              </p>
              <p className={`prose mt-1${message.removed ? " struck" : ""}`}>{message.body}</p>
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

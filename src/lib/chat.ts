import "server-only";
import { and, asc, eq, gt, isNull, ne } from "drizzle-orm";
import { messages, type Message } from "@/db/schema";
import { getDb } from "@/lib/cf";

export type ChatMessage = {
  id: string;
  body: string;
  mine: boolean;
  removed: boolean;
  createdAt: number;
  readAt: number | null;
};

export function toChatMessage(m: Message, viewerId: string): ChatMessage {
  return {
    id: m.id,
    body: m.removed ? "" : m.body,
    mine: m.senderUserId === viewerId,
    removed: m.removed,
    createdAt: m.createdAt.getTime(),
    readAt: m.readAt?.getTime() ?? null,
  };
}

export async function loadMessages(conversationId: string, viewerId: string, afterMs?: number) {
  const where = afterMs
    ? and(eq(messages.conversationId, conversationId), gt(messages.createdAt, new Date(afterMs)))
    : eq(messages.conversationId, conversationId);
  const rows = await getDb().select().from(messages).where(where).orderBy(asc(messages.createdAt)).limit(500);
  return rows.map((m) => toChatMessage(m, viewerId));
}

export async function markConversationRead(conversationId: string, readerId: string) {
  await getDb()
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderUserId, readerId), isNull(messages.readAt)));
}

/** Read receipts for the viewer's own messages, so the client can update "Seen". */
export async function readReceipts(conversationId: string, viewerId: string) {
  const rows = await getDb()
    .select({ id: messages.id, readAt: messages.readAt })
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.senderUserId, viewerId)))
    .orderBy(asc(messages.createdAt));
  const last = rows.findLast((r) => r.readAt);
  return last ? { id: last.id, readAt: last.readAt!.getTime() } : null;
}

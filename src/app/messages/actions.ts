"use server";

import { eq } from "drizzle-orm";
import { conversations, messages } from "@/db/schema";
import { runAction, UserFacingError } from "@/lib/action-utils";
import { track } from "@/lib/analytics";
import { requireActiveUser } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { notifyNewMessage } from "@/lib/email";
import { newId } from "@/lib/ids";
import { getConversationForUser } from "@/lib/queries";
import { enforceRateLimit } from "@/lib/rate-limit";
import { formToObject, messageSchema, zodFieldErrors, type ActionState } from "@/lib/validation";

export async function sendMessage(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireActiveUser();
    const parsed = messageSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message, fieldErrors: zodFieldErrors(parsed.error) };

    const found = await getConversationForUser(String(formData.get("conversationId") ?? ""), user);
    if (!found || !found.isParticipant) throw new UserFacingError("Conversation not found.");
    if (found.request.status === "removed") throw new UserFacingError("This Request was removed, so the conversation is closed.");

    await enforceRateLimit("messageBurst", user.id);
    await enforceRateLimit("messageDaily", user.id);

    const { conversation } = found;
    const now = new Date();
    const db = getDb();
    await db.batch([
      db.insert(messages).values({
        id: newId(),
        conversationId: conversation.id,
        senderUserId: user.id,
        body: parsed.data.body,
        createdAt: now,
      }),
      db.update(conversations).set({ lastMessageAt: now }).where(eq(conversations.id, conversation.id)),
    ]);

    await track("message_sent", { userId: user.id, entityId: conversation.id });
    await notifyNewMessage({
      recipientUserId: conversation.requesterUserId === user.id ? conversation.specialistUserId : conversation.requesterUserId,
      conversationId: conversation.id,
      requestTitle: found.request.title,
    });
    return { ok: true };
  });
}

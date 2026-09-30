import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ReportButton } from "@/components/report-button";
import { interests, specialistProfiles, users } from "@/db/schema";
import { requireUserPage } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { loadMessages, markConversationRead, readReceipts } from "@/lib/chat";
import { getConversationForUser } from "@/lib/queries";
import { sendMessage } from "../actions";
import { ChatThread } from "./chat-thread";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const user = await requireUserPage(`/messages/${id}`);
  const found = await getConversationForUser(id, user);
  if (!found) notFound();

  const { conversation, request, isParticipant } = found;
  const db = getDb();
  const [profileRow, requester] = await Promise.all([
    db
      .select({ profile: specialistProfiles })
      .from(interests)
      .innerJoin(specialistProfiles, eq(specialistProfiles.id, interests.profileId))
      .where(eq(interests.id, conversation.interestId))
      .get(),
    db.query.users.findFirst({ where: eq(users.id, conversation.requesterUserId), columns: { displayName: true } }),
  ]);
  const profile = profileRow?.profile;

  if (isParticipant) await markConversationRead(conversation.id, user.id);
  const [initialMessages, lastRead] = await Promise.all([
    loadMessages(conversation.id, user.id),
    readReceipts(conversation.id, user.id),
  ]);

  const iAmRequester = conversation.requesterUserId === user.id;
  const otherName = iAmRequester ? (profile?.name ?? "Specialist") : (requester?.displayName ?? "Requester");
  const canSend = isParticipant && user.status === "active" && request.status !== "removed";

  return (
    <div className="container-narrow flex h-[calc(100dvh-4rem)] flex-col py-6">
      <header className="flex items-start justify-between gap-4 border-b border-line-soft pb-4">
        <div className="min-w-0">
          <Link href="/messages" className="text-sm text-muted hover:text-ink">
            ← All messages
          </Link>
          <h1 className="mt-2 truncate text-xl font-semibold tracking-tight">
            {iAmRequester && profile ? (
              <Link href={`/specialists/${profile.slug}`} className="hover:text-brand">
                {otherName}
              </Link>
            ) : (
              otherName
            )}
            {iAmRequester && profile && <span className="ml-2 text-base font-normal text-muted">{profile.title}</span>}
          </h1>
          <p className="mt-0.5 truncate text-sm text-muted">
            Re:{" "}
            <Link href={`/requests/${request.slug}`} className="hover:text-ink hover:underline">
              {request.title}
            </Link>
          </p>
        </div>
        {isParticipant && (
          <div className="shrink-0 pt-7">
            <ReportButton targetType="message" targetId={conversation.id} signedIn label="Report" />
          </div>
        )}
      </header>

      {!isParticipant && (
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-900">Viewing as admin.</p>
      )}

      <ChatThread
        conversationId={conversation.id}
        initialMessages={initialMessages}
        initialLastRead={lastRead}
        otherName={otherName}
        canSend={canSend}
        sendAction={sendMessage}
      />

      <p className="pt-3 text-center text-xs text-muted">
        AI Final Touch makes the introduction. Agree on scope, price and payment directly with each other.
      </p>
    </div>
  );
}

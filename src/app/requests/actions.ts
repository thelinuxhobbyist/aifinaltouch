"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  conversations,
  interests,
  messages,
  requestAttachments,
  requests,
  requestSkills,
  uploads,
  type Request,
  type User,
} from "@/db/schema";
import { runAction, UserFacingError } from "@/lib/action-utils";
import { track } from "@/lib/analytics";
import { requireActiveUser } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { notifyNewInterest } from "@/lib/email";
import { newId, slugWithSuffix } from "@/lib/ids";
import { getInterest, getOwnProfile } from "@/lib/queries";
import { enforceRateLimit } from "@/lib/rate-limit";
import { deleteUpload, isPresentFile, storeUpload } from "@/lib/uploads";
import { formToObject, interestSchema, requestSchema, zodFieldErrors, type ActionState } from "@/lib/validation";

const MAX_ATTACHMENTS = 5;

async function saveAttachments(formData: FormData, request: Pick<Request, "id">, user: User) {
  const files = formData.getAll("attachments").filter(isPresentFile);
  if (files.length === 0) return;

  const db = getDb();
  const [{ n }] = await db
    .select({ n: count() })
    .from(requestAttachments)
    .where(eq(requestAttachments.requestId, request.id));
  if (n + files.length > MAX_ATTACHMENTS) {
    throw new UserFacingError(`A Request can have up to ${MAX_ATTACHMENTS} attachments.`);
  }

  const visibility = formData.get("attachmentVisibility") === "private" ? "private" : "public";
  for (const file of files) {
    const upload = await storeUpload({ file, ownerUserId: user.id, purpose: "request_attachment", visibility });
    await db.insert(requestAttachments).values({ requestId: request.id, uploadId: upload.id });
  }
}

async function loadOwnedRequest(requestId: string, user: User) {
  const request = await getDb().query.requests.findFirst({
    where: and(eq(requests.id, requestId), eq(requests.userId, user.id)),
  });
  if (!request) throw new UserFacingError("Request not found.");
  if (request.status === "removed") throw new UserFacingError("This Request was removed by a moderator.");
  return request;
}

export async function createRequest(_: ActionState, formData: FormData): Promise<ActionState> {
  let slug = "";
  const result = await runAction(async () => {
    const user = await requireActiveUser();
    const parsed = requestSchema.safeParse(formToObject(formData, ["skillIds", "problemTags"]));
    if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    await enforceRateLimit("requestCreate", user.id);

    const { skillIds, ...fields } = parsed.data;
    const publish = formData.get("intent") === "publish";
    const id = newId();
    slug = slugWithSuffix(fields.title);
    const db = getDb();

    await db.batch([
      db.insert(requests).values({
        id,
        userId: user.id,
        slug,
        ...fields,
        status: publish ? "published" : "draft",
        publishedAt: publish ? new Date() : null,
      }),
      ...(skillIds.length > 0 ? [db.insert(requestSkills).values(skillIds.map((skillId) => ({ requestId: id, skillId })))] : []),
    ]);
    await track("request_created", { userId: user.id, entityId: id });
    if (publish) await track("request_published", { userId: user.id, entityId: id });

    try {
      await saveAttachments(formData, { id }, user);
    } catch (err) {
      // The Request itself is saved; send the user to it with a note rather than losing their text.
      console.error(err);
      slug = `${slug}?attachment_error=1`;
    }
    revalidatePath("/requests");
  });
  if (slug && !result.error) redirect(`/requests/${slug}`);
  return result;
}

export async function updateRequest(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireActiveUser();
    const request = await loadOwnedRequest(String(formData.get("requestId") ?? ""), user);
    const parsed = requestSchema.safeParse(formToObject(formData, ["skillIds", "problemTags"]));
    if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    await enforceRateLimit("requestUpdate", user.id);

    const { skillIds, ...fields } = parsed.data;
    const db = getDb();
    await db.batch([
      db.update(requests).set({ ...fields, updatedAt: new Date() }).where(eq(requests.id, request.id)),
      db.delete(requestSkills).where(eq(requestSkills.requestId, request.id)),
      ...(skillIds.length > 0
        ? [db.insert(requestSkills).values(skillIds.map((skillId) => ({ requestId: request.id, skillId })))]
        : []),
    ]);
    await saveAttachments(formData, request, user);

    revalidatePath(`/requests/${request.slug}`);
    revalidatePath("/requests");
    return { ok: true, message: "Changes saved." };
  });
}

export async function setRequestStatus(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const request = await loadOwnedRequest(String(formData.get("requestId") ?? ""), user);
  const next = String(formData.get("status"));
  const db = getDb();

  if (next === "published" && (request.status === "draft" || request.status === "closed")) {
    await db
      .update(requests)
      .set({ status: "published", publishedAt: request.publishedAt ?? new Date(), closedAt: null, updatedAt: new Date() })
      .where(eq(requests.id, request.id));
    if (request.status === "draft") await track("request_published", { userId: user.id, entityId: request.id });
  } else if (next === "closed" && request.status === "published") {
    await db
      .update(requests)
      .set({ status: "closed", closedAt: new Date(), updatedAt: new Date() })
      .where(eq(requests.id, request.id));
  }

  revalidatePath(`/requests/${request.slug}`);
  revalidatePath("/requests");
  revalidatePath("/dashboard");
}

export async function deleteAttachment(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const request = await loadOwnedRequest(String(formData.get("requestId") ?? ""), user);
  const db = getDb();
  const row = await db
    .select({ upload: uploads })
    .from(requestAttachments)
    .innerJoin(uploads, eq(uploads.id, requestAttachments.uploadId))
    .where(and(eq(requestAttachments.requestId, request.id), eq(requestAttachments.uploadId, String(formData.get("uploadId") ?? ""))))
    .get();
  if (row) await deleteUpload(row.upload);
  revalidatePath(`/requests/${request.slug}`);
  revalidatePath(`/requests/${request.slug}/edit`);
}

export async function expressInterest(_: ActionState, formData: FormData): Promise<ActionState> {
  let conversationId = "";
  const result = await runAction(async () => {
    const user = await requireActiveUser();
    const parsed = interestSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { error: "Please check your message.", fieldErrors: zodFieldErrors(parsed.error) };

    const db = getDb();
    const request = await db.query.requests.findFirst({ where: eq(requests.id, String(formData.get("requestId") ?? "")) });
    if (!request || request.status === "removed" || request.status === "draft") throw new UserFacingError("Request not found.");
    if (request.status === "closed") throw new UserFacingError("This Request is closed and no longer accepting interest.");
    if (request.userId === user.id) throw new UserFacingError("You can't express interest in your own Request.");

    const profile = await getOwnProfile(user.id);
    if (!profile || profile.status !== "published") {
      throw new UserFacingError("You need a public specialist profile before expressing interest.");
    }

    const existing = await getInterest(request.id, user.id);
    if (existing?.conversationId) {
      conversationId = existing.conversationId;
      return;
    }

    await enforceRateLimit("interest", user.id);

    const interestId = newId();
    conversationId = newId();
    const message = parsed.data.message;
    try {
      await db.batch([
        db.insert(interests).values({ id: interestId, requestId: request.id, specialistUserId: user.id, profileId: profile.id, message }),
        db.insert(conversations).values({
          id: conversationId,
          requestId: request.id,
          interestId,
          requesterUserId: request.userId,
          specialistUserId: user.id,
        }),
        ...(message
          ? [db.insert(messages).values({ id: newId(), conversationId, senderUserId: user.id, body: message })]
          : []),
      ]);
    } catch (err) {
      if (err instanceof Error && /UNIQUE/i.test(err.message + String(err.cause ?? ""))) {
        const again = await getInterest(request.id, user.id);
        if (again?.conversationId) {
          conversationId = again.conversationId;
          return;
        }
      }
      throw err;
    }

    await track("interest_submitted", { userId: user.id, entityId: interestId });
    await track("conversation_started", { userId: user.id, entityId: conversationId });
    await notifyNewInterest({
      requesterUserId: request.userId,
      requestTitle: request.title,
      specialistName: profile.name,
      conversationId,
    });

    revalidatePath(`/requests/${request.slug}`);
  });
  if (conversationId && !result.error) redirect(`/messages/${conversationId}`);
  return result;
}

import "server-only";
import { and, desc, eq, gt, isNotNull } from "drizzle-orm";
import { Resend } from "resend";
import { notifications, users } from "@/db/schema";
import { appUrl, config, getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";

const MESSAGE_EMAIL_COOLDOWN_MS = 15 * 60 * 1000;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(heading: string, body: string, ctaLabel: string, ctaUrl: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f8fc;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px">
<tr><td style="padding:28px 32px 8px;font-size:14px;font-weight:600;color:#1d4ed8">AI Final Touch</td></tr>
<tr><td style="padding:8px 32px 0;font-size:20px;font-weight:600">${escapeHtml(heading)}</td></tr>
<tr><td style="padding:12px 32px 0;font-size:15px;line-height:1.6;color:#334155">${body}</td></tr>
<tr><td style="padding:24px 32px 32px"><a href="${ctaUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;font-weight:600">${escapeHtml(ctaLabel)}</a></td></tr>
</table>
<p style="font-size:12px;color:#64748b;margin-top:16px">You can turn off email notifications from your <a href="${appUrl()}/dashboard" style="color:#64748b">dashboard</a>.</p>
</td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const apiKey = config("RESEND_API_KEY");
  const from = config("EMAIL_FROM") ?? "AI Final Touch <notifications@aifinaltouch.com>";
  if (!apiKey) {
    console.info(`[email:disabled] to=${to} subject="${subject}"\n${text}`);
    return false;
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({ from, to, subject, html, text });
    if (error) {
      console.error("resend", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("resend", err);
    return false;
  }
}

async function recipient(userId: string) {
  return getDb().query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.status, "active")),
    columns: { id: true, email: true, emailNotifications: true },
  });
}

/** Links carry no credentials; the conversation page itself enforces sign-in and participation. */
export async function notifyNewInterest(opts: {
  requesterUserId: string;
  requestTitle: string;
  specialistName: string;
  conversationId: string;
}) {
  const db = getDb();
  await db.insert(notifications).values({
    id: newId(),
    userId: opts.requesterUserId,
    type: "new_interest",
    entityId: opts.conversationId,
  });

  const user = await recipient(opts.requesterUserId);
  if (!user?.email || !user.emailNotifications) return;

  const url = `${appUrl()}/messages/${opts.conversationId}`;
  const sent = await send(
    user.email,
    "A specialist is interested in your Request",
    layout(
      "A specialist is interested in your Request",
      `<strong>${escapeHtml(opts.specialistName)}</strong> expressed interest in “${escapeHtml(opts.requestTitle)}”. View their profile and reply on AI Final Touch.`,
      "View interest",
      url,
    ),
    `${opts.specialistName} expressed interest in "${opts.requestTitle}".\n\nView it on AI Final Touch: ${url}`,
  );
  if (sent) {
    await db
      .update(notifications)
      .set({ emailSentAt: new Date() })
      .where(and(eq(notifications.userId, user.id), eq(notifications.entityId, opts.conversationId), eq(notifications.type, "new_interest")));
  }
}

export async function notifyNewMessage(opts: { recipientUserId: string; conversationId: string; requestTitle: string }) {
  const db = getDb();
  const recent = await db.query.notifications.findFirst({
    where: and(
      eq(notifications.userId, opts.recipientUserId),
      eq(notifications.type, "new_message"),
      eq(notifications.entityId, opts.conversationId),
      isNotNull(notifications.emailSentAt),
      gt(notifications.emailSentAt, new Date(Date.now() - MESSAGE_EMAIL_COOLDOWN_MS)),
    ),
    orderBy: desc(notifications.createdAt),
  });
  if (recent) return;

  const user = await recipient(opts.recipientUserId);
  if (!user?.email || !user.emailNotifications) return;

  const url = `${appUrl()}/messages/${opts.conversationId}`;
  const sent = await send(
    user.email,
    "You have a new message on AI Final Touch",
    layout(
      "You have a new message",
      `You have a new message about “${escapeHtml(opts.requestTitle)}”. Sign in to read and reply.`,
      "Open conversation",
      url,
    ),
    `You have a new message about "${opts.requestTitle}".\n\nOpen the conversation: ${url}`,
  );
  await db.insert(notifications).values({
    id: newId(),
    userId: user.id,
    type: "new_message",
    entityId: opts.conversationId,
    emailSentAt: sent ? new Date() : null,
  });
}

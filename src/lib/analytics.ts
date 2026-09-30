import "server-only";
import { headers } from "next/headers";
import { analyticsEvents } from "@/db/schema";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";

export type AnalyticsEvent =
  | "homepage_visit"
  | "sign_up"
  | "specialist_profile_created"
  | "request_created"
  | "request_published"
  | "request_viewed"
  | "interest_submitted"
  | "conversation_started"
  | "message_sent";

const BOT_PATTERN = /bot|crawler|spider|crawling|preview|facebookexternalhit|slurp/i;

/** Best-effort event log; never lets analytics break the user's action. */
export async function track(name: AnalyticsEvent, opts: { userId?: string | null; entityId?: string | null } = {}) {
  try {
    if (name === "homepage_visit" || name === "request_viewed") {
      const ua = (await headers()).get("user-agent") ?? "";
      if (!ua || BOT_PATTERN.test(ua)) return;
    }
    await getDb()
      .insert(analyticsEvents)
      .values({ id: newId(), name, userId: opts.userId ?? null, entityId: opts.entityId ?? null });
  } catch (err) {
    console.error("analytics", name, err);
  }
}

import "server-only";
import { lt, sql } from "drizzle-orm";
import { rateLimits } from "@/db/schema";
import { getDb } from "@/lib/cf";

export const LIMITS = {
  requestCreate: { limit: 5, windowSeconds: 24 * 60 * 60 },
  requestUpdate: { limit: 60, windowSeconds: 60 * 60 },
  interest: { limit: 30, windowSeconds: 24 * 60 * 60 },
  messageBurst: { limit: 20, windowSeconds: 60 },
  messageDaily: { limit: 300, windowSeconds: 24 * 60 * 60 },
  upload: { limit: 30, windowSeconds: 60 * 60 },
  profileUpdate: { limit: 60, windowSeconds: 60 * 60 },
  report: { limit: 10, windowSeconds: 24 * 60 * 60 },
} as const;

export type LimitName = keyof typeof LIMITS;

export class RateLimitError extends Error {
  constructor() {
    super("You're doing that too often. Please wait a little and try again.");
  }
}

/** Fixed-window counter stored in D1. Throws RateLimitError when the window is exhausted. */
export async function enforceRateLimit(name: LimitName, subject: string): Promise<void> {
  const { limit, windowSeconds } = LIMITS[name];
  const nowSec = Math.floor(Date.now() / 1000);
  const windowStart = nowSec - (nowSec % windowSeconds);
  const key = `${name}:${subject}`;

  const db = getDb();
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  if (Math.random() < 0.01) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, nowSec - 2 * 24 * 60 * 60));
  }

  if ((row?.count ?? 0) > limit) throw new RateLimitError();
}

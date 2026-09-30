"use server";

import { reports } from "@/db/schema";
import { runAction } from "@/lib/action-utils";
import { requireActiveUser } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { enforceRateLimit } from "@/lib/rate-limit";
import { formToObject, reportSchema, zodFieldErrors, type ActionState } from "@/lib/validation";

export async function submitReport(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireActiveUser();
    const parsed = reportSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { error: "Please describe the problem.", fieldErrors: zodFieldErrors(parsed.error) };
    await enforceRateLimit("report", user.id);

    await getDb()
      .insert(reports)
      .values({ id: newId(), reporterUserId: user.id, ...parsed.data })
      .onConflictDoNothing();
    return { ok: true, message: "Thanks — a moderator will review this." };
  });
}

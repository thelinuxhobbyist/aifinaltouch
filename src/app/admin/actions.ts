"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { adminActions, messages, reports, requests, specialistProfiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";

async function log(adminUserId: string, action: string, targetType: string, targetId: string, note?: string) {
  await getDb().insert(adminActions).values({ id: newId(), adminUserId, action, targetType, targetId, note: note ?? null });
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export async function moderateRequest(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const op = str(formData, "op");
  const db = getDb();
  if (op === "remove") {
    await db.update(requests).set({ status: "removed", updatedAt: new Date() }).where(eq(requests.id, id));
  } else if (op === "restore") {
    await db
      .update(requests)
      .set({ status: "closed", updatedAt: new Date() })
      .where(and(eq(requests.id, id), eq(requests.status, "removed")));
  } else return;
  await log(admin.id, `request_${op}`, "request", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/requests");
}

export async function moderateProfile(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const op = str(formData, "op");
  const db = getDb();
  if (op === "remove") {
    await db.update(specialistProfiles).set({ status: "removed", updatedAt: new Date() }).where(eq(specialistProfiles.id, id));
  } else if (op === "restore") {
    await db
      .update(specialistProfiles)
      .set({ status: "hidden", updatedAt: new Date() })
      .where(and(eq(specialistProfiles.id, id), eq(specialistProfiles.status, "removed")));
  } else return;
  await log(admin.id, `profile_${op}`, "profile", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/specialists");
}

export async function moderateUser(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const op = str(formData, "op");
  if (id === admin.id) return;
  const status = op === "suspend" ? "suspended" : op === "reinstate" ? "active" : null;
  if (!status) return;
  await getDb().update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id));
  await log(admin.id, `user_${op}`, "user", id);
  revalidatePath("/admin", "layout");
}

export async function moderateMessage(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const removed = str(formData, "op") === "remove";
  await getDb().update(messages).set({ removed }).where(eq(messages.id, id));
  await log(admin.id, removed ? "message_remove" : "message_restore", "message", id);
  revalidatePath("/admin", "layout");
}

export async function resolveReport(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "op") === "dismiss" ? "dismissed" : "resolved";
  await getDb()
    .update(reports)
    .set({ status, resolvedByUserId: admin.id, resolvedAt: new Date() })
    .where(eq(reports.id, id));
  await log(admin.id, `report_${status}`, "report", id);
  revalidatePath("/admin", "layout");
}

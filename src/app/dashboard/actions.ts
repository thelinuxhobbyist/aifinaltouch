"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { users } from "@/db/schema";
import { requireActiveUser } from "@/lib/auth";
import { getDb } from "@/lib/cf";

export async function setEmailNotifications(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  await getDb()
    .update(users)
    .set({ emailNotifications: formData.get("enabled") === "1", updatedAt: new Date() })
    .where(eq(users.id, user.id));
  revalidatePath("/dashboard");
}

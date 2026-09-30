"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { portfolioItems, specialistProfiles, specialistSkills, uploads } from "@/db/schema";
import { runAction, UserFacingError } from "@/lib/action-utils";
import { track } from "@/lib/analytics";
import { requireActiveUser } from "@/lib/auth";
import { getDb } from "@/lib/cf";
import { newId, slugify, shortId } from "@/lib/ids";
import { getOwnProfile } from "@/lib/queries";
import { enforceRateLimit } from "@/lib/rate-limit";
import { deleteUpload, isPresentFile, storeUpload } from "@/lib/uploads";
import {
  formToObject,
  portfolioItemSchema,
  profileSchema,
  zodFieldErrors,
  type ActionState,
} from "@/lib/validation";

const MAX_PORTFOLIO_ITEMS = 12;

async function uniqueProfileSlug(name: string): Promise<string> {
  const db = getDb();
  const base = slugify(name, 48);
  const taken = await db.query.specialistProfiles.findFirst({
    where: eq(specialistProfiles.slug, base),
    columns: { id: true },
  });
  return taken ? `${base}-${shortId(4)}` : base;
}

export async function saveProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireActiveUser();
    const parsed = profileSchema.safeParse(formToObject(formData, ["skillIds"]));
    if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    await enforceRateLimit("profileUpdate", user.id);

    const { skillIds, ...fields } = parsed.data;
    const wantsPublic = formData.get("visibility") === "published";
    const db = getDb();
    const existing = await getOwnProfile(user.id);

    let profileId: string;
    let slug: string;
    if (existing) {
      profileId = existing.id;
      slug = existing.slug;
      const status = existing.status === "removed" ? "removed" : wantsPublic ? "published" : existing.status === "draft" ? "draft" : "hidden";
      await db
        .update(specialistProfiles)
        .set({ ...fields, status, updatedAt: new Date() })
        .where(eq(specialistProfiles.id, existing.id));
    } else {
      profileId = newId();
      slug = await uniqueProfileSlug(fields.name);
      await db.insert(specialistProfiles).values({
        id: profileId,
        userId: user.id,
        slug,
        ...fields,
        status: wantsPublic ? "published" : "draft",
      });
      await track("specialist_profile_created", { userId: user.id, entityId: profileId });
    }

    await db.batch([
      db.delete(specialistSkills).where(eq(specialistSkills.profileId, profileId)),
      ...(skillIds.length > 0
        ? [db.insert(specialistSkills).values(skillIds.map((skillId) => ({ profileId, skillId })))]
        : []),
    ]);

    revalidatePath("/specialists");
    revalidatePath(`/specialists/${slug}`);
    if (!existing) redirect("/profile/edit?created=1");
    return { ok: true, message: "Profile saved." };
  });
}

export async function addPortfolioItem(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireActiveUser();
    const profile = await getOwnProfile(user.id);
    if (!profile) throw new UserFacingError("Create your profile before adding portfolio examples.");
    if (profile.status === "removed") throw new UserFacingError("This profile has been removed by a moderator.");

    const parsed = portfolioItemSchema.safeParse(formToObject(formData));
    if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

    const db = getDb();
    const [{ n }] = await db.select({ n: count() }).from(portfolioItems).where(eq(portfolioItems.profileId, profile.id));
    if (n >= MAX_PORTFOLIO_ITEMS) throw new UserFacingError(`You can show up to ${MAX_PORTFOLIO_ITEMS} examples.`);

    const image = formData.get("image");
    if (!isPresentFile(image) && !parsed.data.url) {
      return { error: "Add an image or a link for this example.", fieldErrors: { image: "Add an image or a link." } };
    }

    const upload = isPresentFile(image)
      ? await storeUpload({ file: image, ownerUserId: user.id, purpose: "portfolio", visibility: "public" })
      : null;

    await db.insert(portfolioItems).values({
      id: newId(),
      profileId: profile.id,
      ...parsed.data,
      imageUploadId: upload?.id ?? null,
      sortOrder: n,
    });

    revalidatePath(`/specialists/${profile.slug}`);
    revalidatePath("/profile/edit");
    return { ok: true, message: "Example added." };
  });
}

export async function deletePortfolioItem(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const itemId = String(formData.get("itemId") ?? "");
  const db = getDb();

  const row = await db
    .select({ item: portfolioItems, profileSlug: specialistProfiles.slug })
    .from(portfolioItems)
    .innerJoin(specialistProfiles, eq(specialistProfiles.id, portfolioItems.profileId))
    .where(and(eq(portfolioItems.id, itemId), eq(specialistProfiles.userId, user.id)))
    .get();
  if (!row) return;

  await db.delete(portfolioItems).where(eq(portfolioItems.id, row.item.id));
  for (const uploadId of [row.item.imageUploadId, row.item.beforeUploadId]) {
    if (!uploadId) continue;
    const upload = await db.query.uploads.findFirst({ where: and(eq(uploads.id, uploadId), eq(uploads.ownerUserId, user.id)) });
    if (upload) await deleteUpload(upload);
  }

  revalidatePath(`/specialists/${row.profileSlug}`);
  revalidatePath("/profile/edit");
}

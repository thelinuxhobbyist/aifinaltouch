import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { users, type User } from "@/db/schema";
import { track } from "@/lib/analytics";
import { config, getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";

function adminEmails(): Set<string> {
  return new Set(
    (config("ADMIN_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function syncUserFromClerk(clerkId: string): Promise<User | null> {
  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== clerkId) return null;

  const email = (
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    ""
  ).toLowerCase();
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    email.split("@")[0] ||
    "Member";
  const isAdmin = email !== "" && adminEmails().has(email);

  const db = getDb();
  const [row] = await db
    .insert(users)
    .values({ id: newId(), clerkId, email, displayName, isAdmin })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email, updatedAt: new Date(), ...(isAdmin ? { isAdmin: true } : {}) },
    })
    .returning();
  return row ?? null;
}

/**
 * The signed-in user's D1 record, created on first sight.
 * Cached per request so layouts and pages share one lookup.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const db = getDb();
  const existing = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (existing) {
    if (!existing.isAdmin && adminEmails().has(existing.email)) {
      await db.update(users).set({ isAdmin: true }).where(eq(users.id, existing.id));
      return { ...existing, isAdmin: true };
    }
    return existing;
  }
  const created = await syncUserFromClerk(clerkId);
  if (created) await track("sign_up", { userId: created.id });
  return created;
});

export class AuthError extends Error {}

/** For pages: redirect to sign-in when signed out. */
export async function requireUserPage(returnTo: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
  return user;
}

/** For mutations: throws unless the caller is signed in and not suspended. */
export async function requireActiveUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Please sign in to continue.");
  if (user.status !== "active") throw new AuthError("Your account has been suspended.");
  return user;
}

export async function requireAdminPage(): Promise<User> {
  const user = await requireUserPage("/admin");
  if (!user.isAdmin) notFound();
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireActiveUser();
  if (!user.isAdmin) throw new AuthError("Not allowed.");
  return user;
}

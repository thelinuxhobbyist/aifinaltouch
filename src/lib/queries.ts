import "server-only";
import { and, asc, count, desc, eq, exists, inArray, isNull, like, ne, or, sql, type SQL } from "drizzle-orm";
import {
  conversations,
  interests,
  messages,
  portfolioItems,
  requestAttachments,
  requestSkills,
  requests,
  skills,
  specialistProfiles,
  specialistSkills,
  uploads,
  users,
  type Request,
  type Skill,
  type User,
} from "@/db/schema";
import { getDb } from "@/lib/cf";

export const PAGE_SIZE = 20;

function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function likeEscaped(column: Parameters<typeof like>[0], q: string): SQL {
  return sql`${column} LIKE ${likePattern(q)} ESCAPE '\\'`;
}

export async function listSkills(): Promise<Skill[]> {
  return getDb().select().from(skills).orderBy(asc(skills.sortOrder));
}

export function groupSkills(all: Skill[]): { category: string; skills: Skill[] }[] {
  const groups = new Map<string, Skill[]>();
  for (const s of all) groups.set(s.category, [...(groups.get(s.category) ?? []), s]);
  return Array.from(groups, ([category, skills]) => ({ category, skills }));
}

async function skillsFor(table: "request" | "profile", ids: string[]): Promise<Map<string, Skill[]>> {
  const map = new Map<string, Skill[]>();
  if (ids.length === 0) return map;
  const db = getDb();
  const rows =
    table === "request"
      ? await db
          .select({ ownerId: requestSkills.requestId, skill: skills })
          .from(requestSkills)
          .innerJoin(skills, eq(skills.id, requestSkills.skillId))
          .where(inArray(requestSkills.requestId, ids))
          .orderBy(asc(skills.sortOrder))
      : await db
          .select({ ownerId: specialistSkills.profileId, skill: skills })
          .from(specialistSkills)
          .innerJoin(skills, eq(skills.id, specialistSkills.skillId))
          .where(inArray(specialistSkills.profileId, ids))
          .orderBy(asc(skills.sortOrder));
  for (const r of rows) map.set(r.ownerId, [...(map.get(r.ownerId) ?? []), r.skill]);
  return map;
}

// ---------- Requests ----------

export type RequestFilters = { q?: string; skill?: string; remote?: string; page?: number };

export async function listPublishedRequests(filters: RequestFilters) {
  const db = getDb();
  const where: SQL[] = [eq(requests.status, "published")];
  if (filters.q) {
    where.push(
      or(
        likeEscaped(requests.title, filters.q),
        likeEscaped(requests.aiCreated, filters.q),
        likeEscaped(requests.notRight, filters.q),
        likeEscaped(requests.needs, filters.q),
      )!,
    );
  }
  if (filters.skill) {
    where.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(requestSkills)
          .innerJoin(skills, eq(skills.id, requestSkills.skillId))
          .where(and(eq(requestSkills.requestId, requests.id), eq(skills.slug, filters.skill))),
      ),
    );
  }
  if (filters.remote === "remote") where.push(ne(requests.remotePreference, "onsite"));
  if (filters.remote === "onsite") where.push(ne(requests.remotePreference, "remote"));

  const page = Math.max(1, filters.page ?? 1);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(requests)
      .where(and(...where))
      .orderBy(desc(requests.publishedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(requests).where(and(...where)),
  ]);
  const skillMap = await skillsFor("request", rows.map((r) => r.id));
  return { rows: rows.map((r) => ({ ...r, skills: skillMap.get(r.id) ?? [] })), total, page };
}

export async function getRequestBySlug(slug: string) {
  const db = getDb();
  const row = await db
    .select({ request: requests, requesterName: users.displayName })
    .from(requests)
    .innerJoin(users, eq(users.id, requests.userId))
    .where(eq(requests.slug, slug))
    .get();
  if (!row) return null;
  const [skillMap, attachments] = await Promise.all([
    skillsFor("request", [row.request.id]),
    db
      .select({ upload: uploads })
      .from(requestAttachments)
      .innerJoin(uploads, eq(uploads.id, requestAttachments.uploadId))
      .where(eq(requestAttachments.requestId, row.request.id))
      .orderBy(asc(requestAttachments.createdAt)),
  ]);
  return {
    ...row.request,
    requesterName: row.requesterName,
    skills: skillMap.get(row.request.id) ?? [],
    attachments: attachments.map((a) => a.upload),
  };
}

export type RequestWithDetails = NonNullable<Awaited<ReturnType<typeof getRequestBySlug>>>;

/** Drafts and removed Requests are visible only to their owner and admins. */
export function canViewRequest(request: Pick<Request, "status" | "userId">, user: User | null): boolean {
  if (request.status === "published" || request.status === "closed") return true;
  if (!user) return false;
  if (user.isAdmin) return true;
  return request.status === "draft" && request.userId === user.id;
}

export async function getRequestSkillIds(requestId: string): Promise<number[]> {
  const rows = await getDb()
    .select({ id: requestSkills.skillId })
    .from(requestSkills)
    .where(eq(requestSkills.requestId, requestId));
  return rows.map((r) => r.id);
}

export async function listInterestsForRequest(requestId: string) {
  const db = getDb();
  const rows = await db
    .select({
      interest: interests,
      profile: specialistProfiles,
      conversationId: conversations.id,
    })
    .from(interests)
    .innerJoin(specialistProfiles, eq(specialistProfiles.id, interests.profileId))
    .leftJoin(conversations, eq(conversations.interestId, interests.id))
    .where(eq(interests.requestId, requestId))
    .orderBy(desc(interests.createdAt));
  const skillMap = await skillsFor("profile", rows.map((r) => r.profile.id));
  return rows.map((r) => ({ ...r, skills: skillMap.get(r.profile.id) ?? [] }));
}

export async function getInterest(requestId: string, specialistUserId: string) {
  const db = getDb();
  return db
    .select({ interest: interests, conversationId: conversations.id })
    .from(interests)
    .leftJoin(conversations, eq(conversations.interestId, interests.id))
    .where(and(eq(interests.requestId, requestId), eq(interests.specialistUserId, specialistUserId)))
    .get();
}

// ---------- Specialists ----------

export type SpecialistFilters = { q?: string; skill?: string; workMode?: string; page?: number };

export async function listPublishedProfiles(filters: SpecialistFilters, limit = PAGE_SIZE) {
  const db = getDb();
  const where: SQL[] = [eq(specialistProfiles.status, "published"), eq(users.status, "active")];
  if (filters.q) {
    where.push(
      or(
        likeEscaped(specialistProfiles.name, filters.q),
        likeEscaped(specialistProfiles.title, filters.q),
        likeEscaped(specialistProfiles.positioning, filters.q),
        likeEscaped(specialistProfiles.about, filters.q),
        likeEscaped(specialistProfiles.helpsWith, filters.q),
      )!,
    );
  }
  if (filters.skill) {
    where.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(specialistSkills)
          .innerJoin(skills, eq(skills.id, specialistSkills.skillId))
          .where(and(eq(specialistSkills.profileId, specialistProfiles.id), eq(skills.slug, filters.skill))),
      ),
    );
  }
  if (filters.workMode === "remote") where.push(ne(specialistProfiles.workMode, "onsite"));
  if (filters.workMode === "onsite") where.push(ne(specialistProfiles.workMode, "remote"));

  const page = Math.max(1, filters.page ?? 1);
  const base = db
    .select({ profile: specialistProfiles })
    .from(specialistProfiles)
    .innerJoin(users, eq(users.id, specialistProfiles.userId))
    .where(and(...where));
  const [rows, [{ total }]] = await Promise.all([
    base.orderBy(desc(specialistProfiles.updatedAt)).limit(limit).offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(specialistProfiles)
      .innerJoin(users, eq(users.id, specialistProfiles.userId))
      .where(and(...where)),
  ]);
  const skillMap = await skillsFor("profile", rows.map((r) => r.profile.id));
  return { rows: rows.map((r) => ({ ...r.profile, skills: skillMap.get(r.profile.id) ?? [] })), total, page };
}

export async function getProfileWithDetails(where: { slug: string } | { userId: string }) {
  const db = getDb();
  const row = await db
    .select({ profile: specialistProfiles, ownerStatus: users.status })
    .from(specialistProfiles)
    .innerJoin(users, eq(users.id, specialistProfiles.userId))
    .where("slug" in where ? eq(specialistProfiles.slug, where.slug) : eq(specialistProfiles.userId, where.userId))
    .get();
  if (!row) return null;
  const [skillMap, portfolio] = await Promise.all([
    skillsFor("profile", [row.profile.id]),
    db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.profileId, row.profile.id))
      .orderBy(asc(portfolioItems.sortOrder), asc(portfolioItems.createdAt)),
  ]);
  return { ...row.profile, ownerStatus: row.ownerStatus, skills: skillMap.get(row.profile.id) ?? [], portfolio };
}

export type ProfileWithDetails = NonNullable<Awaited<ReturnType<typeof getProfileWithDetails>>>;

export function isProfilePublic(p: Pick<ProfileWithDetails, "status" | "ownerStatus">): boolean {
  return p.status === "published" && p.ownerStatus === "active";
}

export async function getOwnProfile(userId: string) {
  return getDb().query.specialistProfiles.findFirst({ where: eq(specialistProfiles.userId, userId) });
}

// ---------- Conversations ----------

/** Returns the conversation only if `user` is one of its two participants (admins may read). */
export async function getConversationForUser(conversationId: string, user: User) {
  const db = getDb();
  const row = await db
    .select({ conversation: conversations, request: requests })
    .from(conversations)
    .innerJoin(requests, eq(requests.id, conversations.requestId))
    .where(eq(conversations.id, conversationId))
    .get();
  if (!row) return null;
  const { conversation } = row;
  const isParticipant = conversation.requesterUserId === user.id || conversation.specialistUserId === user.id;
  if (!isParticipant && !user.isAdmin) return null;
  return { ...row, isParticipant };
}

export async function listConversationsForUser(userId: string) {
  const db = getDb();
  const unread = db
    .select({ conversationId: messages.conversationId, unread: count().as("unread") })
    .from(messages)
    .where(and(isNull(messages.readAt), ne(messages.senderUserId, userId)))
    .groupBy(messages.conversationId)
    .as("unread");

  const rows = await db
    .select({
      conversation: conversations,
      requestTitle: requests.title,
      requestSlug: requests.slug,
      requesterName: users.displayName,
      profileName: specialistProfiles.name,
      profileSlug: specialistProfiles.slug,
      unread: sql<number>`coalesce(${unread.unread}, 0)`,
    })
    .from(conversations)
    .innerJoin(requests, eq(requests.id, conversations.requestId))
    .innerJoin(users, eq(users.id, conversations.requesterUserId))
    .innerJoin(interests, eq(interests.id, conversations.interestId))
    .innerJoin(specialistProfiles, eq(specialistProfiles.id, interests.profileId))
    .leftJoin(unread, eq(unread.conversationId, conversations.id))
    .where(or(eq(conversations.requesterUserId, userId), eq(conversations.specialistUserId, userId)))
    .orderBy(desc(conversations.lastMessageAt));

  return rows.map((r) => {
    const iAmRequester = r.conversation.requesterUserId === userId;
    return {
      ...r,
      iAmRequester,
      otherName: iAmRequester ? r.profileName : r.requesterName,
    };
  });
}

export async function unreadMessageCount(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(
      and(
        isNull(messages.readAt),
        ne(messages.senderUserId, userId),
        or(eq(conversations.requesterUserId, userId), eq(conversations.specialistUserId, userId)),
      ),
    );
  return row?.n ?? 0;
}

// ---------- Homepage ----------

export const HOMEPAGE_MIN_ITEMS = 3;

export async function homepageContent() {
  const [specialists, recentRequests] = await Promise.all([
    listPublishedProfiles({}, 6),
    listPublishedRequests({}),
  ]);
  return {
    specialists: specialists.total >= HOMEPAGE_MIN_ITEMS ? specialists.rows : [],
    requests: recentRequests.total >= HOMEPAGE_MIN_ITEMS ? recentRequests.rows.slice(0, 5) : [],
  };
}

import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch() * 1000)`;
const createdAt = () => integer("created_at", { mode: "timestamp_ms" }).notNull().default(now);
const updatedAt = () => integer("updated_at", { mode: "timestamp_ms" }).notNull().default(now);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
    emailNotifications: integer("email_notifications", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("users_clerk_id_unique").on(t.clerkId),
    index("users_email_idx").on(t.email),
    check("users_status_check", sql`${t.status} in ('active', 'suspended')`),
  ],
);

export const skills = sqliteTable(
  "skills",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("skills_slug_unique").on(t.slug)],
);

export const specialistProfiles = sqliteTable(
  "specialist_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    title: text("title").notNull(),
    positioning: text("positioning").notNull(),
    about: text("about").notNull().default(""),
    helpsWith: text("helps_with").notNull().default(""),
    location: text("location"),
    workMode: text("work_mode", { enum: ["remote", "onsite", "hybrid"] })
      .notNull()
      .default("remote"),
    websiteUrl: text("website_url"),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    status: text("status", { enum: ["draft", "published", "hidden", "removed"] })
      .notNull()
      .default("draft"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("specialist_profiles_user_unique").on(t.userId),
    uniqueIndex("specialist_profiles_slug_unique").on(t.slug),
    index("specialist_profiles_status_idx").on(t.status, t.updatedAt),
    check("specialist_profiles_status_check", sql`${t.status} in ('draft', 'published', 'hidden', 'removed')`),
    check("specialist_profiles_work_mode_check", sql`${t.workMode} in ('remote', 'onsite', 'hybrid')`),
  ],
);

export const specialistSkills = sqliteTable(
  "specialist_skills",
  {
    profileId: text("profile_id")
      .notNull()
      .references(() => specialistProfiles.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.skillId] }), index("specialist_skills_skill_idx").on(t.skillId)],
);

export const uploads = sqliteTable(
  "uploads",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    originalName: text("original_name").notNull(),
    purpose: text("purpose", { enum: ["portfolio", "request_attachment"] }).notNull(),
    visibility: text("visibility", { enum: ["public", "private"] }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("uploads_r2_key_unique").on(t.r2Key),
    index("uploads_owner_idx").on(t.ownerUserId),
    check("uploads_purpose_check", sql`${t.purpose} in ('portfolio', 'request_attachment')`),
    check("uploads_visibility_check", sql`${t.visibility} in ('public', 'private')`),
  ],
);

// `beforeUploadId` is reserved for a later AI-version → finished-version comparison.
export const portfolioItems = sqliteTable(
  "portfolio_items",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => specialistProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    url: text("url"),
    imageUploadId: text("image_upload_id").references(() => uploads.id, { onDelete: "set null" }),
    beforeUploadId: text("before_upload_id").references(() => uploads.id, { onDelete: "set null" }),
    kind: text("kind", { enum: ["example", "before_after"] }).notNull().default("example"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index("portfolio_items_profile_idx").on(t.profileId, t.sortOrder),
    check("portfolio_items_kind_check", sql`${t.kind} in ('example', 'before_after')`),
  ],
);

export const requests = sqliteTable(
  "requests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    aiCreated: text("ai_created").notNull(),
    likes: text("likes").notNull().default(""),
    notRight: text("not_right").notNull(),
    needs: text("needs").notNull(),
    problemTags: text("problem_tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    url: text("url"),
    budget: text("budget"),
    location: text("location"),
    remotePreference: text("remote_preference", { enum: ["remote", "onsite", "either"] })
      .notNull()
      .default("either"),
    status: text("status", { enum: ["draft", "published", "closed", "removed"] })
      .notNull()
      .default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    closedAt: integer("closed_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("requests_slug_unique").on(t.slug),
    index("requests_status_published_idx").on(t.status, t.publishedAt),
    index("requests_user_idx").on(t.userId),
    check("requests_status_check", sql`${t.status} in ('draft', 'published', 'closed', 'removed')`),
    check("requests_remote_check", sql`${t.remotePreference} in ('remote', 'onsite', 'either')`),
  ],
);

export const requestSkills = sqliteTable(
  "request_skills",
  {
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.requestId, t.skillId] }), index("request_skills_skill_idx").on(t.skillId)],
);

export const requestAttachments = sqliteTable(
  "request_attachments",
  {
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    uploadId: text("upload_id")
      .notNull()
      .references(() => uploads.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.requestId, t.uploadId] }), uniqueIndex("request_attachments_upload_unique").on(t.uploadId)],
);

export const interests = sqliteTable(
  "interests",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    specialistUserId: text("specialist_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => specialistProfiles.id, { onDelete: "cascade" }),
    message: text("message").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("interests_request_specialist_unique").on(t.requestId, t.specialistUserId),
    index("interests_specialist_idx").on(t.specialistUserId, t.createdAt),
  ],
);

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    interestId: text("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }),
    requesterUserId: text("requester_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    specialistUserId: text("specialist_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: integer("last_message_at", { mode: "timestamp_ms" }).notNull().default(now),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("conversations_interest_unique").on(t.interestId),
    uniqueIndex("conversations_request_specialist_unique").on(t.requestId, t.specialistUserId),
    index("conversations_requester_idx").on(t.requesterUserId, t.lastMessageAt),
    index("conversations_specialist_idx").on(t.specialistUserId, t.lastMessageAt),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: text("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    removed: integer("removed", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index("messages_conversation_idx").on(t.conversationId, t.createdAt),
    index("messages_unread_idx").on(t.conversationId, t.senderUserId, t.readAt),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["new_interest", "new_message"] }).notNull(),
    entityId: text("entity_id").notNull(),
    emailSentAt: integer("email_sent_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("notifications_user_entity_idx").on(t.userId, t.type, t.entityId, t.createdAt),
    check("notifications_type_check", sql`${t.type} in ('new_interest', 'new_message')`),
  ],
);

export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(),
    reporterUserId: text("reporter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: ["profile", "request", "message"] }).notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["open", "resolved", "dismissed"] }).notNull().default("open"),
    resolvedByUserId: text("resolved_by_user_id").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("reports_status_idx").on(t.status, t.createdAt),
    uniqueIndex("reports_reporter_target_unique").on(t.reporterUserId, t.targetType, t.targetId),
    check("reports_target_type_check", sql`${t.targetType} in ('profile', 'request', 'message')`),
    check("reports_status_check", sql`${t.status} in ('open', 'resolved', 'dismissed')`),
  ],
);

export const adminActions = sqliteTable(
  "admin_actions",
  {
    id: text("id").primaryKey(),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("admin_actions_created_idx").on(t.createdAt)],
);

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: integer("window_start").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id"),
    entityId: text("entity_id"),
    createdAt: createdAt(),
  },
  (t) => [index("analytics_events_name_idx").on(t.name, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type SpecialistProfile = typeof specialistProfiles.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

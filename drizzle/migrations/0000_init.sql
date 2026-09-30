CREATE TABLE `admin_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_user_id` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `admin_actions_created_idx` ON `admin_actions` (`created_at`);--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text,
	`entity_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_name_idx` ON `analytics_events` (`name`,`created_at`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`interest_id` text NOT NULL,
	`requester_user_id` text NOT NULL,
	`specialist_user_id` text NOT NULL,
	`last_message_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`interest_id`) REFERENCES `interests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requester_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`specialist_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversations_interest_unique` ON `conversations` (`interest_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `conversations_request_specialist_unique` ON `conversations` (`request_id`,`specialist_user_id`);--> statement-breakpoint
CREATE INDEX `conversations_requester_idx` ON `conversations` (`requester_user_id`,`last_message_at`);--> statement-breakpoint
CREATE INDEX `conversations_specialist_idx` ON `conversations` (`specialist_user_id`,`last_message_at`);--> statement-breakpoint
CREATE TABLE `interests` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`specialist_user_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`specialist_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `specialist_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interests_request_specialist_unique` ON `interests` (`request_id`,`specialist_user_id`);--> statement-breakpoint
CREATE INDEX `interests_specialist_idx` ON `interests` (`specialist_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_user_id` text NOT NULL,
	`body` text NOT NULL,
	`read_at` integer,
	`removed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_idx` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `messages_unread_idx` ON `messages` (`conversation_id`,`sender_user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`entity_id` text NOT NULL,
	`email_sent_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "notifications_type_check" CHECK("notifications"."type" in ('new_interest', 'new_message'))
);
--> statement-breakpoint
CREATE INDEX `notifications_user_entity_idx` ON `notifications` (`user_id`,`type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `portfolio_items` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`url` text,
	`image_upload_id` text,
	`before_upload_id` text,
	`kind` text DEFAULT 'example' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `specialist_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`before_upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "portfolio_items_kind_check" CHECK("portfolio_items"."kind" in ('example', 'before_after'))
);
--> statement-breakpoint
CREATE INDEX `portfolio_items_profile_idx` ON `portfolio_items` (`profile_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`key`, `window_start`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_user_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolved_by_user_id` text,
	`resolved_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "reports_target_type_check" CHECK("reports"."target_type" in ('profile', 'request', 'message')),
	CONSTRAINT "reports_status_check" CHECK("reports"."status" in ('open', 'resolved', 'dismissed'))
);
--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `reports_reporter_target_unique` ON `reports` (`reporter_user_id`,`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `request_attachments` (
	`request_id` text NOT NULL,
	`upload_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`request_id`, `upload_id`),
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `request_attachments_upload_unique` ON `request_attachments` (`upload_id`);--> statement-breakpoint
CREATE TABLE `request_skills` (
	`request_id` text NOT NULL,
	`skill_id` integer NOT NULL,
	PRIMARY KEY(`request_id`, `skill_id`),
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `request_skills_skill_idx` ON `request_skills` (`skill_id`);--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`ai_created` text NOT NULL,
	`likes` text DEFAULT '' NOT NULL,
	`not_right` text NOT NULL,
	`needs` text NOT NULL,
	`problem_tags` text DEFAULT '[]' NOT NULL,
	`url` text,
	`budget` text,
	`location` text,
	`remote_preference` text DEFAULT 'either' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`closed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "requests_status_check" CHECK("requests"."status" in ('draft', 'published', 'closed', 'removed')),
	CONSTRAINT "requests_remote_check" CHECK("requests"."remote_preference" in ('remote', 'onsite', 'either'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `requests_slug_unique` ON `requests` (`slug`);--> statement-breakpoint
CREATE INDEX `requests_status_published_idx` ON `requests` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `requests_user_idx` ON `requests` (`user_id`);--> statement-breakpoint
CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skills_slug_unique` ON `skills` (`slug`);--> statement-breakpoint
CREATE TABLE `specialist_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`positioning` text NOT NULL,
	`about` text DEFAULT '' NOT NULL,
	`helps_with` text DEFAULT '' NOT NULL,
	`location` text,
	`work_mode` text DEFAULT 'remote' NOT NULL,
	`website_url` text,
	`linkedin_url` text,
	`github_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "specialist_profiles_status_check" CHECK("specialist_profiles"."status" in ('draft', 'published', 'hidden', 'removed')),
	CONSTRAINT "specialist_profiles_work_mode_check" CHECK("specialist_profiles"."work_mode" in ('remote', 'onsite', 'hybrid'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `specialist_profiles_user_unique` ON `specialist_profiles` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `specialist_profiles_slug_unique` ON `specialist_profiles` (`slug`);--> statement-breakpoint
CREATE INDEX `specialist_profiles_status_idx` ON `specialist_profiles` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `specialist_skills` (
	`profile_id` text NOT NULL,
	`skill_id` integer NOT NULL,
	PRIMARY KEY(`profile_id`, `skill_id`),
	FOREIGN KEY (`profile_id`) REFERENCES `specialist_profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `specialist_skills_skill_idx` ON `specialist_skills` (`skill_id`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`original_name` text NOT NULL,
	`purpose` text NOT NULL,
	`visibility` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "uploads_purpose_check" CHECK("uploads"."purpose" in ('portfolio', 'request_attachment')),
	CONSTRAINT "uploads_visibility_check" CHECK("uploads"."visibility" in ('public', 'private'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uploads_r2_key_unique` ON `uploads` (`r2_key`);--> statement-breakpoint
CREATE INDEX `uploads_owner_idx` ON `uploads` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`clerk_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`email_notifications` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "users_status_check" CHECK("users"."status" in ('active', 'suspended'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_id_unique` ON `users` (`clerk_id`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);
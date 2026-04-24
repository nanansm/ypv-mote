CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password_hash` text,
	`role` text DEFAULT 'admin' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `ai_analyses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`submission_id` text NOT NULL,
	`model` text NOT NULL,
	`prompt` text NOT NULL,
	`response` text NOT NULL,
	`score` integer,
	`summary` text,
	`created_at` text NOT NULL,
	`created_by` text
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `eligibility_config` (
	`id` integer PRIMARY KEY NOT NULL,
	`valid_countries` text NOT NULL,
	`default_age_min` integer NOT NULL,
	`default_age_max` integer NOT NULL,
	`country_age_overrides` text NOT NULL,
	`require_vocational_training` integer NOT NULL,
	`require_field_interest` integer NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`submission_id` text,
	`template_key` text NOT NULL,
	`to_email` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`subject` text NOT NULL,
	`body_text` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_templates_key_unique` ON `email_templates` (`key`);--> statement-breakpoint
CREATE TABLE `form_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`type` text NOT NULL,
	`section` integer NOT NULL,
	`order` integer NOT NULL,
	`required` integer DEFAULT 1 NOT NULL,
	`is_eligibility_gate` integer DEFAULT 0 NOT NULL,
	`validation_rule` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `form_questions_key_unique` ON `form_questions` (`key`);--> statement-breakpoint
CREATE TABLE `legal_page_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`body_markdown` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legal_page_translations_page_locale` ON `legal_page_translations` (`page_id`,`locale`);--> statement-breakpoint
CREATE TABLE `legal_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legal_pages_slug_unique` ON `legal_pages` (`slug`);--> statement-breakpoint
CREATE TABLE `question_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`value` text NOT NULL,
	`order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `question_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer,
	`option_id` integer,
	`locale` text NOT NULL,
	`label` text NOT NULL,
	`placeholder` text,
	`help_text` text
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`full_name` text,
	`email` text,
	`phone` text,
	`country` text,
	`date_of_birth` text,
	`age_at_submission` integer,
	`vocational_training_completed` integer,
	`interested_in_field` integer,
	`english_level` text,
	`worked_abroad` integer,
	`has_passport` text,
	`professional_experience` text,
	`diploma_in_english` integer,
	`current_location` text,
	`eligibility_status` text NOT NULL,
	`rejection_reason_key` text,
	`rejection_reason_details` text,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`payment_verified_at` text,
	`payment_verified_by` text,
	`email_sent_at` text,
	`sheet_synced_at` text,
	`admin_notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`submission_id` text NOT NULL,
	`service` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL
);

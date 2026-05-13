CREATE TABLE `review_rate_limits` (
	`ip` text PRIMARY KEY NOT NULL,
	`last_submitted_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_email_unique` ON `reviews` (`email`);--> statement-breakpoint
CREATE INDEX `reviews_status` ON `reviews` (`status`);--> statement-breakpoint
CREATE INDEX `reviews_created_at` ON `reviews` (`created_at`);
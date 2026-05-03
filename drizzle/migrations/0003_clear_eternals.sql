CREATE TABLE `session_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`session_id` text NOT NULL,
	`booking_reference` text NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`expires_at` text,
	`paid_at` text,
	`confirmed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_bookings_booking_reference_unique` ON `session_bookings` (`booking_reference`);--> statement-breakpoint
CREATE INDEX `session_bookings_session_id` ON `session_bookings` (`session_id`);--> statement-breakpoint
CREATE INDEX `session_bookings_expires_at` ON `session_bookings` (`expires_at`);--> statement-breakpoint
CREATE INDEX `session_bookings_submission_id` ON `session_bookings` (`submission_id`);--> statement-breakpoint
CREATE TABLE `webinar_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`duration_minutes` integer DEFAULT 120 NOT NULL,
	`capacity` integer DEFAULT 50 NOT NULL,
	`price_usd` real NOT NULL,
	`zoom_link` text,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `webinar_sessions_status_date` ON `webinar_sessions` (`status`,`date`);
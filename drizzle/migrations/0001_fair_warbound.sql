ALTER TABLE `admin_users` ADD `must_change_password` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `sync_logs` ADD `action` text DEFAULT 'initial' NOT NULL;
CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`display_name` text NOT NULL,
	`currency_label` text NOT NULL,
	`preset` text NOT NULL,
	`fields` text DEFAULT '{}' NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`is_default_for_indonesia` integer DEFAULT 0 NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_methods_key_unique` ON `payment_methods` (`key`);--> statement-breakpoint
CREATE INDEX `payment_methods_order` ON `payment_methods` (`order_index`);
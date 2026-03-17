CREATE TABLE `password_reset_tokens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_hash_idx` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`key_name` varchar(100) NOT NULL,
	`name` varchar(191) NOT NULL,
	`description` text,
	`is_system` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_key_idx` UNIQUE(`key_name`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`email` varchar(191) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` varchar(100) NOT NULL DEFAULT 'manager',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `vault_assets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`order_id` varchar(100) NOT NULL,
	`customer_id` int NOT NULL DEFAULT 0,
	`uploader_id` bigint unsigned NOT NULL,
	`file_url` varchar(500) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`mime_type` varchar(150) NOT NULL,
	`file_size` int NOT NULL DEFAULT 0,
	`requires_approval` boolean NOT NULL DEFAULT false,
	`approval_status` varchar(32) NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vault_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vault_comments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`asset_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`comment` text NOT NULL,
	`reply_to_id` bigint unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vault_comments_id` PRIMARY KEY(`id`)
);

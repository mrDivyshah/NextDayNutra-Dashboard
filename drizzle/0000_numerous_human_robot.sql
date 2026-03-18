CREATE TABLE `notifications` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`type` varchar(50) NOT NULL DEFAULT 'comment',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`order_id` varchar(100),
	`asset_id` bigint unsigned,
	`from_user_id` bigint unsigned,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_read_status` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`order_id` varchar(100) NOT NULL,
	`last_read_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_read_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`phone` varchar(50),
	`company_name` varchar(191),
	`address_line1` varchar(255),
	`address_line2` varchar(255),
	`city` varchar(100),
	`state` varchar(100),
	`zip` varchar(20),
	`country` varchar(100),
	`account_manager_id` bigint unsigned,
	`redirect_url` varchar(500),
	`additional_access` text,
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
	`file_url` text NOT NULL,
	`file_path` text NOT NULL,
	`file_name` text NOT NULL,
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

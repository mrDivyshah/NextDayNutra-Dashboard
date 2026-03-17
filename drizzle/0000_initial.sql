CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key_name` varchar(100) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text NULL,
  `is_system` boolean NOT NULL DEFAULT true,
  `created_at` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_key_idx` (`key_name`)
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(100) NOT NULL DEFAULT 'manager',
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` datetime NOT NULL DEFAULT current_timestamp,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp ON UPDATE current_timestamp,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_idx` (`email`)
);

CREATE TABLE IF NOT EXISTS `vault_assets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
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
  `created_at` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `vault_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `asset_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `comment` text NOT NULL,
  `reply_to_id` bigint unsigned NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_reset_tokens_token_hash_idx` (`token_hash`)
);

INSERT INTO `roles` (`key_name`, `name`, `description`, `is_system`)
VALUES
  ('super_admin', 'Super Admin', 'Full access to all users and site settings.', true),
  ('administrator', 'Administrator', 'Administrative access to the dashboard.', true),
  ('account_manager', 'Account Manager', 'Manages customer accounts.', true),
  ('customer_agent', 'Customer Agent', 'Supports customer operations.', true),
  ('agent', 'Agent', 'General agent access.', true),
  ('executive', 'Executive', 'Executive reporting access.', true),
  ('customer_team', 'Customer Team', 'Team member account for customer operations.', true),
  ('client', 'Client', 'Client-facing account.', true),
  ('shop_manager', 'Shop manager', 'Commerce and store management role.', true),
  ('customer', 'Customer', 'Customer portal access.', true),
  ('subscriber', 'Subscriber', 'Basic subscribed user.', true),
  ('contributor', 'Contributor', 'Contributor access.', true),
  ('author', 'Author', 'Author access.', true),
  ('editor', 'Editor', 'Editor access.', true),
  ('manager', 'Manager', 'Default dashboard manager role.', true)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `is_system` = VALUES(`is_system`);

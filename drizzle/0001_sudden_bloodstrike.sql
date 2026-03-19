ALTER TABLE `users` MODIFY COLUMN `email` varchar(191);--> statement-breakpoint
ALTER TABLE `roles` ADD `redirect_url` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `jira_id` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_jira_idx` UNIQUE(`jira_id`);
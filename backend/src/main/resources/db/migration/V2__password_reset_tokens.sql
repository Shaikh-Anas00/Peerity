-- V2__password_reset_tokens.sql
--
-- Adds the password_reset_tokens table backing the self-service "forgot password" flow
-- (PasswordResetToken entity / PasswordResetService). Only the SHA-256 hash of each token
-- is stored, never the raw token — mirrors how user passwords are stored as hashes, not
-- plaintext. Captured from the live entity mapping the same way V1 was: Hibernate
-- ddl-auto=update against a scratch database, then dumped — not hand-typed.
CREATE TABLE `password_reset_tokens` (
  `id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `used` bit(1) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reset_token_hash` (`token_hash`),
  KEY `idx_reset_token_user` (`user_id`),
  CONSTRAINT `FKk3ndxg5xp6v7wd4gjyusp15gq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

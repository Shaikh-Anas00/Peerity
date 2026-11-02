-- V1__baseline.sql
--
-- Baseline schema for Peerity/TrustReview, captured from the live entity mappings
-- (Hibernate ddl-auto=create against MySQL 8.0, via FileCryptoServiceTest-style scratch DB)
-- as of the P2.3 Flyway migration. This is the schema Hibernate had been managing via
-- ddl-auto=update up to this point; from here on, all schema changes go through new
-- V{n}__*.sql files instead.
--
-- FK_CHECKS disabled because table creation order below is not topologically sorted
-- (several tables reference one another in both directions, e.g. appeals <-> reviews).
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `users` (
  `consent_agreed` bit(1) NOT NULL,
  `data_deletion_requested` bit(1) NOT NULL,
  `data_export_requested` bit(1) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `notify_deadline_approaching` bit(1) NOT NULL,
  `notify_dispute_status_change` bit(1) NOT NULL,
  `notify_new_review` bit(1) NOT NULL,
  `consent_agreed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `id` varchar(36) NOT NULL,
  `data_request_status` varchar(50) NOT NULL,
  `timezone` varchar(50) NOT NULL,
  `academic_standing` varchar(100) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `department` varchar(150) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `institution` varchar(150) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','COMMITTEE','INSTRUCTOR','STUDENT') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `assignments` (
  `created_at` datetime(6) NOT NULL,
  `deadline` datetime(6) NOT NULL,
  `review_deadline` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by_id` varchar(36) NOT NULL,
  `id` varchar(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `rubric_criteria` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_assignment_created_by` (`created_by_id`),
  CONSTRAINT `FKdst5f4lsfa0i7otgo3t2s87n4` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `submissions` (
  `created_at` datetime(6) NOT NULL,
  `submitted_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `status` varchar(30) NOT NULL,
  `assignment_id` varchar(36) NOT NULL,
  `author_id` varchar(36) NOT NULL,
  `id` varchar(36) NOT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `file_hash` varchar(64) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `original_file_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_submission_author` (`author_id`),
  KEY `idx_submission_assignment` (`assignment_id`),
  CONSTRAINT `FKrirbb44savy2g7nws0hoxs949` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`),
  CONSTRAINT `FKt1hsmqchlip0tos1ai8ahnrtp` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reviews` (
  `created_at` datetime(6) NOT NULL,
  `submitted_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `status` varchar(20) NOT NULL,
  `id` varchar(36) NOT NULL,
  `reviewer_id` varchar(36) NOT NULL,
  `submission_id` varchar(36) NOT NULL,
  `reviewer_pseudonym` varchar(50) NOT NULL,
  `answers` text DEFAULT NULL,
  `feedback_text` text DEFAULT NULL,
  `scores` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_review_reviewer` (`reviewer_id`),
  KEY `idx_review_submission` (`submission_id`),
  CONSTRAINT `FK8g0ybaucm73dt9g8ut6kg9cce` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`),
  CONSTRAINT `FKd1isgfajhtdl8mgg29up6mofi` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `review_ratings` (
  `is_helpful` bit(1) NOT NULL,
  `rating` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `author_id` varchar(36) NOT NULL,
  `id` varchar(36) NOT NULL,
  `review_id` varchar(36) NOT NULL,
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rating_review` (`review_id`),
  KEY `idx_rating_author` (`author_id`),
  KEY `idx_rating_review` (`review_id`),
  CONSTRAINT `FKj2jr27e515r318vj8ltdotqhk` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`),
  CONSTRAINT `FKsretx1x6jqooiu38xm76cy7dv` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `appeals` (
  `created_at` datetime(6) NOT NULL,
  `resolved_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `appellant_id` varchar(36) NOT NULL,
  `id` varchar(36) NOT NULL,
  `review_id` varchar(36) NOT NULL,
  `evidence_file_path` varchar(500) DEFAULT NULL,
  `resolution` text DEFAULT NULL,
  `statement` text NOT NULL,
  `reason` enum('FACTUAL_FABRICATION','HARASSMENT_OR_ABUSE','PROCEDURAL_ERROR','UNFAIR_GRADING_OUTLIER') NOT NULL,
  `status` enum('RESOLVED_DISMISSED','RESOLVED_UPHELD','SUBMITTED','UNDER_INVESTIGATION') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_appeal_review` (`review_id`),
  KEY `idx_appeal_appellant` (`appellant_id`),
  CONSTRAINT `FKk1spkpmvyhat0esy20jttloi0` FOREIGN KEY (`appellant_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKpm77dpkfmfjj3anj6npl7ie3y` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `disclosure_requests` (
  `threshold_required` int(11) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `appeal_id` varchar(36) NOT NULL,
  `id` varchar(36) NOT NULL,
  `justification` text DEFAULT NULL,
  `recommended_level` enum('LEVEL_0_ANONYMOUS','LEVEL_1_ELIGIBILITY','LEVEL_2_INSTITUTION_DEPT','LEVEL_3_ACADEMIC_STANDING','LEVEL_4_FULL_IDENTITY') NOT NULL,
  `requested_level` enum('LEVEL_0_ANONYMOUS','LEVEL_1_ELIGIBILITY','LEVEL_2_INSTITUTION_DEPT','LEVEL_3_ACADEMIC_STANDING','LEVEL_4_FULL_IDENTITY') NOT NULL,
  `status` enum('APPROVED','PENDING_APPROVAL','REJECTED') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKq2m7hpycjavx1djetry00qdum` (`appeal_id`),
  CONSTRAINT `FK27pdy1kgxs6m1dvk8q83i0141` FOREIGN KEY (`appeal_id`) REFERENCES `appeals` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `disclosure_approvals` (
  `voted_at` datetime(6) NOT NULL,
  `committee_member_id` varchar(36) NOT NULL,
  `disclosure_request_id` varchar(36) NOT NULL,
  `id` varchar(36) NOT NULL,
  `rationale` text NOT NULL,
  `decision` enum('APPROVE','REJECT') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_request_member_vote` (`disclosure_request_id`,`committee_member_id`),
  KEY `FKo811waic8hdcjm7iig12e41d6` (`committee_member_id`),
  CONSTRAINT `FKi0aoaue0dapgj1cvalhdydjwp` FOREIGN KEY (`disclosure_request_id`) REFERENCES `disclosure_requests` (`id`),
  CONSTRAINT `FKo811waic8hdcjm7iig12e41d6` FOREIGN KEY (`committee_member_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `calibration_samples` (
  `created_at` datetime(6) NOT NULL,
  `assignment_id` varchar(36) DEFAULT NULL,
  `created_by_id` varchar(36) DEFAULT NULL,
  `id` varchar(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `expert_feedback` text DEFAULT NULL,
  `expert_scores` text NOT NULL,
  `sample_content` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cal_sample_assignment` (`assignment_id`),
  KEY `FKloa496123cx67e1glqsv8882c` (`created_by_id`),
  CONSTRAINT `FK54awbensm2iv38n1iagaevc07` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`),
  CONSTRAINT `FKloa496123cx67e1glqsv8882c` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `calibration_scores` (
  `accuracy_percentage` double NOT NULL,
  `mean_absolute_error` double NOT NULL,
  `evaluated_at` datetime(6) NOT NULL,
  `id` varchar(36) NOT NULL,
  `sample_id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `student_rationale` text DEFAULT NULL,
  `student_scores` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sample_student` (`sample_id`,`student_id`),
  KEY `idx_cal_score_student` (`student_id`),
  CONSTRAINT `FKbwekpchp28ubfw4tcco3q5p8n` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKp9pevap9pb6r0s9i8gsap02l7` FOREIGN KEY (`sample_id`) REFERENCES `calibration_samples` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `study_groups` (
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `assignment_id` varchar(36) DEFAULT NULL,
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('ACTIVE','CLOSED','FORMING') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmf9o1ixb2wdfbjx0dhplmrkv9` (`assignment_id`),
  CONSTRAINT `FKmf9o1ixb2wdfbjx0dhplmrkv9` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `group_memberships` (
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `group_id` varchar(36) NOT NULL,
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('LEADER','MEMBER') NOT NULL,
  `status` enum('ACTIVE','PENDING','REMOVED') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9a30xs54cckm2r9pcvjlo5odo` (`group_id`),
  KEY `FKlq7o99bv8w6paut0ih5yhboia` (`user_id`),
  CONSTRAINT `FK9a30xs54cckm2r9pcvjlo5odo` FOREIGN KEY (`group_id`) REFERENCES `study_groups` (`id`),
  CONSTRAINT `FKlq7o99bv8w6paut0ih5yhboia` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `group_member_evaluations` (
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `evaluatee_id` varchar(36) NOT NULL,
  `evaluator_id` varchar(36) NOT NULL,
  `group_id` varchar(36) NOT NULL,
  `id` varchar(36) NOT NULL,
  `feedback` text DEFAULT NULL,
  `scores` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjv3uqsx8a6mg43p496ir8g04w` (`evaluatee_id`),
  KEY `FK222vgjj84pse6hupnm95jxsac` (`evaluator_id`),
  KEY `FK38jcl7pn03jpycprx8qmb2awy` (`group_id`),
  CONSTRAINT `FK222vgjj84pse6hupnm95jxsac` FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK38jcl7pn03jpycprx8qmb2awy` FOREIGN KEY (`group_id`) REFERENCES `study_groups` (`id`),
  CONSTRAINT `FKjv3uqsx8a6mg43p496ir8g04w` FOREIGN KEY (`evaluatee_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `group_formation_surveys` (
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `assignment_id` varchar(36) NOT NULL,
  `id` varchar(36) NOT NULL,
  `questions` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmiel9tm5kbrung6v3tlrrtgo6` (`assignment_id`),
  CONSTRAINT `FKmiel9tm5kbrung6v3tlrrtgo6` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `group_formation_responses` (
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `id` varchar(36) NOT NULL,
  `survey_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `responses` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKsd7gctb84iky43qlb55wacdi5` (`survey_id`),
  KEY `FKighicm80jk7m1xlv79esd7rql` (`user_id`),
  CONSTRAINT `FKighicm80jk7m1xlv79esd7rql` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKsd7gctb84iky43qlb55wacdi5` FOREIGN KEY (`survey_id`) REFERENCES `group_formation_surveys` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `rubric_templates` (
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `criteria_json` text NOT NULL,
  `category` enum('CODING','CUSTOM','ESSAY','PRESENTATION') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rubric_template_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `audit_logs` (
  `sequence_number` bigint(20) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `id` varchar(36) NOT NULL,
  `target_id` varchar(36) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `current_entry_hash` varchar(64) NOT NULL,
  `payload_hash` varchar(64) NOT NULL,
  `previous_entry_hash` varchar(64) NOT NULL,
  `action` varchar(100) NOT NULL,
  `target_entity` varchar(100) DEFAULT NULL,
  `actor_email` varchar(150) DEFAULT NULL,
  `details` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_audit_log_sequence` (`sequence_number`),
  UNIQUE KEY `idx_audit_seq` (`sequence_number`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_actor` (`actor_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Spring Session JDBC tables (normally created by spring-session-jdbc's own schema
-- initializer when spring.session.jdbc.initialize-schema=always; included here so
-- Flyway owns the full schema and that initializer can be set to "never" everywhere).
--
-- Table names are UPPERCASE to exactly match spring.session.jdbc.table-name=SPRING_SESSION
-- (application.properties) and Spring Session JDBC's own default schema convention. MySQL's
-- lower_case_table_names defaults to 0 (case-SENSITIVE) on Linux — only case-insensitive
-- platforms (Windows, and macOS by default) would have tolerated a casing mismatch here.
CREATE TABLE `SPRING_SESSION` (
  `PRIMARY_ID` char(36) NOT NULL,
  `SESSION_ID` char(36) NOT NULL,
  `CREATION_TIME` bigint(20) NOT NULL,
  `LAST_ACCESS_TIME` bigint(20) NOT NULL,
  `MAX_INACTIVE_INTERVAL` int(11) NOT NULL,
  `EXPIRY_TIME` bigint(20) NOT NULL,
  `PRINCIPAL_NAME` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`PRIMARY_ID`),
  UNIQUE KEY `SPRING_SESSION_IX1` (`SESSION_ID`),
  KEY `SPRING_SESSION_IX2` (`EXPIRY_TIME`),
  KEY `SPRING_SESSION_IX3` (`PRINCIPAL_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

CREATE TABLE `SPRING_SESSION_ATTRIBUTES` (
  `SESSION_PRIMARY_ID` char(36) NOT NULL,
  `ATTRIBUTE_NAME` varchar(200) NOT NULL,
  `ATTRIBUTE_BYTES` blob NOT NULL,
  PRIMARY KEY (`SESSION_PRIMARY_ID`,`ATTRIBUTE_NAME`),
  CONSTRAINT `SPRING_SESSION_ATTRIBUTES_FK` FOREIGN KEY (`SESSION_PRIMARY_ID`) REFERENCES `SPRING_SESSION` (`PRIMARY_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;

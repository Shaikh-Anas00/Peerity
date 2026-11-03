-- =============================================================================
-- V3__course_rooms.sql
-- Lightweight Google Classroom-style Course Rooms & Join Codes
-- Compatible with MySQL 8.0 and H2 (test profile)
-- =============================================================================

CREATE TABLE IF NOT EXISTS course_rooms (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    join_code VARCHAR(12) NOT NULL UNIQUE,
    instructor_id VARCHAR(36) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_course_room_instructor FOREIGN KEY (instructor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS course_room_enrollments (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    course_room_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    enrolled_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_room_student UNIQUE (course_room_id, student_id),
    CONSTRAINT fk_enrollment_room FOREIGN KEY (course_room_id) REFERENCES course_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_course_room_join_code ON course_rooms (join_code);
CREATE INDEX idx_course_room_instructor ON course_rooms (instructor_id);
CREATE INDEX idx_enrollment_student ON course_room_enrollments (student_id);

ALTER TABLE submissions ADD COLUMN course_room_id VARCHAR(36) NULL;
ALTER TABLE submissions ADD CONSTRAINT fk_submission_course_room FOREIGN KEY (course_room_id) REFERENCES course_rooms(id);

ALTER TABLE study_groups ADD COLUMN course_room_id VARCHAR(36) NULL;
ALTER TABLE study_groups ADD CONSTRAINT fk_group_course_room FOREIGN KEY (course_room_id) REFERENCES course_rooms(id);

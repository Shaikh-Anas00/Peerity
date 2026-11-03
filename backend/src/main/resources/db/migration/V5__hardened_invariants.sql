-- V5: Hardened Architectural Invariants
-- 1. Enrollment status tracking (ACTIVE/REMOVED)
ALTER TABLE course_room_enrollments 
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX idx_enrollment_status 
    ON course_room_enrollments (course_room_id, status);

-- 2. Per-(student, assignment) pseudonym persistence
CREATE TABLE IF NOT EXISTS assignment_pseudonyms (
    id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    assignment_id VARCHAR(36) NOT NULL,
    pseudonym VARCHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_assignment_pseudonyms PRIMARY KEY (id),
    CONSTRAINT uk_student_assignment_pseudo UNIQUE (student_id, assignment_id),
    CONSTRAINT fk_pseudo_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_pseudo_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id)
);

CREATE INDEX idx_pseudo_student ON assignment_pseudonyms (student_id);
CREATE INDEX idx_pseudo_assignment ON assignment_pseudonyms (assignment_id);

-- 3. Group assignment flag
ALTER TABLE assignments 
    ADD COLUMN is_group_assignment BOOLEAN NOT NULL DEFAULT FALSE;

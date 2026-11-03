-- =============================================================================
-- V4__classroom_assignments.sql
-- Room-scoped classroom assignments and review isolation
-- Compatible with MySQL 8.0 and H2 (test profile)
-- =============================================================================

ALTER TABLE assignments ADD COLUMN course_room_id VARCHAR(36) NULL;
ALTER TABLE assignments ADD CONSTRAINT fk_assignment_course_room FOREIGN KEY (course_room_id) REFERENCES course_rooms(id);
CREATE INDEX idx_assignment_course_room ON assignments (course_room_id);

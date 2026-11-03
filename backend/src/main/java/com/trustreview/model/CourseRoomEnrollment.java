package com.trustreview.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.trustreview.model.EnrollmentStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "course_room_enrollments", uniqueConstraints = {
    @UniqueConstraint(name = "uk_room_student", columnNames = {"course_room_id", "student_id"})
}, indexes = {
    @Index(name = "idx_enrollment_student", columnList = "student_id")
})
public class CourseRoomEnrollment {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_room_id", nullable = false)
    private CourseRoom courseRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private LocalDateTime enrolledAt;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    public CourseRoomEnrollment() {
        this.id = UUID.randomUUID().toString();
    }

    public CourseRoomEnrollment(CourseRoom courseRoom, User student) {
        this.id = UUID.randomUUID().toString();
        this.courseRoom = courseRoom;
        this.student = student;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.enrolledAt == null) {
            this.enrolledAt = LocalDateTime.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public CourseRoom getCourseRoom() {
        return courseRoom;
    }

    public void setCourseRoom(CourseRoom courseRoom) {
        this.courseRoom = courseRoom;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    public EnrollmentStatus getStatus() { return status; }
    public void setStatus(EnrollmentStatus status) { this.status = status; }
}

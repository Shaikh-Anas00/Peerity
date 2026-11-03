package com.trustreview.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "course_rooms", indexes = {
    @Index(name = "idx_course_room_join_code", columnList = "join_code", unique = true),
    @Index(name = "idx_course_room_instructor", columnList = "instructor_id")
})
public class CourseRoom {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "course_code", nullable = false, length = 50)
    private String courseCode;

    @Column(length = 500)
    private String description;

    @Column(name = "join_code", nullable = false, unique = true, length = 12)
    private String joinCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    @Column(nullable = false)
    private boolean active = true;

    @JsonIgnore
    @OneToMany(mappedBy = "courseRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CourseRoomEnrollment> enrollments = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public CourseRoom() {
        this.id = UUID.randomUUID().toString();
    }

    public CourseRoom(String name, String courseCode, String description, String joinCode, User instructor) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.courseCode = courseCode;
        this.description = description;
        this.joinCode = joinCode;
        this.instructor = instructor;
        this.active = true;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getJoinCode() {
        return joinCode;
    }

    public void setJoinCode(String joinCode) {
        this.joinCode = joinCode;
    }

    public User getInstructor() {
        return instructor;
    }

    public void setInstructor(User instructor) {
        this.instructor = instructor;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<CourseRoomEnrollment> getEnrollments() {
        return enrollments;
    }

    public void setEnrollments(List<CourseRoomEnrollment> enrollments) {
        this.enrollments = enrollments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

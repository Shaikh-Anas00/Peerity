package com.trustreview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Persists a stable per-(student, assignment) pseudonym so the same student
 * always receives the same alias within one assignment, but different aliases
 * across different assignments — preventing longitudinal correlation.
 */
@Entity
@Table(name = "assignment_pseudonyms", uniqueConstraints = {
    @UniqueConstraint(name = "uk_student_assignment_pseudo", columnNames = {"student_id", "assignment_id"})
}, indexes = {
    @Index(name = "idx_pseudo_student", columnList = "student_id"),
    @Index(name = "idx_pseudo_assignment", columnList = "assignment_id")
})
public class AssignmentPseudonym {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(nullable = false, length = 64)
    private String pseudonym;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AssignmentPseudonym() {
        this.id = UUID.randomUUID().toString();
    }

    public AssignmentPseudonym(User student, Assignment assignment, String pseudonym) {
        this.id = UUID.randomUUID().toString();
        this.student = student;
        this.assignment = assignment;
        this.pseudonym = pseudonym;
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

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }
    public String getPseudonym() { return pseudonym; }
    public void setPseudonym(String pseudonym) { this.pseudonym = pseudonym; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

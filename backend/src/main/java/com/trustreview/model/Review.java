package com.trustreview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_review_reviewer", columnList = "reviewer_id"),
    @Index(name = "idx_review_submission", columnList = "submission_id")
})
public class Review {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    /** e.g. "Reviewer-A3" � shown to author instead of real name */
    @Column(name = "reviewer_pseudonym", nullable = false, length = 50)
    private String reviewerPseudonym;

    /**
     * JSON map of criterion->score e.g. {"Code Quality":8,"Documentation":7}
     * null until review is submitted.
     */
    @Column(columnDefinition = "TEXT")
    private String scores;

    /**
     * JSON map of criterion->list of chosen option values (1-5), only for QUESTION_BASED criteria,
     * e.g. {"Code Quality":[4,5]}. Null for rubrics with only level-based criteria.
     */
    @Column(columnDefinition = "TEXT")
    private String answers;

    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    /** PENDING or COMPLETED */
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Review() { this.id = UUID.randomUUID().toString(); }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Submission getSubmission() { return submission; }
    public void setSubmission(Submission submission) { this.submission = submission; }
    public User getReviewer() { return reviewer; }
    public void setReviewer(User reviewer) { this.reviewer = reviewer; }
    public String getReviewerPseudonym() { return reviewerPseudonym; }
    public void setReviewerPseudonym(String reviewerPseudonym) { this.reviewerPseudonym = reviewerPseudonym; }
    public String getScores() { return scores; }
    public void setScores(String scores) { this.scores = scores; }
    public String getAnswers() { return answers; }
    public void setAnswers(String answers) { this.answers = answers; }
    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) { this.feedbackText = feedbackText; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

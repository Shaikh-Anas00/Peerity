package com.trustreview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "calibration_samples", indexes = {
    @Index(name = "idx_cal_sample_assignment", columnList = "assignment_id")
})
public class CalibrationSample {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private Assignment assignment;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "sample_content", columnDefinition = "LONGTEXT", nullable = false)
    private String sampleContent;

    /**
     * Gold-standard reference scores from the instructor.
     * JSON map of criterion -> score, e.g. {"Code Quality": 8, "Documentation": 7}
     */
    @Column(name = "expert_scores", columnDefinition = "TEXT", nullable = false)
    private String expertScores;

    @Column(name = "expert_feedback", columnDefinition = "TEXT")
    private String expertFeedback;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public CalibrationSample() {
        this.id = UUID.randomUUID().toString();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSampleContent() { return sampleContent; }
    public void setSampleContent(String sampleContent) { this.sampleContent = sampleContent; }
    public String getExpertScores() { return expertScores; }
    public void setExpertScores(String expertScores) { this.expertScores = expertScores; }
    public String getExpertFeedback() { return expertFeedback; }
    public void setExpertFeedback(String expertFeedback) { this.expertFeedback = expertFeedback; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

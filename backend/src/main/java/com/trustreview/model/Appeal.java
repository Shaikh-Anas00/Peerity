package com.trustreview.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "appeals", indexes = {
    @Index(name = "idx_appeal_review", columnList = "review_id", unique = true),
    @Index(name = "idx_appeal_appellant", columnList = "appellant_id")
})
public class Appeal {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false, unique = true)
    private Review review;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appellant_id", nullable = false)
    private User appellant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AppealReason reason;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String statement;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private AppealStatus status = AppealStatus.SUBMITTED;

    @Column(name = "evidence_file_path", length = 500)
    private String evidenceFilePath;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @OneToOne(mappedBy = "appeal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private DisclosureRequest disclosureRequest;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Appeal() {
        this.id = UUID.randomUUID().toString();
    }

    public Appeal(Review review, User appellant, AppealReason reason, String statement) {
        this.id = UUID.randomUUID().toString();
        this.review = review;
        this.appellant = appellant;
        this.reason = reason;
        this.statement = statement;
        this.status = AppealStatus.SUBMITTED;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Review getReview() {
        return review;
    }

    public void setReview(Review review) {
        this.review = review;
    }

    public User getAppellant() {
        return appellant;
    }

    public void setAppellant(User appellant) {
        this.appellant = appellant;
    }

    public AppealReason getReason() {
        return reason;
    }

    public void setReason(AppealReason reason) {
        this.reason = reason;
    }

    public String getStatement() {
        return statement;
    }

    public void setStatement(String statement) {
        this.statement = statement;
    }

    public AppealStatus getStatus() {
        return status;
    }

    public void setStatus(AppealStatus status) {
        this.status = status;
    }

    public String getEvidenceFilePath() {
        return evidenceFilePath;
    }

    public void setEvidenceFilePath(String evidenceFilePath) {
        this.evidenceFilePath = evidenceFilePath;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public DisclosureRequest getDisclosureRequest() {
        return disclosureRequest;
    }

    public void setDisclosureRequest(DisclosureRequest disclosureRequest) {
        this.disclosureRequest = disclosureRequest;
        if (disclosureRequest != null) {
            disclosureRequest.setAppeal(this);
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
package com.trustreview.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "disclosure_requests")
public class DisclosureRequest {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appeal_id", nullable = false, unique = true)
    private Appeal appeal;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_level", nullable = false, length = 30)
    private DisclosureLevel requestedLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommended_level", nullable = false, length = 30)
    private DisclosureLevel recommendedLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DisclosureStatus status = DisclosureStatus.PENDING_APPROVAL;

    @Column(columnDefinition = "TEXT")
    private String justification;

    /**
     * Number of APPROVE votes required to transition status to APPROVED.
     * Default is 2 (majority of a 3-member committee panel).
     */
    @Column(name = "threshold_required", nullable = false)
    private int thresholdRequired = 2;

    @OneToMany(mappedBy = "disclosureRequest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DisclosureApproval> approvals = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public DisclosureRequest() {
        this.id = UUID.randomUUID().toString();
    }

    public DisclosureRequest(Appeal appeal, DisclosureLevel requestedLevel, DisclosureLevel recommendedLevel, String justification) {
        this.id = UUID.randomUUID().toString();
        this.appeal = appeal;
        this.requestedLevel = requestedLevel;
        this.recommendedLevel = recommendedLevel;
        this.justification = justification;
        this.status = DisclosureStatus.PENDING_APPROVAL;
        this.thresholdRequired = 2;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
    }

    // ── Quorum helpers ──────────────────────────────────────────────────────────

    /**
     * Counts APPROVE votes already cast for this request.
     */
    public long getApproveCount() {
        return approvals.stream()
                .filter(a -> a.getDecision() == VoteDecision.APPROVE)
                .count();
    }

    /**
     * Counts REJECT votes already cast for this request.
     */
    public long getRejectCount() {
        return approvals.stream()
                .filter(a -> a.getDecision() == VoteDecision.REJECT)
                .count();
    }

    // ── Getters and setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Appeal getAppeal() { return appeal; }
    public void setAppeal(Appeal appeal) { this.appeal = appeal; }

    public DisclosureLevel getRequestedLevel() { return requestedLevel; }
    public void setRequestedLevel(DisclosureLevel requestedLevel) { this.requestedLevel = requestedLevel; }

    public DisclosureLevel getRecommendedLevel() { return recommendedLevel; }
    public void setRecommendedLevel(DisclosureLevel recommendedLevel) { this.recommendedLevel = recommendedLevel; }

    public DisclosureStatus getStatus() { return status; }
    public void setStatus(DisclosureStatus status) { this.status = status; }

    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }

    public int getThresholdRequired() { return thresholdRequired; }
    public void setThresholdRequired(int thresholdRequired) { this.thresholdRequired = thresholdRequired; }

    public List<DisclosureApproval> getApprovals() { return approvals; }
    public void setApprovals(List<DisclosureApproval> approvals) { this.approvals = approvals; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
package com.trustreview.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Records a single committee member's vote (APPROVE or REJECT) on a DisclosureRequest.
 * A unique constraint prevents any member from voting more than once per request.
 */
@Entity
@Table(
    name = "disclosure_approvals",
    uniqueConstraints = @UniqueConstraint(
        name = "unique_request_member_vote",
        columnNames = {"disclosure_request_id", "committee_member_id"}
    )
)
public class DisclosureApproval {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "disclosure_request_id", nullable = false, updatable = false)
    private DisclosureRequest disclosureRequest;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "committee_member_id", nullable = false, updatable = false)
    private User committeeMember;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10, updatable = false)
    private VoteDecision decision;

    @Column(columnDefinition = "TEXT", nullable = false, updatable = false)
    private String rationale;

    @Column(name = "voted_at", nullable = false, updatable = false)
    private Instant votedAt;

    public DisclosureApproval() {
        this.id = UUID.randomUUID().toString();
    }

    public DisclosureApproval(DisclosureRequest disclosureRequest, User committeeMember,
                               VoteDecision decision, String rationale) {
        this.id = UUID.randomUUID().toString();
        this.disclosureRequest = disclosureRequest;
        this.committeeMember = committeeMember;
        this.decision = decision;
        this.rationale = rationale;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        this.votedAt = Instant.now();
    }

    // Getters

    public String getId() { return id; }

    public DisclosureRequest getDisclosureRequest() { return disclosureRequest; }

    public void setDisclosureRequest(DisclosureRequest disclosureRequest) {
        this.disclosureRequest = disclosureRequest;
    }

    public User getCommitteeMember() { return committeeMember; }

    public void setCommitteeMember(User committeeMember) {
        this.committeeMember = committeeMember;
    }

    public VoteDecision getDecision() { return decision; }

    public void setDecision(VoteDecision decision) { this.decision = decision; }

    public String getRationale() { return rationale; }

    public void setRationale(String rationale) { this.rationale = rationale; }

    public Instant getVotedAt() { return votedAt; }

    public void setVotedAt(Instant votedAt) { this.votedAt = votedAt; }
}

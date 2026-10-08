package com.trustreview.dto;

import com.trustreview.model.DisclosureApproval;
import com.trustreview.model.VoteDecision;

import java.time.Instant;

/**
 * Represents a single committee member's vote entry in a quorum tally.
 */
public class VoteDto {

    private String id;
    private String committeeMemberId;
    private String committeeMemberName;
    private VoteDecision decision;
    private String rationale;
    private Instant votedAt;

    public VoteDto() {}

    public static VoteDto from(DisclosureApproval approval) {
        VoteDto dto = new VoteDto();
        dto.setId(approval.getId());
        if (approval.getCommitteeMember() != null) {
            dto.setCommitteeMemberId(approval.getCommitteeMember().getId());
            dto.setCommitteeMemberName(approval.getCommitteeMember().getFullName());
        }
        dto.setDecision(approval.getDecision());
        dto.setRationale(approval.getRationale());
        dto.setVotedAt(approval.getVotedAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCommitteeMemberId() { return committeeMemberId; }
    public void setCommitteeMemberId(String committeeMemberId) { this.committeeMemberId = committeeMemberId; }

    public String getCommitteeMemberName() { return committeeMemberName; }
    public void setCommitteeMemberName(String committeeMemberName) { this.committeeMemberName = committeeMemberName; }

    public VoteDecision getDecision() { return decision; }
    public void setDecision(VoteDecision decision) { this.decision = decision; }

    public String getRationale() { return rationale; }
    public void setRationale(String rationale) { this.rationale = rationale; }

    public Instant getVotedAt() { return votedAt; }
    public void setVotedAt(Instant votedAt) { this.votedAt = votedAt; }
}

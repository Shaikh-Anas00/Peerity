package com.trustreview.dto;

import com.trustreview.model.AppealStatus;
import com.trustreview.model.DisclosureLevel;
import com.trustreview.model.DisclosureStatus;

import java.util.List;

/**
 * Full quorum tally returned after a vote is cast or when fetching vote history.
 * Contains the current vote breakdown, progress toward threshold, and per-member vote entries.
 */
public class QuorumStatusDto {

    private String appealId;
    private String disclosureRequestId;

    // Voting progress
    private int approveCount;
    private int rejectCount;
    private int thresholdRequired;
    private int totalVotesCast;
    private boolean quorumReached;

    // Derived state
    private DisclosureStatus disclosureStatus;
    private AppealStatus appealStatus;
    private DisclosureLevel requestedLevel;

    // Current user context
    private boolean currentUserHasVoted;
    private String currentUserVoteDecision; // "APPROVE" | "REJECT" | null
    private boolean recused;
    private String recusalReason;

    // Vote breakdown
    private List<VoteDto> votes;

    public QuorumStatusDto() {}

    // ── Getters and Setters ─────────────────────────────────────────────────────

    public String getAppealId() { return appealId; }
    public void setAppealId(String appealId) { this.appealId = appealId; }

    public String getDisclosureRequestId() { return disclosureRequestId; }
    public void setDisclosureRequestId(String disclosureRequestId) { this.disclosureRequestId = disclosureRequestId; }

    public int getApproveCount() { return approveCount; }
    public void setApproveCount(int approveCount) { this.approveCount = approveCount; }

    public int getRejectCount() { return rejectCount; }
    public void setRejectCount(int rejectCount) { this.rejectCount = rejectCount; }

    public int getThresholdRequired() { return thresholdRequired; }
    public void setThresholdRequired(int thresholdRequired) { this.thresholdRequired = thresholdRequired; }

    public int getTotalVotesCast() { return totalVotesCast; }
    public void setTotalVotesCast(int totalVotesCast) { this.totalVotesCast = totalVotesCast; }

    public boolean isQuorumReached() { return quorumReached; }
    public void setQuorumReached(boolean quorumReached) { this.quorumReached = quorumReached; }

    public DisclosureStatus getDisclosureStatus() { return disclosureStatus; }
    public void setDisclosureStatus(DisclosureStatus disclosureStatus) { this.disclosureStatus = disclosureStatus; }

    public AppealStatus getAppealStatus() { return appealStatus; }
    public void setAppealStatus(AppealStatus appealStatus) { this.appealStatus = appealStatus; }

    public DisclosureLevel getRequestedLevel() { return requestedLevel; }
    public void setRequestedLevel(DisclosureLevel requestedLevel) { this.requestedLevel = requestedLevel; }

    public boolean isCurrentUserHasVoted() { return currentUserHasVoted; }
    public void setCurrentUserHasVoted(boolean currentUserHasVoted) { this.currentUserHasVoted = currentUserHasVoted; }

    public String getCurrentUserVoteDecision() { return currentUserVoteDecision; }
    public void setCurrentUserVoteDecision(String currentUserVoteDecision) { this.currentUserVoteDecision = currentUserVoteDecision; }

    public boolean isRecused() { return recused; }
    public void setRecused(boolean recused) { this.recused = recused; }

    public String getRecusalReason() { return recusalReason; }
    public void setRecusalReason(String recusalReason) { this.recusalReason = recusalReason; }

    public List<VoteDto> getVotes() { return votes; }
    public void setVotes(List<VoteDto> votes) { this.votes = votes; }
}

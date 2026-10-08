package com.trustreview.dto;

import com.trustreview.model.VoteDecision;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for a committee member casting a vote on a disclosure request.
 */
public class CastVoteRequest {

    @NotNull(message = "decision is required (APPROVE or REJECT)")
    private VoteDecision decision;

    @NotBlank(message = "rationale is required")
    @Size(min = 10, max = 2000, message = "rationale must be between 10 and 2000 characters")
    private String rationale;

    public CastVoteRequest() {}

    public VoteDecision getDecision() { return decision; }
    public void setDecision(VoteDecision decision) { this.decision = decision; }

    public String getRationale() { return rationale; }
    public void setRationale(String rationale) { this.rationale = rationale; }
}

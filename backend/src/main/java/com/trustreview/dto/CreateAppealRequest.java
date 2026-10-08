package com.trustreview.dto;

import com.trustreview.model.AppealReason;
import com.trustreview.model.DisclosureLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateAppealRequest {

    @NotBlank(message = "reviewId is required")
    private String reviewId;

    @NotNull(message = "reason is required")
    private AppealReason reason;

    @NotBlank(message = "statement is required")
    @Size(min = 20, max = 5000, message = "statement must be between 20 and 5000 characters")
    private String statement;

    private DisclosureLevel requestedLevel;
    private String evidenceFilePath;

    public CreateAppealRequest() {}

    public String getReviewId() {
        return reviewId;
    }

    public void setReviewId(String reviewId) {
        this.reviewId = reviewId;
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

    public DisclosureLevel getRequestedLevel() {
        return requestedLevel;
    }

    public void setRequestedLevel(DisclosureLevel requestedLevel) {
        this.requestedLevel = requestedLevel;
    }

    public String getEvidenceFilePath() {
        return evidenceFilePath;
    }

    public void setEvidenceFilePath(String evidenceFilePath) {
        this.evidenceFilePath = evidenceFilePath;
    }
}
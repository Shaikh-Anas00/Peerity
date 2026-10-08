package com.trustreview.dto;

import com.trustreview.model.Appeal;
import com.trustreview.model.AppealReason;
import com.trustreview.model.AppealStatus;
import com.trustreview.model.DisclosureLevel;
import com.trustreview.model.DisclosureStatus;

import java.time.LocalDateTime;

public class AppealDto {

    private String id;
    private String reviewId;
    private String submissionId;
    private String assignmentTitle;
    private String reviewerPseudonym;
    private String reviewScores;
    private String reviewFeedback;

    private AppealReason reason;
    private String statement;
    private AppealStatus status;
    private String evidenceFilePath;
    private String resolution;

    private DisclosureLevel requestedLevel;
    private DisclosureLevel recommendedLevel;
    private DisclosureStatus disclosureStatus;

    // Phase 5: quorum progress fields
    private int approveCount;
    private int rejectCount;
    private int thresholdRequired;

    // Reviewer calibration & quality evidence (strictly gated by disclosure level)
    private Double reviewerReliabilityScore;
    private Integer reviewerCalibrationCount;
    private Double reviewerHelpfulPercentage;
    private String statisticalSignalNote;

    // Rating on this specific review
    private Integer reviewRating;
    private Boolean reviewRatingHelpful;
    private String reviewRatingComment;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public AppealDto() {}

    public static AppealDto from(Appeal a) {
        AppealDto dto = new AppealDto();
        dto.setId(a.getId());
        dto.setReason(a.getReason());
        dto.setStatement(a.getStatement());
        dto.setStatus(a.getStatus());
        dto.setEvidenceFilePath(a.getEvidenceFilePath());
        dto.setResolution(a.getResolution());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setResolvedAt(a.getResolvedAt());

        if (a.getReview() != null) {
            dto.setReviewId(a.getReview().getId());
            dto.setReviewerPseudonym(a.getReview().getReviewerPseudonym());
            dto.setReviewScores(a.getReview().getScores());
            dto.setReviewFeedback(a.getReview().getFeedbackText());

            if (a.getReview().getSubmission() != null) {
                dto.setSubmissionId(a.getReview().getSubmission().getId());
                if (a.getReview().getSubmission().getAssignment() != null) {
                    dto.setAssignmentTitle(a.getReview().getSubmission().getAssignment().getTitle());
                }
            }
        }

        if (a.getDisclosureRequest() != null) {
            dto.setRequestedLevel(a.getDisclosureRequest().getRequestedLevel());
            dto.setRecommendedLevel(a.getDisclosureRequest().getRecommendedLevel());
            dto.setDisclosureStatus(a.getDisclosureRequest().getStatus());
            dto.setApproveCount((int) a.getDisclosureRequest().getApproveCount());
            dto.setRejectCount((int) a.getDisclosureRequest().getRejectCount());
            dto.setThresholdRequired(a.getDisclosureRequest().getThresholdRequired());
        }

        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getReviewId() { return reviewId; }
    public void setReviewId(String reviewId) { this.reviewId = reviewId; }
    public String getSubmissionId() { return submissionId; }
    public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }
    public String getAssignmentTitle() { return assignmentTitle; }
    public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
    public String getReviewerPseudonym() { return reviewerPseudonym; }
    public void setReviewerPseudonym(String reviewerPseudonym) { this.reviewerPseudonym = reviewerPseudonym; }
    public String getReviewScores() { return reviewScores; }
    public void setReviewScores(String reviewScores) { this.reviewScores = reviewScores; }
    public String getReviewFeedback() { return reviewFeedback; }
    public void setReviewFeedback(String reviewFeedback) { this.reviewFeedback = reviewFeedback; }
    public AppealReason getReason() { return reason; }
    public void setReason(AppealReason reason) { this.reason = reason; }
    public String getStatement() { return statement; }
    public void setStatement(String statement) { this.statement = statement; }
    public AppealStatus getStatus() { return status; }
    public void setStatus(AppealStatus status) { this.status = status; }
    public String getEvidenceFilePath() { return evidenceFilePath; }
    public void setEvidenceFilePath(String evidenceFilePath) { this.evidenceFilePath = evidenceFilePath; }
    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }
    public DisclosureLevel getRequestedLevel() { return requestedLevel; }
    public void setRequestedLevel(DisclosureLevel requestedLevel) { this.requestedLevel = requestedLevel; }
    public DisclosureLevel getRecommendedLevel() { return recommendedLevel; }
    public void setRecommendedLevel(DisclosureLevel recommendedLevel) { this.recommendedLevel = recommendedLevel; }
    public DisclosureStatus getDisclosureStatus() { return disclosureStatus; }
    public void setDisclosureStatus(DisclosureStatus disclosureStatus) { this.disclosureStatus = disclosureStatus; }
    public int getApproveCount() { return approveCount; }
    public void setApproveCount(int approveCount) { this.approveCount = approveCount; }
    public int getRejectCount() { return rejectCount; }
    public void setRejectCount(int rejectCount) { this.rejectCount = rejectCount; }
    public Double getReviewerReliabilityScore() { return reviewerReliabilityScore; }
    public void setReviewerReliabilityScore(Double reviewerReliabilityScore) { this.reviewerReliabilityScore = reviewerReliabilityScore; }
    public Integer getReviewerCalibrationCount() { return reviewerCalibrationCount; }
    public void setReviewerCalibrationCount(Integer reviewerCalibrationCount) { this.reviewerCalibrationCount = reviewerCalibrationCount; }
    public Double getReviewerHelpfulPercentage() { return reviewerHelpfulPercentage; }
    public void setReviewerHelpfulPercentage(Double reviewerHelpfulPercentage) { this.reviewerHelpfulPercentage = reviewerHelpfulPercentage; }
    public String getStatisticalSignalNote() { return statisticalSignalNote; }
    public void setStatisticalSignalNote(String statisticalSignalNote) { this.statisticalSignalNote = statisticalSignalNote; }
    public Integer getReviewRating() { return reviewRating; }
    public void setReviewRating(Integer reviewRating) { this.reviewRating = reviewRating; }
    public Boolean getReviewRatingHelpful() { return reviewRatingHelpful; }
    public void setReviewRatingHelpful(Boolean reviewRatingHelpful) { this.reviewRatingHelpful = reviewRatingHelpful; }
    public String getReviewRatingComment() { return reviewRatingComment; }
    public void setReviewRatingComment(String reviewRatingComment) { this.reviewRatingComment = reviewRatingComment; }
    public int getThresholdRequired() { return thresholdRequired; }
    public void setThresholdRequired(int thresholdRequired) { this.thresholdRequired = thresholdRequired; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
package com.trustreview.dto;

import com.trustreview.model.Review;
import java.time.LocalDateTime;

/**
 * Decoupled DTO for Review entity.
 * Prevents leakage of reviewer identity to submission authors.
 */
public class ReviewDto {

    private String id;
    private String submissionId;
    private String submissionFileName;
    private String fileHash;
    private String assignmentId;
    private String assignmentTitle;
    private LocalDateTime reviewDeadline;

    // Scores stored as JSON string e.g. {"Code Quality":8,"Documentation":7}
    private String scores;
    private String answers;
    private java.util.List<RubricCriterionDto> rubric;
    private String feedbackText;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;

    // Pseudonym shown to authors
    private String reviewerPseudonym;
    private boolean isAnonymousView;

    // Only populated for reviewer's own view or admin
    private String reviewerId;
    private String reviewerName;
    private String reviewerEmail;
    private Integer authorRating;
    private Boolean authorRatingHelpful;
    private String authorRatingComment;

    public ReviewDto() {}

    /** For the Author: reviewer identity strictly masked. */
    public static ReviewDto forAuthor(Review r) {
        ReviewDto dto = new ReviewDto();
        dto.id = r.getId();
        if (r.getSubmission() != null) {
            dto.submissionId = r.getSubmission().getId();
            dto.submissionFileName = r.getSubmission().getOriginalFileName();
            dto.fileHash = r.getSubmission().getFileHash();
            if (r.getSubmission().getAssignment() != null) {
                dto.assignmentId = r.getSubmission().getAssignment().getId();
                dto.assignmentTitle = r.getSubmission().getAssignment().getTitle();
                dto.reviewDeadline = r.getSubmission().getAssignment().getReviewDeadline() != null
                        ? r.getSubmission().getAssignment().getReviewDeadline()
                        : (r.getSubmission().getAssignment().getDeadline() != null ? r.getSubmission().getAssignment().getDeadline().plusDays(7) : null);
                dto.rubric = com.trustreview.service.RubricSupport.parse(r.getSubmission().getAssignment().getRubricCriteria());
            }
        }
        dto.scores = r.getScores();
        dto.answers = r.getAnswers();
        dto.feedbackText = r.getFeedbackText();
        dto.status = r.getStatus();
        dto.submittedAt = r.getSubmittedAt();
        dto.createdAt = r.getCreatedAt();
        dto.isAnonymousView = true;
        dto.reviewerPseudonym = r.getReviewerPseudonym();
        // reviewerId / reviewerName / reviewerEmail intentionally null
        return dto;
    }

    /** For the Reviewer: their own assignment card with submission info (author masked). */
    public static ReviewDto forReviewer(Review r) {
        ReviewDto dto = new ReviewDto();
        dto.id = r.getId();
        if (r.getSubmission() != null) {
            dto.submissionId = r.getSubmission().getId();

            // Double-Blind Filename Masking:
            // Do not leak author's original file name (e.g., student_id_project.pdf) to peer reviewers
            String ext = "pdf";
            String original = r.getSubmission().getOriginalFileName();
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
            }
            String aIdPrefix = "work";
            if (r.getSubmission().getAssignment() != null && r.getSubmission().getAssignment().getId() != null) {
                String aId = r.getSubmission().getAssignment().getId();
                aIdPrefix = aId.length() >= 8 ? aId.substring(0, 8) : aId;
            }
            dto.submissionFileName = "submission_" + aIdPrefix + "." + ext;

            dto.fileHash = r.getSubmission().getFileHash();
            if (r.getSubmission().getAssignment() != null) {
                dto.assignmentId = r.getSubmission().getAssignment().getId();
                dto.assignmentTitle = r.getSubmission().getAssignment().getTitle();
                dto.reviewDeadline = r.getSubmission().getAssignment().getReviewDeadline() != null
                        ? r.getSubmission().getAssignment().getReviewDeadline()
                        : (r.getSubmission().getAssignment().getDeadline() != null ? r.getSubmission().getAssignment().getDeadline().plusDays(7) : null);
                dto.rubric = com.trustreview.service.RubricSupport.parse(r.getSubmission().getAssignment().getRubricCriteria());
            }
        }
        dto.scores = r.getScores();
        dto.answers = r.getAnswers();
        dto.feedbackText = r.getFeedbackText();
        dto.status = r.getStatus();
        dto.submittedAt = r.getSubmittedAt();
        dto.createdAt = r.getCreatedAt();
        dto.isAnonymousView = false;
        dto.reviewerPseudonym = r.getReviewerPseudonym();
        if (r.getReviewer() != null) {
            dto.reviewerId = r.getReviewer().getId();
            dto.reviewerName = r.getReviewer().getFullName();
            dto.reviewerEmail = r.getReviewer().getEmail();
        }
        return dto;
    }

    /** For Committee / Admin during appeals. */
    public static ReviewDto forCommittee(Review r) { return forReviewer(r); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSubmissionId() { return submissionId; }
    public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }
    public String getSubmissionFileName() { return submissionFileName; }
    public void setSubmissionFileName(String submissionFileName) { this.submissionFileName = submissionFileName; }
    public String getFileHash() { return fileHash; }
    public void setFileHash(String fileHash) { this.fileHash = fileHash; }
    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
    public String getAssignmentTitle() { return assignmentTitle; }
    public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
    public LocalDateTime getReviewDeadline() { return reviewDeadline; }
    public void setReviewDeadline(LocalDateTime reviewDeadline) { this.reviewDeadline = reviewDeadline; }
    public String getScores() { return scores; }
    public void setScores(String scores) { this.scores = scores; }
    public String getAnswers() { return answers; }
    public void setAnswers(String answers) { this.answers = answers; }
    public java.util.List<RubricCriterionDto> getRubric() { return rubric; }
    public void setRubric(java.util.List<RubricCriterionDto> rubric) { this.rubric = rubric; }
    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) { this.feedbackText = feedbackText; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getReviewerPseudonym() { return reviewerPseudonym; }
    public void setReviewerPseudonym(String reviewerPseudonym) { this.reviewerPseudonym = reviewerPseudonym; }
    public boolean isAnonymousView() { return isAnonymousView; }
    public void setAnonymousView(boolean anonymousView) { isAnonymousView = anonymousView; }
    public String getReviewerId() { return reviewerId; }
    public void setReviewerId(String reviewerId) { this.reviewerId = reviewerId; }
    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
    public Integer getAuthorRating() { return authorRating; }
    public void setAuthorRating(Integer authorRating) { this.authorRating = authorRating; }
    public Boolean getAuthorRatingHelpful() { return authorRatingHelpful; }
    public void setAuthorRatingHelpful(Boolean authorRatingHelpful) { this.authorRatingHelpful = authorRatingHelpful; }
    public String getAuthorRatingComment() { return authorRatingComment; }
    public void setAuthorRatingComment(String authorRatingComment) { this.authorRatingComment = authorRatingComment; }
    public String getReviewerEmail() { return reviewerEmail; }
    public void setReviewerEmail(String reviewerEmail) { this.reviewerEmail = reviewerEmail; }
}

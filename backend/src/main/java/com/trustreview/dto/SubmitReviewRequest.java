package com.trustreview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SubmitReviewRequest {

    /** JSON map of criterion->score e.g. {"Code Quality":8,"Documentation":7} */
    @NotNull(message = "Scores are required")
    private String scores;

    @NotBlank(message = "Feedback text is required")
    private String feedbackText;

    /**
     * Optional JSON map criterion->[chosen option values 1-5]. Required (and verified against
     * {@code scores}) only when the assignment rubric contains QUESTION_BASED criteria.
     */
    private String answers;

    public String getScores() { return scores; }
    public void setScores(String scores) { this.scores = scores; }
    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) { this.feedbackText = feedbackText; }
    public String getAnswers() { return answers; }
    public void setAnswers(String answers) { this.answers = answers; }
}

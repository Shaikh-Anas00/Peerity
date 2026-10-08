package com.trustreview.dto;

import java.util.List;
import java.util.Map;

/**
 * Student-facing aggregate evaluation DTO.
 *
 * PRIVACY CONTRACT: This DTO MUST NEVER contain evaluatorId, evaluatorName,
 * evaluatorEmail, or any other field that could identify who submitted an evaluation.
 * Only aggregate (averaged) criterion scores are exposed, plus a withheld-feedback
 * notice when the k-anonymity floor has not been reached.
 */
public class GroupMemberEvaluationDto {

    /** ID of the student being evaluated. Always the same as the requesting student. */
    private String evaluateeId;

    /** Number of evaluations received. Shown so student knows how many peers evaluated them. */
    private int evaluationCount;

    /**
     * Averaged score per criterion (e.g. {"Contribution": 7.5, "Teamwork": 8.0}).
     * Empty map if no evaluations received.
     */
    private Map<String, Double> aggregateScores;

    /**
     * True if feedback text is disclosed (evaluationCount >= FEEDBACK_K_ANONYMITY_FLOOR).
     * False if withheld to prevent re-identification.
     */
    private boolean feedbackDisclosed;

    /**
     * If feedbackDisclosed == true: list of feedback texts from all evaluators (no names).
     * If feedbackDisclosed == false: null.
     */
    private List<String> feedbackItems;

    /**
     * Human-readable message explaining why feedback is withheld (when feedbackDisclosed == false).
     * Null when feedbackDisclosed == true.
     */
    private String feedbackDisclosureMessage;

    public String getEvaluateeId() { return evaluateeId; }
    public void setEvaluateeId(String evaluateeId) { this.evaluateeId = evaluateeId; }
    public int getEvaluationCount() { return evaluationCount; }
    public void setEvaluationCount(int evaluationCount) { this.evaluationCount = evaluationCount; }
    public Map<String, Double> getAggregateScores() { return aggregateScores; }
    public void setAggregateScores(Map<String, Double> aggregateScores) { this.aggregateScores = aggregateScores; }
    public boolean isFeedbackDisclosed() { return feedbackDisclosed; }
    public void setFeedbackDisclosed(boolean feedbackDisclosed) { this.feedbackDisclosed = feedbackDisclosed; }
    public List<String> getFeedbackItems() { return feedbackItems; }
    public void setFeedbackItems(List<String> feedbackItems) { this.feedbackItems = feedbackItems; }
    public String getFeedbackDisclosureMessage() { return feedbackDisclosureMessage; }
    public void setFeedbackDisclosureMessage(String feedbackDisclosureMessage) { this.feedbackDisclosureMessage = feedbackDisclosureMessage; }
}

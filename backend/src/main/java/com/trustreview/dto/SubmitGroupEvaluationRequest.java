package com.trustreview.dto;

public class SubmitGroupEvaluationRequest {
    private String groupId;
    private String evaluateeId;
    private String scores;
    private String feedback;

    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getEvaluateeId() { return evaluateeId; }
    public void setEvaluateeId(String evaluateeId) { this.evaluateeId = evaluateeId; }
    public String getScores() { return scores; }
    public void setScores(String scores) { this.scores = scores; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}

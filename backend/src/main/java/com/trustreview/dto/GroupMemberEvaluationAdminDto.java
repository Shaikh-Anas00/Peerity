package com.trustreview.dto;

import com.trustreview.model.GroupMemberEvaluation;

public class GroupMemberEvaluationAdminDto {
    private String id;
    private String groupId;
    private String evaluatorId;
    private String evaluatorName;
    private String evaluateeId;
    private String evaluateeName;
    private String scores;
    private String feedback;

    public static GroupMemberEvaluationAdminDto from(GroupMemberEvaluation eval) {
        GroupMemberEvaluationAdminDto dto = new GroupMemberEvaluationAdminDto();
        dto.setId(eval.getId());
        dto.setGroupId(eval.getGroup().getId());
        dto.setEvaluatorId(eval.getEvaluator().getId());
        dto.setEvaluatorName(eval.getEvaluator().getFullName());
        dto.setEvaluateeId(eval.getEvaluatee().getId());
        dto.setEvaluateeName(eval.getEvaluatee().getFullName());
        dto.setScores(eval.getScores());
        dto.setFeedback(eval.getFeedback());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getEvaluatorId() { return evaluatorId; }
    public void setEvaluatorId(String evaluatorId) { this.evaluatorId = evaluatorId; }
    public String getEvaluatorName() { return evaluatorName; }
    public void setEvaluatorName(String evaluatorName) { this.evaluatorName = evaluatorName; }
    public String getEvaluateeId() { return evaluateeId; }
    public void setEvaluateeId(String evaluateeId) { this.evaluateeId = evaluateeId; }
    public String getEvaluateeName() { return evaluateeName; }
    public void setEvaluateeName(String evaluateeName) { this.evaluateeName = evaluateeName; }
    public String getScores() { return scores; }
    public void setScores(String scores) { this.scores = scores; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}

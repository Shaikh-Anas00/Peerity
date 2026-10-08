package com.trustreview.dto;

import com.trustreview.model.GroupFormationSurvey;

public class GroupFormationSurveyDto {
    private String id;
    private String assignmentId;
    private String questions;

    public static GroupFormationSurveyDto from(GroupFormationSurvey survey) {
        GroupFormationSurveyDto dto = new GroupFormationSurveyDto();
        dto.setId(survey.getId());
        dto.setAssignmentId(survey.getAssignment().getId());
        dto.setQuestions(survey.getQuestions());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
    public String getQuestions() { return questions; }
    public void setQuestions(String questions) { this.questions = questions; }
}

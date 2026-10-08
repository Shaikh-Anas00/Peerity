package com.trustreview.dto;

public class SubmitSurveyResponseRequest {
    private String surveyId;
    private String responses;

    public String getSurveyId() { return surveyId; }
    public void setSurveyId(String surveyId) { this.surveyId = surveyId; }
    public String getResponses() { return responses; }
    public void setResponses(String responses) { this.responses = responses; }
}

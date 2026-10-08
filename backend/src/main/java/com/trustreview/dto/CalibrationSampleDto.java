package com.trustreview.dto;

import com.trustreview.model.CalibrationSample;
import java.time.LocalDateTime;

public class CalibrationSampleDto {
    private String id;
    private String assignmentId;
    private String assignmentTitle;
    private String title;
    private String description;
    private String sampleContent;
    private java.util.List<RubricCriterionDto> rubric;
    private LocalDateTime createdAt;
    private boolean isCompletedByMe;
    private Double myAccuracyScore;

    public CalibrationSampleDto() {}

    public static CalibrationSampleDto from(CalibrationSample sample, boolean isCompleted, Double accuracy) {
        CalibrationSampleDto dto = new CalibrationSampleDto();
        dto.id = sample.getId();
        if (sample.getAssignment() != null) {
            dto.assignmentId = sample.getAssignment().getId();
            dto.assignmentTitle = sample.getAssignment().getTitle();
        }
        dto.title = sample.getTitle();
        dto.description = sample.getDescription();
        dto.sampleContent = sample.getSampleContent();
        dto.rubric = com.trustreview.service.RubricSupport.rubricForSample(sample);
        dto.createdAt = sample.getCreatedAt();
        dto.isCompletedByMe = isCompleted;
        dto.myAccuracyScore = accuracy;
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
    public String getAssignmentTitle() { return assignmentTitle; }
    public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSampleContent() { return sampleContent; }
    public void setSampleContent(String sampleContent) { this.sampleContent = sampleContent; }
    public java.util.List<RubricCriterionDto> getRubric() { return rubric; }
    public void setRubric(java.util.List<RubricCriterionDto> rubric) { this.rubric = rubric; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isCompletedByMe() { return isCompletedByMe; }
    public void setCompletedByMe(boolean completedByMe) { isCompletedByMe = completedByMe; }
    public Double getMyAccuracyScore() { return myAccuracyScore; }
    public void setMyAccuracyScore(Double myAccuracyScore) { this.myAccuracyScore = myAccuracyScore; }
}

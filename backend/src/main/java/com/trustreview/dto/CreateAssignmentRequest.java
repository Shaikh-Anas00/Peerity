package com.trustreview.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class CreateAssignmentRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    private String description;

    private String rubricCriteria;

    private java.util.List<RubricCriterionDto> rubric;

    @NotNull(message = "Deadline is required")
    @Future(message = "Deadline must be in the future")
    private LocalDateTime deadline;

    @Future(message = "Review deadline must be in the future")
    private LocalDateTime reviewDeadline;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRubricCriteria() { return rubricCriteria; }
    public void setRubricCriteria(String rubricCriteria) { this.rubricCriteria = rubricCriteria; }
    public java.util.List<RubricCriterionDto> getRubric() { return rubric; }
    public void setRubric(java.util.List<RubricCriterionDto> rubric) { this.rubric = rubric; }
    public LocalDateTime getDeadline() { return deadline; }
    public void setDeadline(LocalDateTime deadline) { this.deadline = deadline; }
    public LocalDateTime getReviewDeadline() { return reviewDeadline; }
    public void setReviewDeadline(LocalDateTime reviewDeadline) { this.reviewDeadline = reviewDeadline; }
}

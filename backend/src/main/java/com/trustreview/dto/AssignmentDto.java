package com.trustreview.dto;

import com.trustreview.model.Assignment;
import java.time.LocalDateTime;

public class AssignmentDto {
    private String id;
    private String title;
    private String description;
    private String rubricCriteria;
    private java.util.List<RubricCriterionDto> rubric;
    private LocalDateTime deadline;
    private LocalDateTime reviewDeadline;
    private String createdByName;
    private String createdById;
    private LocalDateTime createdAt;
    private boolean hasSubmitted;

    public AssignmentDto() {}

    public static AssignmentDto from(Assignment a) {
        return from(a, false);
    }

    public static AssignmentDto from(Assignment a, boolean hasSubmitted) {
        AssignmentDto dto = new AssignmentDto();
        dto.id = a.getId();
        dto.title = a.getTitle();
        dto.description = a.getDescription();
        dto.rubricCriteria = a.getRubricCriteria();
        dto.rubric = com.trustreview.service.RubricSupport.parse(a.getRubricCriteria());
        dto.deadline = a.getDeadline();
        dto.reviewDeadline = a.getReviewDeadline() != null
                ? a.getReviewDeadline()
                : (a.getDeadline() != null ? a.getDeadline().plusDays(7) : null);
        dto.createdAt = a.getCreatedAt();
        dto.hasSubmitted = hasSubmitted;
        if (a.getCreatedBy() != null) {
            dto.createdByName = a.getCreatedBy().getFullName();
            dto.createdById = a.getCreatedBy().getId();
        }
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public String getCreatedById() { return createdById; }
    public void setCreatedById(String createdById) { this.createdById = createdById; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isHasSubmitted() { return hasSubmitted; }
    public void setHasSubmitted(boolean hasSubmitted) { this.hasSubmitted = hasSubmitted; }
}

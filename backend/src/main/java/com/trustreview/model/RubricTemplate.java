package com.trustreview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A reusable starter rubric. Its criteria (which may be level-based or question-based) are kept
 * as a JSON array of {@code RubricCriterionDto} - the same representation an assignment stores.
 * Choosing a template copies the criteria into the assignment, so assignments never stay linked
 * to a template that might change later.
 */
@Entity
@Table(name = "rubric_templates", uniqueConstraints = {
    @UniqueConstraint(name = "uk_rubric_template_name", columnNames = "name")
})
public class RubricTemplate {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RubricTemplateCategory category;

    @Column(length = 500)
    private String description;

    /** JSON array of RubricCriterionDto. */
    @Column(name = "criteria_json", columnDefinition = "TEXT", nullable = false)
    private String criteriaJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public RubricTemplate() { this.id = UUID.randomUUID().toString(); }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public RubricTemplateCategory getCategory() { return category; }
    public void setCategory(RubricTemplateCategory category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCriteriaJson() { return criteriaJson; }
    public void setCriteriaJson(String criteriaJson) { this.criteriaJson = criteriaJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

package com.trustreview.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One selectable performance level of a rubric criterion (e.g. "Exemplary").
 * The stored {@code score} is a fixed anchor (10/8/6/2) enforced server-side, so the
 * numeric score maps used by reviews, calibration and analytics keep their shape.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PerformanceLevelDto {
    private String label;
    private Integer score;
    private String scoreRange;
    private String description;

    public PerformanceLevelDto() {}

    public PerformanceLevelDto(String label, Integer score, String scoreRange, String description) {
        this.label = label;
        this.score = score;
        this.scoreRange = scoreRange;
        this.description = description;
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getScoreRange() { return scoreRange; }
    public void setScoreRange(String scoreRange) { this.scoreRange = scoreRange; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

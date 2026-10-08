package com.trustreview.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.trustreview.model.EvaluationType;
import java.util.ArrayList;
import java.util.List;

/**
 * A rubric criterion owned by an assignment: what to judge (description),
 * an optional weight, and the four ordered performance levels.
 *
 * <p>A criterion may alternatively be {@link EvaluationType#QUESTION_BASED}: it then carries
 * {@link #getQuestions() questions} (each with five full-sentence options). {@code evaluationType}
 * and {@code questions} are omitted from JSON when null, so stored level-based rubrics keep
 * their exact original shape; an absent type means SCALE_WITH_LEVELS.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RubricCriterionDto {
    private String name;
    private String description;
    /** Optional percentage weight; either all criteria carry one (summing to 100) or none do. */
    private Integer weight;
    private List<PerformanceLevelDto> levels = new ArrayList<>();

    /** Null (absent) means SCALE_WITH_LEVELS. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private EvaluationType evaluationType;

    /** Only present for QUESTION_BASED criteria. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<RubricQuestionDto> questions;

    public RubricCriterionDto() {}

    public RubricCriterionDto(String name, String description, Integer weight, List<PerformanceLevelDto> levels) {
        this.name = name;
        this.description = description;
        this.weight = weight;
        this.levels = levels;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getWeight() { return weight; }
    public void setWeight(Integer weight) { this.weight = weight; }
    public List<PerformanceLevelDto> getLevels() { return levels; }
    public void setLevels(List<PerformanceLevelDto> levels) { this.levels = levels; }
    public EvaluationType getEvaluationType() { return evaluationType; }
    public void setEvaluationType(EvaluationType evaluationType) { this.evaluationType = evaluationType; }
    public List<RubricQuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<RubricQuestionDto> questions) { this.questions = questions; }
}

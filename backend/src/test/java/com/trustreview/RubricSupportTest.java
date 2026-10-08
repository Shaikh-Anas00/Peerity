package com.trustreview;

import com.trustreview.dto.PerformanceLevelDto;
import com.trustreview.dto.RubricCriterionDto;
import com.trustreview.service.RubricSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Rubric Support & Validation Tests")
class RubricSupportTest {

    @Test
    @DisplayName("Parse legacy string array: upgraded to 4 levels with default labels")
    void parse_legacyArray_upgradedToDefaultLevels() {
        String legacyJson = "[\"Code Quality\", \"Correctness\"]";
        List<RubricCriterionDto> result = RubricSupport.parse(legacyJson);

        assertEquals(2, result.size());
        assertEquals("Code Quality", result.get(0).getName());
        assertEquals("Correctness", result.get(1).getName());
        assertEquals(4, result.get(0).getLevels().size());
        assertEquals("Exemplary", result.get(0).getLevels().get(0).getLabel());
        assertEquals(10, result.get(0).getLevels().get(0).getScore());
        assertEquals("Needs Improvement", result.get(0).getLevels().get(3).getLabel());
        assertEquals(2, result.get(0).getLevels().get(3).getScore());
    }

    @Test
    @DisplayName("Parse and serialize v2 rubric round-trip")
    void roundTrip_v2Rubric() {
        List<RubricCriterionDto> criteria = List.of(
                new RubricCriterionDto("Clarity", "Writing quality", 100, List.of(
                        new PerformanceLevelDto("Exemplary", 10, "9-10", "Flawless clarity"),
                        new PerformanceLevelDto("Proficient", 8, "7-8", "Good clarity"),
                        new PerformanceLevelDto("Developing", 6, "5-6", "Needs minor work"),
                        new PerformanceLevelDto("Needs Improvement", 2, "0-4", "Unclear")
                ))
        );

        String json = RubricSupport.toJson(criteria);
        List<RubricCriterionDto> parsed = RubricSupport.parse(json);

        assertEquals(1, parsed.size());
        assertEquals("Clarity", parsed.get(0).getName());
        assertEquals("Writing quality", parsed.get(0).getDescription());
        assertEquals(100, parsed.get(0).getWeight());
        assertEquals(4, parsed.get(0).getLevels().size());
        assertEquals("Flawless clarity", parsed.get(0).getLevels().get(0).getDescription());
    }

    @Test
    @DisplayName("Authoring validation: rejects empty criteria list")
    void normalize_emptyList_throws() {
        assertThrows(IllegalArgumentException.class, () -> RubricSupport.normalize(List.of()));
    }

    @Test
    @DisplayName("Authoring validation: rejects duplicate criterion names")
    void normalize_duplicateNames_throws() {
        List<RubricCriterionDto> criteria = List.of(
                makeCriterion("Quality", 50),
                makeCriterion("quality", 50)
        );
        assertThrows(IllegalArgumentException.class, () -> RubricSupport.normalize(criteria));
    }

    @Test
    @DisplayName("Authoring validation: rejects criterion without 4 levels")
    void normalize_invalidLevelsCount_throws() {
        RubricCriterionDto c = makeCriterion("Testing", null);
        c.setLevels(c.getLevels().subList(0, 3));
        assertThrows(IllegalArgumentException.class, () -> RubricSupport.normalize(List.of(c)));
    }

    @Test
    @DisplayName("Authoring validation: rejects weights not summing to 100")
    void normalize_weightsNotSummingTo100_throws() {
        List<RubricCriterionDto> criteria = List.of(
                makeCriterion("Design", 40),
                makeCriterion("Code", 40)
        );
        assertThrows(IllegalArgumentException.class, () -> RubricSupport.normalize(criteria));
    }

    @Test
    @DisplayName("Score validation: rejects missing criteria")
    void validateScores_missingCriteria_throws() {
        List<RubricCriterionDto> rubric = List.of(makeCriterion("Code", null), makeCriterion("Docs", null));
        Map<String, Integer> scores = Map.of("Code", 10);
        assertThrows(IllegalArgumentException.class, () -> RubricSupport.validateScores(scores, rubric));
    }

    @Test
    @DisplayName("Score validation: rejects unexpected criteria")
    void validateScores_unexpectedCriteria_throws() {
        List<RubricCriterionDto> rubric = List.of(makeCriterion("Code", null));
        Map<String, Integer> scores = Map.of("Code", 10, "Extra", 8);
        assertThrows(IllegalArgumentException.class, () -> RubricSupport.validateScores(scores, rubric));
    }

    @Test
    @DisplayName("Score validation: rejects non-anchor scores for v2 rubric")
    void validateScores_nonAnchor_throws() {
        List<RubricCriterionDto> rubric = List.of(makeCriterion("Code", null));
        // 7 is between Proficient (8) and Developing (6), but not an anchor
        Map<String, Integer> scores = Map.of("Code", 7);
        assertThrows(IllegalArgumentException.class, () -> RubricSupport.validateScores(scores, rubric));
    }

    @Test
    @DisplayName("Score validation: accepts anchor scores (10, 8, 6, 2) for v2 rubric")
    void validateScores_anchorScores_success() {
        List<RubricCriterionDto> rubric = List.of(
                makeCriterion("Code", null),
                makeCriterion("Design", null)
        );
        Map<String, Integer> scores = Map.of("Code", 10, "Design", 6);
        assertDoesNotThrow(() -> RubricSupport.validateScores(scores, rubric));
    }

    @Test
    @DisplayName("Score validation: accepts any 0-10 score for legacy rubric")
    void validateScores_legacyRubric_acceptsAnyValidInteger() {
        List<RubricCriterionDto> rubric = RubricSupport.parse("[\"Legacy Criteria\"]");
        Map<String, Integer> scores = Map.of("Legacy Criteria", 7);
        assertDoesNotThrow(() -> RubricSupport.validateScores(scores, rubric));
    }

    @Test
    @DisplayName("Level index and label calculation matches score range")
    void levelIndexAndLabel_mapsProperly() {
        RubricCriterionDto criterion = makeCriterion("Security", null);
        assertEquals(0, RubricSupport.levelIndex(10));
        assertEquals(0, RubricSupport.levelIndex(9));
        assertEquals(1, RubricSupport.levelIndex(8));
        assertEquals(1, RubricSupport.levelIndex(7));
        assertEquals(2, RubricSupport.levelIndex(6));
        assertEquals(2, RubricSupport.levelIndex(5));
        assertEquals(3, RubricSupport.levelIndex(4));
        assertEquals(3, RubricSupport.levelIndex(0));

        assertEquals("Exemplary", RubricSupport.levelLabel(criterion, 10));
        assertEquals("Proficient", RubricSupport.levelLabel(criterion, 8));
        assertEquals("Developing", RubricSupport.levelLabel(criterion, 6));
        assertEquals("Needs Improvement", RubricSupport.levelLabel(criterion, 2));
    }

    private RubricCriterionDto makeCriterion(String name, Integer weight) {
        return new RubricCriterionDto(name, "Description for " + name, weight, List.of(
                new PerformanceLevelDto("Exemplary", 10, "9-10", "Exemplary description"),
                new PerformanceLevelDto("Proficient", 8, "7-8", "Proficient description"),
                new PerformanceLevelDto("Developing", 6, "5-6", "Developing description"),
                new PerformanceLevelDto("Needs Improvement", 2, "0-4", "Needs improvement description")
        ));
    }
}

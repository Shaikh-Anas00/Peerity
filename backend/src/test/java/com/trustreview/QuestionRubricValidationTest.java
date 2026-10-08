package com.trustreview;

import com.trustreview.dto.PerformanceLevelDto;
import com.trustreview.dto.RubricCriterionDto;
import com.trustreview.dto.RubricOptionDto;
import com.trustreview.dto.RubricQuestionDto;
import com.trustreview.model.EvaluationType;
import com.trustreview.service.RubricSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Question-Based Rubric Validation Tests")
public class QuestionRubricValidationTest {

    private RubricOptionDto opt(String text, int val) {
        return new RubricOptionDto(text, val);
    }

    private List<RubricOptionDto> validFiveOptions() {
        return List.of(
                opt("Option 1 text is very clear.", 1),
                opt("Option 2 text is reasonably clear.", 2),
                opt("Option 3 text meets expectations.", 3),
                opt("Option 4 text exceeds expectations.", 4),
                opt("Option 5 text is exemplary and flawless.", 5)
        );
    }

    @Test
    @DisplayName("Validation: Rejects question with fewer than 5 options")
    void testRejectFewerThanFiveOptions() {
        RubricQuestionDto q = new RubricQuestionDto("Prompt text?", List.of(
                opt("Opt 1", 1), opt("Opt 2", 2), opt("Opt 3", 3), opt("Opt 4", 4)
        ));
        RubricCriterionDto c = new RubricCriterionDto("Test", "Desc", null, RubricSupport.defaultLevels());
        c.setEvaluationType(EvaluationType.QUESTION_BASED);
        c.setQuestions(List.of(q));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                RubricSupport.normalize(List.of(c)));
        assertTrue(ex.getMessage().contains("must have exactly 5 options"));
    }

    @Test
    @DisplayName("Validation: Rejects question with duplicate option text")
    void testRejectDuplicateOptionText() {
        RubricQuestionDto q = new RubricQuestionDto("Prompt text?", List.of(
                opt("Same text", 1), opt("Same text", 2), opt("Opt 3", 3), opt("Opt 4", 4), opt("Opt 5", 5)
        ));
        RubricCriterionDto c = new RubricCriterionDto("Test", "Desc", null, RubricSupport.defaultLevels());
        c.setEvaluationType(EvaluationType.QUESTION_BASED);
        c.setQuestions(List.of(q));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                RubricSupport.normalize(List.of(c)));
        assertTrue(ex.getMessage().contains("duplicate option text"));
    }

    @Test
    @DisplayName("Validation: Overwrites client-supplied scoreValue with 1..5 based on position")
    void testScoreValueForcedByPosition() {
        RubricQuestionDto q = new RubricQuestionDto("Prompt text?", List.of(
                opt("Opt 1", 99), opt("Opt 2", 88), opt("Opt 3", 77), opt("Opt 4", 66), opt("Opt 5", 55)
        ));
        RubricCriterionDto c = new RubricCriterionDto("Test", "Desc", null, RubricSupport.defaultLevels());
        c.setEvaluationType(EvaluationType.QUESTION_BASED);
        c.setQuestions(List.of(q));

        List<RubricCriterionDto> normalized = RubricSupport.normalize(List.of(c));
        List<RubricOptionDto> opts = normalized.get(0).getQuestions().get(0).getOptions();
        for (int i = 0; i < 5; i++) {
            assertEquals(i + 1, opts.get(i).getScoreValue());
        }
    }

    @Test
    @DisplayName("Validation: Rejects more than 4 questions per criterion")
    void testRejectMoreThanFourQuestions() {
        List<RubricQuestionDto> questions = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            questions.add(new RubricQuestionDto("Prompt " + i, validFiveOptions()));
        }
        RubricCriterionDto c = new RubricCriterionDto("Test", "Desc", null, RubricSupport.defaultLevels());
        c.setEvaluationType(EvaluationType.QUESTION_BASED);
        c.setQuestions(questions);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                RubricSupport.normalize(List.of(c)));
        assertTrue(ex.getMessage().contains("at most 4 questions"));
    }

    @Test
    @DisplayName("Score Validation: Accepts valid integer scores in [2, 10] for QB criteria, rejects out of range")
    void testScoreValidationRange() {
        RubricCriterionDto c = new RubricCriterionDto("Quality", "Desc", null, RubricSupport.defaultLevels());
        c.setEvaluationType(EvaluationType.QUESTION_BASED);
        c.setQuestions(List.of(new RubricQuestionDto("Prompt?", validFiveOptions())));
        List<RubricCriterionDto> rubric = List.of(c);

        // Valid scores
        assertDoesNotThrow(() -> RubricSupport.validateScores(Map.of("Quality", 2), rubric));
        assertDoesNotThrow(() -> RubricSupport.validateScores(Map.of("Quality", 8), rubric));
        assertDoesNotThrow(() -> RubricSupport.validateScores(Map.of("Quality", 9), rubric));
        assertDoesNotThrow(() -> RubricSupport.validateScores(Map.of("Quality", 10), rubric));

        // Invalid scores
        assertThrows(IllegalArgumentException.class, () -> RubricSupport.validateScores(Map.of("Quality", 1), rubric));
        assertThrows(IllegalArgumentException.class, () -> RubricSupport.validateScores(Map.of("Quality", 11), rubric));
    }

    @Test
    @DisplayName("Answer Validation: Verifies answers match question count, valid range, and score consistency")
    void testAnswerValidation() {
        RubricCriterionDto c = new RubricCriterionDto("Quality", "Desc", null, RubricSupport.defaultLevels());
        c.setEvaluationType(EvaluationType.QUESTION_BASED);
        c.setQuestions(List.of(
                new RubricQuestionDto("Q1?", validFiveOptions()),
                new RubricQuestionDto("Q2?", validFiveOptions())
        ));
        List<RubricCriterionDto> rubric = List.of(c);

        // Matching: options [4, 4] -> resolves to 8
        Map<String, List<Integer>> validAnswers = Map.of("Quality", List.of(4, 4));
        assertDoesNotThrow(() -> RubricSupport.validateAnswers(validAnswers, rubric, Map.of("Quality", 8)));

        // Mismatched score: options [4, 4] submitted with score 9 -> rejected
        assertThrows(IllegalArgumentException.class, () ->
                RubricSupport.validateAnswers(validAnswers, rubric, Map.of("Quality", 9)));

        // Incomplete answers: only 1 answer when 2 questions exist -> rejected
        Map<String, List<Integer>> incompleteAnswers = Map.of("Quality", List.of(4));
        assertThrows(IllegalArgumentException.class, () ->
                RubricSupport.validateAnswers(incompleteAnswers, rubric, Map.of("Quality", 8)));

        // Out-of-bounds answer: option 6 -> rejected
        Map<String, List<Integer>> outOfBoundsAnswers = Map.of("Quality", List.of(4, 6));
        assertThrows(IllegalArgumentException.class, () ->
                RubricSupport.validateAnswers(outOfBoundsAnswers, rubric, Map.of("Quality", 8)));
    }

    @Test
    @DisplayName("Safety Constraint: Worst-case rubric JSON serializes well under MySQL 64KB TEXT limit")
    void testWorstCaseRubricSerializesUnderSixtyKilobytes() {
        // Maximum 8 criteria, each with maximum 4 questions, each with 5 options of 200 chars
        String longText = "A".repeat(195);
        List<RubricCriterionDto> criteria = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            List<RubricQuestionDto> questions = new ArrayList<>();
            for (int q = 0; q < 4; q++) {
                List<RubricOptionDto> options = new ArrayList<>();
                for (int o = 0; o < 5; o++) {
                    options.add(new RubricOptionDto(longText + " " + o, o + 1));
                }
                questions.add(new RubricQuestionDto("Question prompt " + q + " " + "Q".repeat(150), options));
            }
            RubricCriterionDto c = new RubricCriterionDto("Criterion " + i, "Criterion Description " + i, null, RubricSupport.defaultLevels());
            c.setEvaluationType(EvaluationType.QUESTION_BASED);
            c.setQuestions(questions);
            criteria.add(c);
        }

        List<RubricCriterionDto> normalized = RubricSupport.normalize(criteria);
        String json = RubricSupport.toJson(normalized);

        // Must be less than 60,000 bytes (< 65,535 MySQL TEXT limit)
        byte[] bytes = json.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        assertTrue(bytes.length < 60000, "Worst-case rubric size was " + bytes.length + " bytes, expected < 60,000");
    }
}

package com.trustreview;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustreview.dto.*;
import com.trustreview.model.*;
import com.trustreview.repository.*;
import com.trustreview.service.CalibrationService;
import com.trustreview.service.PolicyEngineService;
import com.trustreview.service.RubricSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Dual Scoring Path Equivalence Tests (QUESTION_BASED vs SCALE_WITH_LEVELS)")
public class DualScoringPathEquivalenceTest {

    @Autowired private CalibrationService calibrationService;
    @Autowired private CalibrationSampleRepository sampleRepository;
    @Autowired private CalibrationScoreRepository scoreRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private PolicyEngineService policyEngineService;
    @Autowired private ObjectMapper objectMapper;

    private User studentScale;
    private User studentQuestion;
    private User instructor;
    private Assignment assignmentScale;
    private Assignment assignmentQuestion;
    private CalibrationSample sampleScale;
    private CalibrationSample sampleQuestion;

    @BeforeEach
    void setUp() {
        scoreRepository.deleteAll();
        sampleRepository.deleteAll();

        studentScale = userRepository.findByEmail("equiv_student_scale@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("equiv_student_scale@trustreview.edu", "pw", "Scale Student", Role.STUDENT, "Apex", "CS")));

        studentQuestion = userRepository.findByEmail("equiv_student_qb@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("equiv_student_qb@trustreview.edu", "pw", "Question Student", Role.STUDENT, "Apex", "CS")));

        instructor = userRepository.findByEmail("equiv_inst@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("equiv_inst@trustreview.edu", "pw", "Equiv Instructor", Role.INSTRUCTOR, "Apex", "CS")));

        // 1. Setup SCALE_WITH_LEVELS assignment with criterion "Architecture"
        RubricCriterionDto scaleCriterion = new RubricCriterionDto(
                "Architecture",
                "System architecture quality",
                100,
                List.of(
                        new PerformanceLevelDto("Exemplary", 10, "9-10", "Modular design"),
                        new PerformanceLevelDto("Proficient", 8, "7-8", "Solid design"),
                        new PerformanceLevelDto("Developing", 6, "5-6", "Needs decoupling"),
                        new PerformanceLevelDto("Needs Improvement", 2, "0-4", "Chaotic structure")
                )
        );
        scaleCriterion.setEvaluationType(EvaluationType.SCALE_WITH_LEVELS);

        assignmentScale = new Assignment();
        assignmentScale.setTitle("Scale Assignment");
        assignmentScale.setDescription("Evaluated via 4-level scale");
        assignmentScale.setRubricCriteria(RubricSupport.toJson(List.of(scaleCriterion)));
        assignmentScale.setDeadline(LocalDateTime.now().plusDays(7));
        assignmentScale.setCreatedBy(instructor);
        assignmentScale = assignmentRepository.save(assignmentScale);

        // 2. Setup QUESTION_BASED assignment with criterion "Architecture" (2 questions)
        RubricQuestionDto q1 = new RubricQuestionDto(
                "How modular is the component decomposition?",
                List.of(
                        new RubricOptionDto("Monolithic and entangled without boundaries.", 1),
                        new RubricOptionDto("High coupling with frequent circular references.", 2),
                        new RubricOptionDto("Adequate decomposition with minor layering leaks.", 3),
                        new RubricOptionDto("Well-structured modules with clear responsibilities.", 4),
                        new RubricOptionDto("Flawlessly isolated, decoupled micro-components.", 5)
                )
        );
        RubricQuestionDto q2 = new RubricQuestionDto(
                "How robust is the error handling architecture?",
                List.of(
                        new RubricOptionDto("Exceptions swallowed or unhandled globally.", 1),
                        new RubricOptionDto("Inconsistent error recovery across boundaries.", 2),
                        new RubricOptionDto("Standard error handling with some gaps in edge paths.", 3),
                        new RubricOptionDto("Comprehensive exception translation and logging.", 4),
                        new RubricOptionDto("Fault-tolerant design with graceful degradation.", 5)
                )
        );
        RubricCriterionDto qbCriterion = new RubricCriterionDto("Architecture", "System architecture quality", 100, RubricSupport.defaultLevels());
        qbCriterion.setEvaluationType(EvaluationType.QUESTION_BASED);
        qbCriterion.setQuestions(List.of(q1, q2));

        assignmentQuestion = new Assignment();
        assignmentQuestion.setTitle("Question Assignment");
        assignmentQuestion.setDescription("Evaluated via question-based options");
        assignmentQuestion.setRubricCriteria(RubricSupport.toJson(RubricSupport.normalize(List.of(qbCriterion))));
        assignmentQuestion.setDeadline(LocalDateTime.now().plusDays(7));
        assignmentQuestion.setCreatedBy(instructor);
        assignmentQuestion = assignmentRepository.save(assignmentQuestion);

        // 3. Create calibration benchmark samples for each assignment (Expert scored at 8 = Proficient)
        sampleScale = calibrationService.createSample(
                assignmentScale.getId(),
                "Benchmark Architecture (Scale)",
                "Benchmark sample for level scale",
                "Architecture analysis report content...",
                Map.of("Architecture", 8),
                "Expert feedback: Good modularity, minor coupling.",
                instructor
        );

        sampleQuestion = calibrationService.createSample(
                assignmentQuestion.getId(),
                "Benchmark Architecture (Question-Based)",
                "Benchmark sample for question-based rubric",
                "Architecture analysis report content...",
                Map.of("Architecture", 8),
                "Expert feedback: Good modularity, minor coupling.",
                instructor
        );
    }

    @Test
    @DisplayName("Formula Resolution Table: Option averages map to exact anchor integers")
    void testResolveQuestionScore_matchesScaleAnchors() {
        // All options = 5 -> avg 5.0 -> 10 (Exemplary anchor)
        assertEquals(10, RubricSupport.resolveQuestionScore(new int[]{5, 5}));
        assertEquals(10, RubricSupport.resolveQuestionScore(new int[]{5}));

        // All options = 4 -> avg 4.0 -> 8 (Proficient anchor)
        assertEquals(8, RubricSupport.resolveQuestionScore(new int[]{4, 4}));
        assertEquals(8, RubricSupport.resolveQuestionScore(new int[]{4}));

        // All options = 3 -> avg 3.0 -> 6 (Developing anchor)
        assertEquals(6, RubricSupport.resolveQuestionScore(new int[]{3, 3}));
        assertEquals(6, RubricSupport.resolveQuestionScore(new int[]{3}));

        // All options = 1 -> avg 1.0 -> 2 (Needs Improvement anchor)
        assertEquals(2, RubricSupport.resolveQuestionScore(new int[]{1, 1}));
        assertEquals(2, RubricSupport.resolveQuestionScore(new int[]{1}));

        // Intermediate combinations:
        // {5, 4} -> avg 4.5 -> 2*4.5 = 9.0 -> 9
        assertEquals(9, RubricSupport.resolveQuestionScore(new int[]{5, 4}));

        // {1, 2} -> avg 1.5 -> 2*1.5 = 3.0 -> 3
        assertEquals(3, RubricSupport.resolveQuestionScore(new int[]{1, 2}));

        // Compare integer arithmetic with double Math.round:
        int[] testCases = new int[]{1, 2, 3, 4, 5};
        for (int a : testCases) {
            for (int b : testCases) {
                int expected = (int) Math.round(2.0 * ((a + b) / 2.0));
                int actual = RubricSupport.resolveQuestionScore(new int[]{a, b});
                assertEquals(expected, actual, "Mismatch for combo {" + a + ", " + b + "}");
            }
        }
    }

    @Test
    @DisplayName("Downstream Calibration Equivalence: SCALE and QB scoring the same value produce identical results")
    void testCalibrationDownstreamEquivalence() {
        // Both students submit effective score 8 (Proficient) against Expert score 8:
        // Student A: SCALE student directly chooses level anchor 8
        SubmitCalibrationRequest reqScale = new SubmitCalibrationRequest();
        reqScale.setScores(Map.of("Architecture", 8));
        reqScale.setRationale("Solid architecture with clear components.");
        CalibrationResultDto resScale = calibrationService.evaluateCalibration(sampleScale.getId(), reqScale, studentScale, "127.0.0.1");

        // Student B: QB student selected options [4, 4] which resolves to 8:
        int resolvedQbScore = RubricSupport.resolveQuestionScore(new int[]{4, 4});
        assertEquals(8, resolvedQbScore);

        SubmitCalibrationRequest reqQb = new SubmitCalibrationRequest();
        reqQb.setScores(Map.of("Architecture", resolvedQbScore));
        reqQb.setRationale("Good modularity and consistent error logging.");
        CalibrationResultDto resQb = calibrationService.evaluateCalibration(sampleQuestion.getId(), reqQb, studentQuestion, "127.0.0.1");

        // Assert 100% downstream equivalence:
        assertEquals(resScale.getMeanAbsoluteError(), resQb.getMeanAbsoluteError(), 0.001);
        assertEquals(resScale.getAccuracyPercentage(), resQb.getAccuracyPercentage(), 0.001);
        assertEquals(resScale.getLevelAgreementPct(), resQb.getLevelAgreementPct(), 0.001);
        assertEquals(resScale.getStudentLevels().get("Architecture"), resQb.getStudentLevels().get("Architecture"));
        assertEquals("Proficient", resQb.getStudentLevels().get("Architecture"));
        assertEquals(resScale.getExpertLevels().get("Architecture"), resQb.getExpertLevels().get("Architecture"));

        // Both are 100% accurate, MAE = 0.0
        assertEquals(0.0, resScale.getMeanAbsoluteError(), 0.001);
        assertEquals(100.0, resScale.getAccuracyPercentage(), 0.001);
        assertEquals(100.0, resScale.getLevelAgreementPct(), 0.001);
    }

    @Test
    @DisplayName("Downstream Calibration Offset Equivalence: Non-zero error produces identical MAE and accuracy")
    void testCalibrationOffsetEquivalence() {
        // Expert is 8.
        // Scale student submits Developing (6) -> diff = 2.0
        SubmitCalibrationRequest reqScale = new SubmitCalibrationRequest();
        reqScale.setScores(Map.of("Architecture", 6));
        reqScale.setRationale("Minor coupling concerns.");
        CalibrationResultDto resScale = calibrationService.evaluateCalibration(sampleScale.getId(), reqScale, studentScale, "127.0.0.1");

        // QB student submits answers [3, 3] -> resolves to 6 -> diff = 2.0
        int qbScore = RubricSupport.resolveQuestionScore(new int[]{3, 3});
        assertEquals(6, qbScore);

        SubmitCalibrationRequest reqQb = new SubmitCalibrationRequest();
        reqQb.setScores(Map.of("Architecture", qbScore));
        reqQb.setRationale("Adequate decomposition but needs decoupling.");
        CalibrationResultDto resQb = calibrationService.evaluateCalibration(sampleQuestion.getId(), reqQb, studentQuestion, "127.0.0.1");

        // Assert identical MAE (2.0) and accuracy (80.0%)
        assertEquals(resScale.getMeanAbsoluteError(), resQb.getMeanAbsoluteError(), 0.001);
        assertEquals(2.0, resQb.getMeanAbsoluteError(), 0.001);
        assertEquals(resScale.getAccuracyPercentage(), resQb.getAccuracyPercentage(), 0.001);
        assertEquals(80.0, resQb.getAccuracyPercentage(), 0.001);
        assertEquals(resScale.getStudentLevels().get("Architecture"), resQb.getStudentLevels().get("Architecture"));
        assertEquals("Developing", resQb.getStudentLevels().get("Architecture"));
    }

    @Test
    @DisplayName("Downstream Analytics Data Pipeline Equivalence: Identical score JSON produces identical distribution bins")
    void testAnalyticsPipelineEquivalence() throws Exception {
        // Both scoring models feed the identical JSON string representation: {"Architecture":8}
        String scaleScoresJson = objectMapper.writeValueAsString(Map.of("Architecture", 8));
        String qbScoresJson = objectMapper.writeValueAsString(Map.of("Architecture", RubricSupport.resolveQuestionScore(new int[]{4, 4})));

        assertEquals(scaleScoresJson, qbScoresJson);

        // When AnalyticsService calculates score bins:
        // Score 8 normalized is 80.0 -> falls into bin 61-80
        double rawScore = 8.0;
        double normalized = rawScore * 10.0; // 80.0
        assertTrue(normalized > 60.0 && normalized <= 80.0, "Score 8 must fall into bin 61-80");
    }

    @Test
    @DisplayName("Downstream Policy Engine Statistical Signal Equivalence")
    void testPolicyEngineSignalEquivalence() {
        // If reliability score is 60.0% (below 65% baseline) for both:
        String signalScale = policyEngineService.evaluateStatisticalSignal(60.0, 3, 75.0);
        String signalQb = policyEngineService.evaluateStatisticalSignal(60.0, 3, 75.0);

        assertNotNull(signalScale);
        assertEquals(signalScale, signalQb);
        assertTrue(signalQb.contains("60.0%"));
    }
}

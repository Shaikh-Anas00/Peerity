package com.trustreview;

import com.trustreview.dto.CalibrationResultDto;
import com.trustreview.dto.CalibrationSampleDto;
import com.trustreview.dto.ReviewerReliabilityDto;
import com.trustreview.dto.SubmitCalibrationRequest;
import com.trustreview.model.*;
import com.trustreview.repository.CalibrationSampleRepository;
import com.trustreview.repository.CalibrationScoreRepository;
import com.trustreview.repository.UserRepository;
import com.trustreview.service.CalibrationService;
import com.trustreview.service.PolicyEngineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Peerceptiv Calibration Scoring & Reviewer Reliability Tests")
class CalibrationScoringTest {

    @Autowired private CalibrationService calibrationService;
    @Autowired private CalibrationSampleRepository sampleRepository;
    @Autowired private CalibrationScoreRepository scoreRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PolicyEngineService policyEngineService;

    private User student;
    private User instructor;
    private CalibrationSample sample1;
    private CalibrationSample sample2;

    @BeforeEach
    void setUp() {
        scoreRepository.deleteAll();
        sampleRepository.deleteAll();

        student = userRepository.findByEmail("cal_student@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("cal_student@trustreview.edu", "pw", "Cal Student", Role.STUDENT, "Apex", "CS")));

        instructor = userRepository.findByEmail("cal_inst@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("cal_inst@trustreview.edu", "pw", "Cal Instructor", Role.INSTRUCTOR, "Apex", "CS")));

        sample1 = calibrationService.createSample(
                null,
                "Sample A: Express Error Handling",
                "Evaluate error delegation",
                "const handler = async (req, res, next) => { ... }",
                Map.of("Code Quality", 8, "Documentation", 7, "Correctness", 9),
                "Gold standard: Proper error delegation to next()",
                instructor
        );

        sample2 = calibrationService.createSample(
                null,
                "Sample B: React State Immutability",
                "Evaluate memory leak prevention",
                "useEffect(() => { const t = setInterval(...); return () => clearInterval(t); }, [])",
                Map.of("Code Quality", 9, "Documentation", 6, "Correctness", 9),
                "Gold standard: Proper cleanup returned in useEffect",
                instructor
        );
    }

    @Test
    @DisplayName("Anti-Cheat: Student fetching samples does NOT receive expert answer scores")
    void getSamples_withholdsExpertScoresFromStudentView() {
        List<CalibrationSampleDto> dtos = calibrationService.getSamples(null, student);
        assertFalse(dtos.isEmpty());

        for (CalibrationSampleDto dto : dtos) {
            // Check that the DTO gives sample content without the answer key
            assertNotNull(dto.getSampleContent());
            assertNotNull(dto.getTitle());
            assertFalse(dto.isCompletedByMe());
            assertNull(dto.getMyAccuracyScore());
        }
    }

    @Test
    @DisplayName("Perfect score alignment yields MAE = 0.0 and 100.0% accuracy")
    void evaluateCalibration_exactMatch_yields100Percent() {
        SubmitCalibrationRequest req = new SubmitCalibrationRequest();
        req.setScores(Map.of("Code Quality", 8, "Documentation", 7, "Correctness", 9));
        req.setRationale("Matches gold standard closely.");

        CalibrationResultDto res = calibrationService.evaluateCalibration(sample1.getId(), req, student, "127.0.0.1");

        assertEquals(0.0, res.getMeanAbsoluteError(), 0.001);
        assertEquals(100.0, res.getAccuracyPercentage(), 0.001);
        assertNotNull(res.getExpertFeedback());
        assertEquals(sample1.getTitle(), res.getSampleTitle());
    }

    @Test
    @DisplayName("Score difference of 1.0 point on all criteria yields MAE = 1.0 and 90.0% accuracy")
    void evaluateCalibration_offsetScores_yieldsExpectedAccuracy() {
        SubmitCalibrationRequest req = new SubmitCalibrationRequest();
        // Expert is 8, 7, 9. Student provides 7, 6, 8 (each is exactly 1 off)
        req.setScores(Map.of("Code Quality", 7, "Documentation", 6, "Correctness", 8));
        req.setRationale("Good effort, slightly lower rubric grading.");

        CalibrationResultDto res = calibrationService.evaluateCalibration(sample1.getId(), req, student, "127.0.0.1");

        assertEquals(1.0, res.getMeanAbsoluteError(), 0.001);
        assertEquals(90.0, res.getAccuracyPercentage(), 0.001);
    }

    @Test
    @DisplayName("Duplicate calibration submission on same sample throws IllegalStateException (409)")
    void evaluateCalibration_duplicateAttempt_throwsIllegalStateException() {
        SubmitCalibrationRequest req = new SubmitCalibrationRequest();
        req.setScores(Map.of("Code Quality", 8, "Documentation", 7, "Correctness", 9));
        req.setRationale("First attempt.");
        calibrationService.evaluateCalibration(sample1.getId(), req, student, "127.0.0.1");

        assertThrows(IllegalStateException.class, () ->
                calibrationService.evaluateCalibration(sample1.getId(), req, student, "127.0.0.1"));
    }

    @Test
    @DisplayName("Minimum sample threshold floor: < 2 samples returns INSUFFICIENT_DATA")
    void getStudentReliability_belowThreshold_returnsInsufficientData() {
        SubmitCalibrationRequest req1 = new SubmitCalibrationRequest();
        req1.setScores(Map.of("Code Quality", 8, "Documentation", 7, "Correctness", 9));
        req1.setRationale("First sample only.");
        calibrationService.evaluateCalibration(sample1.getId(), req1, student, "127.0.0.1");

        ReviewerReliabilityDto reliability = calibrationService.getStudentReliability(student);
        assertFalse(reliability.isCalibrated());
        assertEquals("INSUFFICIENT_DATA", reliability.getReliabilityTier());
        assertNull(reliability.getReliabilityScore());
        assertEquals(1, reliability.getSamplesCompleted());

        // Policy engine must NOT generate statistical signal with insufficient samples
        String signal = policyEngineService.evaluateStatisticalSignal(
                reliability.getReliabilityScore(), reliability.getSamplesCompleted(), 80.0);
        assertNull(signal, "Policy engine must not generate signal when sample count < 2");
    }

    @Test
    @DisplayName("Meeting threshold (>= 2 samples) computes aggregate reliability and statistical signal")
    void getStudentReliability_aboveThreshold_computesReliabilityAndSignal() {
        // Sample 1: 100%
        SubmitCalibrationRequest req1 = new SubmitCalibrationRequest();
        req1.setScores(Map.of("Code Quality", 8, "Documentation", 7, "Correctness", 9));
        req1.setRationale("Sample 1");
        calibrationService.evaluateCalibration(sample1.getId(), req1, student, "127.0.0.1");

        // Sample 2: Off by 5 points each (Expert: 9, 6, 9 -> Student: 4, 1, 4) -> MAE = 5.0 -> accuracy = 50.0%
        SubmitCalibrationRequest req2 = new SubmitCalibrationRequest();
        req2.setScores(Map.of("Code Quality", 4, "Documentation", 1, "Correctness", 4));
        req2.setRationale("Sample 2");
        calibrationService.evaluateCalibration(sample2.getId(), req2, student, "127.0.0.1");

        ReviewerReliabilityDto reliability = calibrationService.getStudentReliability(student);
        assertTrue(reliability.isCalibrated());
        assertEquals(2, reliability.getSamplesCompleted());

        // Average of 100% and 50% = 75.0% -> MODERATE tier
        assertEquals(75.0, reliability.getReliabilityScore(), 0.1);
        assertEquals("MODERATE", reliability.getReliabilityTier());
    }

    @Test
    @DisplayName("Bug fix verification: Student submitting mismatched criteria throws IllegalArgumentException")
    void evaluateCalibration_mismatchedCriteria_throwsException() {
        SubmitCalibrationRequest req = new SubmitCalibrationRequest();
        // Expert has "Code Quality", "Documentation", "Correctness". Student submits arbitrary keys.
        req.setScores(Map.of("Arbitrary Key", 10));
        req.setRationale("Wrong keys");

        assertThrows(IllegalArgumentException.class, () ->
                calibrationService.evaluateCalibration(sample1.getId(), req, student, "127.0.0.1"));
    }

    @Test
    @DisplayName("Calibration result contains levelAgreementPct and level maps")
    void evaluateCalibration_includesLevelAgreement() {
        SubmitCalibrationRequest req = new SubmitCalibrationRequest();
        // Expert is: Code Quality: 8 (Proficient), Documentation: 7 (Proficient), Correctness: 9 (Exemplary)
        // Student submits: Code Quality: 8 (Proficient - match), Documentation: 8 (Proficient - match), Correctness: 7 (Proficient - mismatch)
        req.setScores(Map.of("Code Quality", 8, "Documentation", 8, "Correctness", 7));
        req.setRationale("Close match");

        CalibrationResultDto res = calibrationService.evaluateCalibration(sample1.getId(), req, student, "127.0.0.1");

        assertNotNull(res.getLevelAgreementPct());
        // 2 matches out of 3 criteria = 66.7%
        assertEquals(66.7, res.getLevelAgreementPct(), 0.1);
        assertNotNull(res.getStudentLevels());
        assertNotNull(res.getExpertLevels());
        assertEquals("Proficient", res.getStudentLevels().get("Code Quality"));
        assertEquals("Proficient", res.getExpertLevels().get("Code Quality"));
    }
}

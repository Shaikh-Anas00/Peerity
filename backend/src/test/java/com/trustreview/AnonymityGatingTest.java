package com.trustreview;

import com.trustreview.dto.AppealDto;
import com.trustreview.dto.CreateAppealRequest;
import com.trustreview.dto.SubmitCalibrationRequest;
import com.trustreview.model.*;
import com.trustreview.repository.*;
import com.trustreview.service.AppealService;
import com.trustreview.service.CalibrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@DisplayName("Anonymity Protection & Disclosure-Tier Gating Tests (Calibration & Rating Evidence)")
class AnonymityGatingTest {

    @Autowired private AppealService appealService;
    @Autowired private CalibrationService calibrationService;
    @Autowired private CalibrationSampleRepository sampleRepository;
    @Autowired private CalibrationScoreRepository scoreRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private AppealRepository appealRepository;
    @Autowired private UserRepository userRepository;

    private User appellant;
    private User reviewer;
    private User committeeMember;
    private User instructor;
    private Appeal appeal;

    @BeforeEach
    void setUp() {
        scoreRepository.deleteAll();
        sampleRepository.deleteAll();
        appealRepository.deleteAll();
        reviewRepository.deleteAll();

        appellant = userRepository.findByEmail("anon_appellant@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("anon_appellant@trustreview.edu", "pw", "Anon Appellant", Role.STUDENT, "Apex", "CS")));

        reviewer = userRepository.findByEmail("anon_reviewer@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("anon_reviewer@trustreview.edu", "pw", "Anon Reviewer", Role.STUDENT, "Apex", "CS")));

        committeeMember = userRepository.findByEmail("anon_comm@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("anon_comm@trustreview.edu", "pw", "Anon Committee", Role.COMMITTEE, "Apex", "CS")));

        instructor = userRepository.findByEmail("anon_inst@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("anon_inst@trustreview.edu", "pw", "Anon Inst", Role.INSTRUCTOR, "Apex", "CS")));

        // Give the reviewer 2 calibration scores so they are calibrated
        CalibrationSample s1 = calibrationService.createSample(null, "Sample 1", "desc", "code 1",
                Map.of("Quality", 8), "Gold", instructor);
        CalibrationSample s2 = calibrationService.createSample(null, "Sample 2", "desc", "code 2",
                Map.of("Quality", 8), "Gold", instructor);

        SubmitCalibrationRequest cr1 = new SubmitCalibrationRequest();
        cr1.setScores(Map.of("Quality", 8));
        cr1.setRationale("Good");
        calibrationService.evaluateCalibration(s1.getId(), cr1, reviewer, "127.0.0.1");

        SubmitCalibrationRequest cr2 = new SubmitCalibrationRequest();
        cr2.setScores(Map.of("Quality", 8));
        cr2.setRationale("Good");
        calibrationService.evaluateCalibration(s2.getId(), cr2, reviewer, "127.0.0.1");

        // Create assignment, submission, review, appeal
        Assignment a = new Assignment();
        a.setTitle("Anonymity Gating Assignment");
        a.setDescription("desc");
        a.setRubricCriteria("[\"Quality\"]");
        a.setDeadline(LocalDateTime.now().plusDays(5));
        a.setCreatedBy(instructor);
        a = assignmentRepository.save(a);

        Submission sub = new Submission();
        sub.setAssignment(a);
        sub.setAuthor(appellant);
        sub.setOriginalFileName("work.pdf");
        sub.setFilePath("work.enc");
        sub.setFileHash("hash");
        sub.setFileSize("10 KB");
        sub.setFileType("application/pdf");
        sub.setStatus("SUBMITTED");
        sub.setSubmittedAt(LocalDateTime.now());
        sub = submissionRepository.save(sub);

        Review rev = new Review();
        rev.setSubmission(sub);
        rev.setReviewer(reviewer);
        rev.setReviewerPseudonym("Reviewer-AnonTest");
        rev.setStatus("COMPLETED");
        rev.setScores("{\"Quality\":4}");
        rev.setFeedbackText("Needs work");
        rev.setSubmittedAt(LocalDateTime.now());
        rev = reviewRepository.save(rev);

        CreateAppealRequest car = new CreateAppealRequest();
        car.setReviewId(rev.getId());
        car.setReason(AppealReason.UNFAIR_GRADING_OUTLIER);
        car.setStatement("Dispute on quality rating.");
        var appealDto = appealService.createAppeal(car, appellant, "127.0.0.1");

        appeal = appealRepository.findById(appealDto.getId()).orElseThrow();
    }

    @Test
    @DisplayName("Critical Anonymity Gate: Committee browsing open appeal does NOT see reviewer reliability profile")
    void committeeViewingPendingAppeal_withholdsReviewerReliabilityProfile() {
        // When committee views the appeal while disclosure has NOT been approved (PENDING_APPROVAL)
        AppealDto dto = appealService.enrichAppealDto(appeal, committeeMember);

        // Assert: Reviewer's aggregate calibration score, count, and statistical notes are strictly withheld (null)
        assertNull(dto.getReviewerReliabilityScore(), "Reliability score must be withheld before quorum approval");
        assertNull(dto.getReviewerCalibrationCount(), "Calibration count must be withheld before quorum approval");
        assertNull(dto.getReviewerHelpfulPercentage(), "Helpfulness stats must be withheld before quorum approval");
        assertNull(dto.getStatisticalSignalNote(), "Statistical signal note must be withheld before quorum approval");

        // Pseudonym must still be present
        assertEquals("Reviewer-AnonTest", dto.getReviewerPseudonym());
    }

    @Test
    @DisplayName("Disclosure Tier Gate: Once Quorum approves Level 1+, reviewer calibration profile is unlocked")
    void approvedDisclosure_revealsReviewerReliabilityProfile() {
        // Simulate quorum approval unlocking Level 1
        appeal.getDisclosureRequest().setStatus(DisclosureStatus.APPROVED);
        appeal.getDisclosureRequest().setRequestedLevel(DisclosureLevel.LEVEL_1_ELIGIBILITY);
        appeal = appealRepository.save(appeal);

        AppealDto dto = appealService.enrichAppealDto(appeal, committeeMember);

        // Assert: Reliability profile is now legitimately disclosed under Level 1+ authorization
        assertNotNull(dto.getReviewerReliabilityScore(), "Reliability score must be unlocked after Level 1 approval");
        assertEquals(100.0, dto.getReviewerReliabilityScore(), 0.1);
        assertEquals(2, dto.getReviewerCalibrationCount());
    }

    @Test
    @DisplayName("Course Instructor viewing appeal sees calibration profile (grading oversight authority)")
    void instructorViewingAppeal_seesCalibrationProfile() {
        AppealDto dto = appealService.enrichAppealDto(appeal, instructor);

        assertNotNull(dto.getReviewerReliabilityScore(), "Course instructor has oversight authority");
        assertEquals(100.0, dto.getReviewerReliabilityScore(), 0.1);
    }
}

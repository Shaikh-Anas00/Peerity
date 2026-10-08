package com.trustreview;

import com.trustreview.dto.ReviewRatingDto;
import com.trustreview.dto.SubmitReviewRatingRequest;
import com.trustreview.model.*;
import com.trustreview.repository.*;
import com.trustreview.service.ReviewRatingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Kritik Feedback-Quality Rating Tests")
class FeedbackQualityTest {

    @Autowired private ReviewRatingService reviewRatingService;
    @Autowired private ReviewRatingRepository ratingRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private AppealRepository appealRepository;
    @Autowired private UserRepository userRepository;

    private User author;
    private User reviewer;
    private User bystander;
    private Assignment assignment;
    private Submission submission;
    private Review review;

    @BeforeEach
    void setUp() {
        ratingRepository.deleteAll();
        appealRepository.deleteAll();
        reviewRepository.deleteAll();

        author = userRepository.findByEmail("fq_author@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("fq_author@trustreview.edu", "pw", "FQ Author", Role.STUDENT, "Apex", "CS")));

        reviewer = userRepository.findByEmail("fq_reviewer@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("fq_reviewer@trustreview.edu", "pw", "FQ Reviewer", Role.STUDENT, "Apex", "CS")));

        bystander = userRepository.findByEmail("fq_bystander@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("fq_bystander@trustreview.edu", "pw", "FQ Bystander", Role.STUDENT, "Apex", "CS")));

        User instructor = userRepository.findByEmail("fq_inst@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("fq_inst@trustreview.edu", "pw", "FQ Inst", Role.INSTRUCTOR, "Apex", "CS")));

        assignment = new Assignment();
        assignment.setTitle("Feedback Quality Test Assignment");
        assignment.setDescription("Test");
        assignment.setRubricCriteria("[\"Correctness\"]");
        assignment.setDeadline(LocalDateTime.now().plusDays(5));
        assignment.setCreatedBy(instructor);
        assignment = assignmentRepository.save(assignment);

        submission = new Submission();
        submission.setAssignment(assignment);
        submission.setAuthor(author);
        submission.setOriginalFileName("code.zip");
        submission.setFilePath("code.enc");
        submission.setFileHash("hash");
        submission.setFileSize("12 KB");
        submission.setFileType("application/zip");
        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());
        submission = submissionRepository.save(submission);

        review = new Review();
        review.setSubmission(submission);
        review.setReviewer(reviewer);
        review.setReviewerPseudonym("Reviewer-Kritik");
        review.setStatus("COMPLETED");
        review.setScores("{\"Correctness\":9}");
        review.setFeedbackText("Clear logic and good error handling.");
        review.setSubmittedAt(LocalDateTime.now());
        review = reviewRepository.save(review);
    }

    @Test
    @DisplayName("Author submits review rating -> 1-5 stars, helpfulness, and comment stored")
    void rateReview_author_persistsRating() {
        SubmitReviewRatingRequest req = new SubmitReviewRatingRequest();
        req.setRating(5);
        req.setIsHelpful(true);
        req.setComment("Incisive critique on async handling.");

        ReviewRatingDto dto = reviewRatingService.rateReview(review.getId(), req, author, "127.0.0.1");

        assertNotNull(dto.getId());
        assertEquals(5, dto.getRating());
        assertTrue(dto.getIsHelpful());
        assertEquals("Incisive critique on async handling.", dto.getComment());
        assertEquals("Reviewer-Kritik", dto.getReviewerPseudonym(), "Must reference review by pseudonym");
    }

    @Test
    @DisplayName("Non-author attempting to rate review throws SecurityException (403)")
    void rateReview_nonAuthor_throwsSecurityException() {
        SubmitReviewRatingRequest req = new SubmitReviewRatingRequest();
        req.setRating(4);
        req.setIsHelpful(true);
        req.setComment("I am not the author.");

        assertThrows(SecurityException.class, () ->
                reviewRatingService.rateReview(review.getId(), req, bystander, "127.0.0.1"));
    }

    @Test
    @DisplayName("Duplicate rating attempt throws IllegalStateException (409)")
    void rateReview_duplicate_throwsIllegalStateException() {
        SubmitReviewRatingRequest req = new SubmitReviewRatingRequest();
        req.setRating(4);
        req.setIsHelpful(true);
        req.setComment("First rating");
        reviewRatingService.rateReview(review.getId(), req, author, "127.0.0.1");

        assertThrows(IllegalStateException.class, () ->
                reviewRatingService.rateReview(review.getId(), req, author, "127.0.0.1"));
    }

    @Test
    @DisplayName("Anti-Manufactured Evidence Rule: Rating locked once appeal has been filed")
    void rateReview_afterAppealFiled_throwsIllegalStateException() {
        Appeal appeal = new Appeal();
        appeal.setReview(review);
        appeal.setAppellant(author);
        appeal.setReason(AppealReason.UNFAIR_GRADING_OUTLIER);
        appeal.setStatement("Disputing review score");
        appeal.setStatus(AppealStatus.SUBMITTED);
        appealRepository.save(appeal);

        SubmitReviewRatingRequest req = new SubmitReviewRatingRequest();
        req.setRating(1);
        req.setIsHelpful(false);
        req.setComment("Retaliatory rating attempt.");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                reviewRatingService.rateReview(review.getId(), req, author, "127.0.0.1"));
        assertTrue(ex.getMessage().contains("appeal has already been filed"));
    }

    @Test
    @DisplayName("Reviewer feedback stats correctly computes average stars and helpfulness rate")
    void getReviewerFeedbackStats_computesCorrectAverages() {
        // Rating 1: 5 stars, helpful
        SubmitReviewRatingRequest req1 = new SubmitReviewRatingRequest();
        req1.setRating(5);
        req1.setIsHelpful(true);
        req1.setComment("Helpful review");
        reviewRatingService.rateReview(review.getId(), req1, author, "127.0.0.1");

        var stats = reviewRatingService.getReviewerFeedbackStats(reviewer);
        assertEquals(1, stats.totalRated());
        assertEquals(5.0, stats.averageRating(), 0.01);
        assertEquals(100.0, stats.helpfulPercentage(), 0.01);
    }
}

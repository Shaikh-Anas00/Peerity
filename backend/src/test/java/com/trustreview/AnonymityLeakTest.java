package com.trustreview;

import com.trustreview.model.*;
import com.trustreview.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.hamcrest.Matchers.*;

/**
 * Anonymity Leak Tests (Double-Blind Invariants).
 *
 * Asserts that no reviewer-facing or author-facing JSON response ever
 * contains real names, real emails, real reviewer IDs, or the original
 * submission filename (which may contain the author''s name/student-ID).
 *
 * The two critical views under test:
 *   GET /api/reviews/my-feedback      -- author sees their received reviews
 *   GET /api/reviews/assigned-to-me   -- reviewer sees their assignments
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Anonymity Leak Tests — Double-Blind Invariants")
class AnonymityLeakTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private ReviewRepository reviewRepository;

    private static final String AUTHOR_EMAIL   = "anon_author@trustreview.edu";
    private static final String REVIEWER_EMAIL = "anon_reviewer@trustreview.edu";
    private static final String REAL_FILE_NAME = "alice_student12345_project.pdf";
    private static final String REAL_REVIEWER_NAME = "Bob Martinez Real Name";

    @BeforeEach
    void setUp() {
        if (userRepository.existsByEmail(AUTHOR_EMAIL)) return;

        User author = userRepository.save(new User(
                AUTHOR_EMAIL, "hash", "Alice Author", Role.STUDENT, "Apex", "CS"));

        User reviewer = userRepository.save(new User(
                REVIEWER_EMAIL, "hash", REAL_REVIEWER_NAME, Role.STUDENT, "Apex", "CS"));

        User instructor = userRepository.save(new User(
                "anon_instructor@trustreview.edu", "hash", "Anon Instructor", Role.INSTRUCTOR, "Apex", "CS"));

        Assignment assignment = new Assignment();
        assignment.setTitle("Anonymity Test Assignment");
        assignment.setDescription("For anonymity leak tests");
        assignment.setRubricCriteria("[\"Quality\"]");
        assignment.setDeadline(LocalDateTime.now().plusDays(30));
        assignment.setCreatedBy(instructor);
        assignment = assignmentRepository.save(assignment);

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setAuthor(author);
        submission.setOriginalFileName(REAL_FILE_NAME);
        submission.setFilePath("dummy.enc");
        submission.setFileHash("abcd1234");
        submission.setFileSize("10 KB");
        submission.setFileType("application/pdf");
        submission.setStatus("SUBMITTED");
        submission.setSubmittedAt(LocalDateTime.now());
        submission = submissionRepository.save(submission);

        Review review = new Review();
        review.setSubmission(submission);
        review.setReviewer(reviewer);
        review.setReviewerPseudonym("Reviewer-B7");
        review.setScores("{\"Quality\":8}");
        review.setFeedbackText("Good work.");
        review.setStatus("COMPLETED");
        review.setSubmittedAt(LocalDateTime.now());
        reviewRepository.save(review);
    }

    // ── Author view: GET /api/reviews/my-feedback ────────────────────────────

    @Test
    @WithMockUser(username = AUTHOR_EMAIL, roles = "STUDENT")
    @DisplayName("Author view: reviewerName must be null/absent (identity masked)")
    void authorView_reviewerName_isNull() throws Exception {
        mockMvc.perform(get("/api/reviews/my-feedback"))
            .andExpect(status().isOk())
            // reviewerName must not be populated with the real name
            .andExpect(result -> {
                String body = result.getResponse().getContentAsString();
                assert !body.contains(REAL_REVIEWER_NAME)
                    : "reviewerName leaked in author view: " + body;
            });
    }

    @Test
    @WithMockUser(username = AUTHOR_EMAIL, roles = "STUDENT")
    @DisplayName("Author view: reviewerEmail must be null/absent (identity masked)")
    void authorView_reviewerEmail_isNull() throws Exception {
        mockMvc.perform(get("/api/reviews/my-feedback"))
            .andExpect(status().isOk())
            .andExpect(result -> {
                String body = result.getResponse().getContentAsString();
                assert !body.contains(REVIEWER_EMAIL)
                    : "reviewerEmail leaked in author view: " + body;
            });
    }

    @Test
    @WithMockUser(username = AUTHOR_EMAIL, roles = "STUDENT")
    @DisplayName("Author view: reviewerId must be null/absent (identity masked)")
    void authorView_reviewerId_isNull() throws Exception {
        mockMvc.perform(get("/api/reviews/my-feedback"))
            .andExpect(status().isOk())
            .andExpect(result -> {
                String body = result.getResponse().getContentAsString();
                assert !body.contains("anon_reviewer@trustreview.edu")
                    : "reviewerId/email leaked in author view: " + body;
            });
    }

    @Test
    @WithMockUser(username = AUTHOR_EMAIL, roles = "STUDENT")
    @DisplayName("Author view: reviewerPseudonym must be present and non-null")
    void authorView_pseudonym_isPresent() throws Exception {
        mockMvc.perform(get("/api/reviews/my-feedback"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].reviewerPseudonym", not(emptyOrNullString())));
    }

    @Test
    @WithMockUser(username = AUTHOR_EMAIL, roles = "STUDENT")
    @DisplayName("Author view: real reviewer name must NOT appear anywhere in response body")
    void authorView_realReviewerName_notInBody() throws Exception {
        mockMvc.perform(get("/api/reviews/my-feedback"))
            .andExpect(status().isOk())
            .andExpect(result -> {
                String body = result.getResponse().getContentAsString();
                assert !body.contains(REAL_REVIEWER_NAME)
                    : "Real reviewer name leaked in author-facing response: " + body;
                assert !body.contains(REVIEWER_EMAIL)
                    : "Real reviewer email leaked in author-facing response: " + body;
            });
    }

    // ── Reviewer view: GET /api/reviews/assigned-to-me ───────────────────────

    @Test
    @WithMockUser(username = REVIEWER_EMAIL, roles = "STUDENT")
    @DisplayName("Reviewer view: submission filename must be masked (not original)")
    void reviewerView_filename_isMasked() throws Exception {
        mockMvc.perform(get("/api/reviews/assigned-to-me"))
            .andExpect(status().isOk())
            .andExpect(result -> {
                String body = result.getResponse().getContentAsString();
                // Original file name must be replaced with masked version
                assert !body.contains(REAL_FILE_NAME)
                    : "Original filename leaked to reviewer: " + body;
                // Masked name must contain the assignment prefix pattern
                assert body.contains("submission_")
                    : "Expected masked filename 'submission_<prefix>' not found in: " + body;
            });
    }

    @Test
    @WithMockUser(username = REVIEWER_EMAIL, roles = "STUDENT")
    @DisplayName("Reviewer view: author real name must NOT appear in response")
    void reviewerView_authorName_notInBody() throws Exception {
        mockMvc.perform(get("/api/reviews/assigned-to-me"))
            .andExpect(status().isOk())
            .andExpect(result -> {
                String body = result.getResponse().getContentAsString();
                assert !body.contains("Alice Author")
                    : "Author real name leaked to reviewer: " + body;
                assert !body.contains(AUTHOR_EMAIL)
                    : "Author email leaked to reviewer: " + body;
            });
    }
}

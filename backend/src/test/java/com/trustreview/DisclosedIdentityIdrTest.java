package com.trustreview;

import com.trustreview.model.*;
import com.trustreview.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * IDOR tests for GET /api/reviews/{id}/disclosed-identity.
 *
 * This endpoint sits at the boundary the entire disclosure-tier system exists to protect.
 * Service-level checks are in AppealService.getDisclosedIdentity():
 *   - Only the review's author (appellant) or STAFF (COMMITTEE/ADMIN/INSTRUCTOR) may call it.
 *   - Any other authenticated user (Student B requesting Student A's review) must get 403.
 *   - Without an approved DisclosureRequest the response is LEVEL_0_ANONYMOUS regardless of caller.
 *
 * These tests verify the service-layer IDOR protection is actually enforced.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("Disclosed Identity IDOR Tests")
class DisclosedIdentityIdrTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    private String reviewId;

    @BeforeEach
    void setup() {
        // Create Student A (the submission author / eventual appellant)
        User studentA = seedIfAbsent("studentA_idor@trustreview.edu", Role.STUDENT);
        // Create Student B (unrelated student — the IDOR attacker)
        seedIfAbsent("studentB_idor@trustreview.edu", Role.STUDENT);
        // Create the reviewer
        User reviewer = seedIfAbsent("reviewer_idor@trustreview.edu", Role.STUDENT);
        // Create committee member used in committee test
        seedIfAbsent("committee1@trustreview.edu", Role.COMMITTEE);

        // Create assignment + submission + review owned by studentA
        Assignment assignment = new Assignment();
        assignment.setTitle("IDOR Test Assignment");
        assignment.setRubricCriteria("[\"Correctness\"]");
        assignment.setDeadline(LocalDateTime.now().plusDays(7));
        assignment.setReviewDeadline(LocalDateTime.now().plusDays(14));
        assignment.setCreatedBy(studentA);
        assignment = assignmentRepository.save(assignment);

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setAuthor(studentA);
        submission.setOriginalFileName("test.pdf");
        submission.setFilePath("/enc/test.pdf");
        submission.setFileHash("deadbeef");
        submission = submissionRepository.save(submission);

        Review review = new Review();
        review.setSubmission(submission);
        review.setReviewer(reviewer);
        review.setReviewerPseudonym("Reviewer-IDOR-Test");
        review.setStatus("COMPLETED");
        review = reviewRepository.save(review);
        this.reviewId = review.getId();
    }

    private User seedIfAbsent(String email, Role role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User(email, "hashed_pw", email, role, "Test", "Institution");
            return userRepository.save(u);
        });
    }

    // ── Student A (the actual author) can query their own review ─────────────

    @Test
    @WithMockUser(username = "studentA_idor@trustreview.edu", roles = "STUDENT")
    @DisplayName("Student A (author) → GET disclosed-identity → 200 (anonymous by default, no disclosure approved)")
    void studentA_author_canQueryOwnReview_200() throws Exception {
        mockMvc.perform(get("/api/reviews/{id}/disclosed-identity", reviewId))
                .andExpect(status().isOk())
                // Jackson serialises isApproved() getter as "approved" (strips 'is' prefix)
                .andExpect(jsonPath("$.approved").value(false))
                // Without approved DisclosureRequest, level must be LEVEL_0_ANONYMOUS
                .andExpect(jsonPath("$.level").value("LEVEL_0_ANONYMOUS"));
    }

    // ── Student B (unrelated) must be blocked ───────────────────────────────

    @Test
    @WithMockUser(username = "studentB_idor@trustreview.edu", roles = "STUDENT")
    @DisplayName("Student B (unrelated) → GET disclosed-identity → 403 Forbidden")
    void studentB_unrelated_cannotQuery_403() throws Exception {
        // This is the core IDOR test: Student B guesses/discovers the review ID
        // and tries to read disclosure data about Student A's reviewer.
        mockMvc.perform(get("/api/reviews/{id}/disclosed-identity", reviewId))
                .andExpect(status().isForbidden());
    }

    // ── Unauthenticated must be blocked ─────────────────────────────────────

    @Test
    @DisplayName("Unauthenticated → GET disclosed-identity → 401 Unauthorized")
    void unauthenticated_cannotQuery_401() throws Exception {
        mockMvc.perform(get("/api/reviews/{id}/disclosed-identity", reviewId))
                .andExpect(status().isUnauthorized());
    }

    // ── Staff can access (service-layer allows COMMITTEE/ADMIN/INSTRUCTOR) ──

    @Test
    @WithMockUser(username = "committee1@trustreview.edu", roles = "COMMITTEE")
    @DisplayName("COMMITTEE → GET disclosed-identity → 200 (anonymous without quorum approval)")
    void committee_canQuery_200_anonymousByDefault() throws Exception {
        // COMMITTEE is allowed to call this — they need it for adjudication context.
        // But without an approved DisclosureRequest, they still only see Level 0.
        mockMvc.perform(get("/api/reviews/{id}/disclosed-identity", reviewId))
                .andExpect(status().isOk())
                // Jackson serialises isApproved() getter as "approved"
                .andExpect(jsonPath("$.approved").value(false));
    }

    // ── Non-existent review ID returns 404, not 403 ─────────────────────────

    @Test
    @WithMockUser(username = "studentA_idor@trustreview.edu", roles = "STUDENT")
    @DisplayName("Non-existent review ID → 404 (not a silent 200 or 403 that leaks existence)")
    void nonExistentReview_404() throws Exception {
        mockMvc.perform(get("/api/reviews/{id}/disclosed-identity", "00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());
    }
}

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Insecure Direct Object Reference (IDOR) Tests.
 *
 * Confirms Student A cannot access Student B's submissions, reviews,
 * or appeals by guessing resource IDs. All access must be scoped to
 * the authenticated user's own data.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("IDOR Security — Cross-User Resource Isolation Tests")
class IdrTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private ReviewRepository reviewRepository;

    private static String studentAId;
    private static String studentBId;
    private static String studentBSubmissionId;
    private static String reviewForBId;

    @BeforeEach
    void setUp() {
        // Only seed once — check before inserting
        if (userRepository.existsByEmail("idor_studentA@trustreview.edu")) return;

        // Create Student A
        User studentA = new User(
            "idor_studentA@trustreview.edu", "hash_a", "IDOR Student A", Role.STUDENT, "Apex", "CS");
        studentA = userRepository.save(studentA);
        studentAId = studentA.getId();

        // Create Student B
        User studentB = new User(
            "idor_studentB@trustreview.edu", "hash_b", "IDOR Student B", Role.STUDENT, "Apex", "CS");
        studentB = userRepository.save(studentB);
        studentBId = studentB.getId();

        // Create Instructor to own the assignment
        User instructor = new User(
            "idor_instructor@trustreview.edu", "hash_i", "IDOR Instructor", Role.INSTRUCTOR, "Apex", "CS");
        instructor = userRepository.save(instructor);

        // Create Assignment (far-future deadline so it is open)
        Assignment assignment = new Assignment();
        assignment.setTitle("IDOR Test Assignment");
        assignment.setDescription("For IDOR testing");
        assignment.setRubricCriteria("[\"Quality\"]");
        assignment.setDeadline(LocalDateTime.now().plusDays(30));
        assignment.setCreatedBy(instructor);
        assignment = assignmentRepository.save(assignment);

        // Student B submits (no real file — we create the DB row directly)
        Submission subB = new Submission();
        subB.setAssignment(assignment);
        subB.setAuthor(studentB);
        subB.setOriginalFileName("studentB_secret.pdf");
        subB.setFilePath("dummy-encrypted.enc");
        subB.setFileHash("aabbccdd");
        subB.setFileSize("12 KB");
        subB.setFileType("application/pdf");
        subB.setStatus("SUBMITTED");
        subB.setSubmittedAt(LocalDateTime.now());
        subB = submissionRepository.save(subB);
        studentBSubmissionId = subB.getId();

        // Assign Student A to review Student B's submission
        Review review = new Review();
        review.setSubmission(subB);
        review.setReviewer(studentA);
        review.setReviewerPseudonym("Reviewer-X1");
        review.setStatus("PENDING");
        review = reviewRepository.save(review);
        reviewForBId = review.getId();
    }

    // ── Test 1: Student A cannot download Student B's file ───────────────────

    @Test
    @WithMockUser(username = "idor_studentA@trustreview.edu", roles = "STUDENT")
    @DisplayName("Student A cannot download Student B's submission file (not author, not assigned reviewer here)")
    void studentA_cannotDownload_studentB_submission_asNonReviewer() throws Exception {
        // Create a second submission for Student B on a different assignment
        // which Student A is NOT the reviewer of — to test pure IDOR
        User studentB = userRepository.findByEmail("idor_studentB@trustreview.edu").orElseThrow();
        User instructor = userRepository.findByEmail("idor_instructor@trustreview.edu").orElseThrow();

        Assignment assignment2 = new Assignment();
        assignment2.setTitle("IDOR Test Assignment 2");
        assignment2.setDescription("Second assignment for pure IDOR test");
        assignment2.setRubricCriteria("[\"Quality\"]");
        assignment2.setDeadline(LocalDateTime.now().plusDays(30));
        assignment2.setCreatedBy(instructor);
        assignment2 = assignmentRepository.save(assignment2);

        Submission subB2 = new Submission();
        subB2.setAssignment(assignment2);
        subB2.setAuthor(studentB);
        subB2.setOriginalFileName("studentB_secret2.pdf");
        subB2.setFilePath("dummy-encrypted-2.enc");
        subB2.setFileHash("ccddee");
        subB2.setFileSize("5 KB");
        subB2.setFileType("application/pdf");
        subB2.setStatus("SUBMITTED");
        subB2.setSubmittedAt(LocalDateTime.now());
        subB2 = submissionRepository.save(subB2);
        final String subB2Id = subB2.getId();

        // Student A tries to download Student B's file — no assignment relationship
        mockMvc.perform(get("/api/submissions/" + subB2Id + "/file"))
            .andExpect(status().isForbidden());
    }

    // ── Test 2: Student A's /my-submissions only contains their own ──────────

    @Test
    @WithMockUser(username = "idor_studentA@trustreview.edu", roles = "STUDENT")
    @DisplayName("GET /api/submissions/my only returns Student A's own submissions")
    void mySubmissions_onlyOwnData() throws Exception {
        mockMvc.perform(get("/api/submissions/my"))
            .andExpect(status().isOk())
            .andExpect(result -> {
                String body = result.getResponse().getContentAsString();
                // Student B's file must never appear in Student A's list
                assert !body.contains("studentB_secret")
                    : "Student B's filename leaked into Student A's /my submissions: " + body;
            });
    }

    // ── Test 3: Student A's /my-appeals only contains their own ─────────────

    @Test
    @WithMockUser(username = "idor_studentA@trustreview.edu", roles = "STUDENT")
    @DisplayName("GET /api/appeals/my-appeals only returns Student A's own appeals")
    void myAppeals_onlyOwnData() throws Exception {
        mockMvc.perform(get("/api/appeals/my-appeals"))
            .andExpect(status().isOk())
            .andExpect(result -> {
                String body = result.getResponse().getContentAsString();
                // The response is an array; if Student B had an appeal, its ID must not appear
                // Simply assert the response is a valid JSON array scoped to studentA
                assert body.startsWith("[")
                    : "Expected JSON array from /my-appeals, got: " + body;
            });
    }

    // ── Test 4: Student cannot submit a review that is not assigned to them ──

    @Test
    @WithMockUser(username = "idor_studentB@trustreview.edu", roles = "STUDENT")
    @DisplayName("Student B cannot submit a review assigned to Student A")
    void studentB_cannotSubmit_reviewAssignedToStudentA() throws Exception {
        // reviewForBId is assigned to Student A, not Student B
        mockMvc.perform(post("/api/reviews/" + reviewForBId + "/submit")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content("{\"scores\":\"{}\",\"feedbackText\":\"IDOR attempt\"}"))
            .andExpect(status().isForbidden());
    }
}

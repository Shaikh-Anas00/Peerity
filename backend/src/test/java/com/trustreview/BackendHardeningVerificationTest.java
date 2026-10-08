package com.trustreview;

import com.trustreview.dto.CreateAppealRequest;
import com.trustreview.dto.QuorumStatusDto;
import com.trustreview.dto.ResolveAppealRequest;
import com.trustreview.model.*;
import com.trustreview.repository.*;
import com.trustreview.service.AnalyticsService;
import com.trustreview.service.AppealService;
import com.trustreview.service.QuorumService;
import com.trustreview.service.SubmissionService;
import com.trustreview.util.ClientIpResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Phase 1 & 2 Verification — Backend Hardening & Governance Tests")
class BackendHardeningVerificationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ClientIpResolver clientIpResolver;
    @Autowired private AppealService appealService;
    @Autowired private QuorumService quorumService;
    @Autowired private SubmissionService submissionService;
    @Autowired private AnalyticsService analyticsService;
    @Autowired private UserRepository userRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private AppealRepository appealRepository;
    @Autowired private DisclosureRequestRepository disclosureRequestRepository;
    @Autowired private AuditLogRepository auditLogRepository;

    private User makeUser(String email, Role role) {
        return userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(new User(email, "hashed_pw", email, role, "Apex", "CS")));
    }

    @BeforeEach
    void seedBaseUsers() {
        makeUser("admin@trustreview.edu", Role.ADMIN);
        makeUser("committee1@trustreview.edu", Role.COMMITTEE);
        makeUser("committee2@trustreview.edu", Role.COMMITTEE);
        makeUser("instructor1@trustreview.edu", Role.INSTRUCTOR);
        makeUser("instructor2@trustreview.edu", Role.INSTRUCTOR);
        makeUser("student1@trustreview.edu", Role.STUDENT);
        makeUser("student2@trustreview.edu", Role.STUDENT);
    }

    // ── Item 1: ClientIpResolver Tests ────────────────────────────────────────

    @Test
    @DisplayName("Item 1: Untrusted proxy sending X-Forwarded-For is ignored (spoofing prevented)")
    void clientIpResolver_untrustedProxy_ignoresXForwardedFor() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.1"); // External / untrusted IP
        request.addHeader("X-Forwarded-For", "203.0.113.195, 10.0.0.1");

        String ip = clientIpResolver.resolveClientIp(request);
        assertEquals("198.51.100.1", ip, "Must return direct remoteAddr when proxy is not trusted");
    }

    @Test
    @DisplayName("Item 1: Trusted proxy (127.0.0.1) extracts first client IP from X-Forwarded-For")
    void clientIpResolver_trustedProxy_extractsClientIp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1"); // Trusted loopback proxy
        request.addHeader("X-Forwarded-For", "203.0.113.195, 10.0.0.1");

        String ip = clientIpResolver.resolveClientIp(request);
        assertEquals("203.0.113.195", ip, "Must extract client IP from X-Forwarded-For when proxy is trusted");
    }

    // ── Item 2: Quorum Gate Bypass Guard in resolveAppeal ────────────────────

    @Test
    @DisplayName("Item 2: resolveAppeal throws IllegalStateException while quorum is PENDING_APPROVAL")
    void resolveAppeal_whileQuorumPending_throwsIllegalStateException() {
        User student = makeUser("resolve_student@trustreview.edu", Role.STUDENT);
        User reviewer = makeUser("resolve_reviewer@trustreview.edu", Role.STUDENT);
        User admin = makeUser("resolve_admin@trustreview.edu", Role.ADMIN);
        User instructor = makeUser("resolve_instructor@trustreview.edu", Role.INSTRUCTOR);

        Assignment a = new Assignment();
        a.setTitle("Resolve Guard Test");
        a.setDescription("desc");
        a.setRubricCriteria("[\"Quality\"]");
        a.setDeadline(LocalDateTime.now().plusDays(10));
        a.setCreatedBy(instructor);
        a = assignmentRepository.save(a);

        Submission s = new Submission();
        s.setAssignment(a);
        s.setAuthor(student);
        s.setOriginalFileName("test.pdf");
        s.setFilePath("test.enc");
        s.setFileHash("hash");
        s.setFileSize("10 KB");
        s.setFileType("application/pdf");
        s.setStatus("SUBMITTED");
        s.setSubmittedAt(LocalDateTime.now());
        s = submissionRepository.save(s);

        Review r = new Review();
        r.setSubmission(s);
        r.setReviewer(reviewer);
        r.setReviewerPseudonym("Reviewer-Res");
        r.setStatus("COMPLETED");
        r.setScores("{\"Quality\":5}");
        r.setSubmittedAt(LocalDateTime.now());
        r = reviewRepository.save(r);

        CreateAppealRequest car = new CreateAppealRequest();
        car.setReviewId(r.getId());
        car.setReason(AppealReason.UNFAIR_GRADING_OUTLIER);
        car.setStatement("Unfair review score");
        var appealDto = appealService.createAppeal(car, student, "192.168.1.100");

        // Attempt manual resolution while quorum is still PENDING_APPROVAL
        ResolveAppealRequest req = new ResolveAppealRequest();
        req.setStatus(AppealStatus.RESOLVED_UPHELD);
        req.setResolutionNote("Admin manual bypass attempt");
        req.setApproveDisclosure(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                appealService.resolveAppeal(appealDto.getId(), req, admin));
        assertTrue(ex.getMessage().contains("quorum voting is still open"));
    }

    @Test
    @WithMockUser(username = "admin@trustreview.edu", roles = "ADMIN")
    @DisplayName("Item 2: POST /api/appeals/{id}/resolve returns 409 Conflict when quorum is open")
    void resolveAppealEndpoint_admin_whilePending_returns409() throws Exception {
        User student = makeUser("resolve_student2@trustreview.edu", Role.STUDENT);
        User reviewer = makeUser("resolve_reviewer2@trustreview.edu", Role.STUDENT);
        User instructor = makeUser("resolve_instructor2@trustreview.edu", Role.INSTRUCTOR);

        Assignment a = new Assignment();
        a.setTitle("Resolve Guard Endpoint Test");
        a.setDescription("desc");
        a.setRubricCriteria("[\"Quality\"]");
        a.setDeadline(LocalDateTime.now().plusDays(10));
        a.setCreatedBy(instructor);
        a = assignmentRepository.save(a);

        Submission s = new Submission();
        s.setAssignment(a);
        s.setAuthor(student);
        s.setOriginalFileName("test.pdf");
        s.setFilePath("test.enc");
        s.setFileHash("hash");
        s.setFileSize("10 KB");
        s.setFileType("application/pdf");
        s.setStatus("SUBMITTED");
        s.setSubmittedAt(LocalDateTime.now());
        s = submissionRepository.save(s);

        Review r = new Review();
        r.setSubmission(s);
        r.setReviewer(reviewer);
        r.setReviewerPseudonym("Reviewer-Res2");
        r.setStatus("COMPLETED");
        r.setScores("{\"Quality\":4}");
        r.setSubmittedAt(LocalDateTime.now());
        r = reviewRepository.save(r);

        CreateAppealRequest car = new CreateAppealRequest();
        car.setReviewId(r.getId());
        car.setReason(AppealReason.UNFAIR_GRADING_OUTLIER);
        car.setStatement("Unfair score dispute");
        var appealDto = appealService.createAppeal(car, student, "127.0.0.1");

        mockMvc.perform(post("/api/appeals/" + appealDto.getId() + "/resolve").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED_UPHELD\",\"resolutionNote\":\"bypassed\",\"approveDisclosure\":true}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Appeal cannot be manually resolved while quorum voting is still open."));
    }

    @Test
    @WithMockUser(username = "committee1@trustreview.edu", roles = "COMMITTEE")
    @DisplayName("Item 2: POST /api/appeals/{id}/resolve as COMMITTEE returns 403 Forbidden (ADMIN only)")
    void resolveAppealEndpoint_committee_returns403() throws Exception {
        mockMvc.perform(post("/api/appeals/dummy-id/resolve").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED_UPHELD\",\"resolutionNote\":\"bypassed\",\"approveDisclosure\":true}"))
                .andExpect(status().isForbidden());
    }

    // ── Item 3: Server-side deadline check on submissions ─────────────────────

    @Test
    @DisplayName("Item 3: Submission past deadline is rejected with IllegalArgumentException")
    void createSubmission_pastDeadline_throwsIllegalArgumentException() {
        User student = makeUser("deadline_student@trustreview.edu", Role.STUDENT);
        User instructor = makeUser("deadline_instructor@trustreview.edu", Role.INSTRUCTOR);

        Assignment pastAssignment = new Assignment();
        pastAssignment.setTitle("Expired Assignment");
        pastAssignment.setDescription("Past deadline");
        pastAssignment.setRubricCriteria("[\"Code\"]");
        pastAssignment.setDeadline(LocalDateTime.now().minusHours(2)); // Deadline was 2 hours ago
        pastAssignment.setCreatedBy(instructor);
        pastAssignment = assignmentRepository.save(pastAssignment);

        MockMultipartFile file = new MockMultipartFile("file", "project.pdf", "application/pdf", "%PDF-1.4 test".getBytes());

        final String aId = pastAssignment.getId();
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                submissionService.createWithFile(aId, file, student));
        assertTrue(ex.getMessage().toLowerCase().contains("deadline has passed"));
    }

    // ── Item 4: AdminUserController role validation ───────────────────────────

    @Test
    @WithMockUser(username = "admin@trustreview.edu", roles = "ADMIN")
    @DisplayName("Item 4: Admin cannot create user with Role.STUDENT (400 Bad Request)")
    void adminCreateUser_studentRole_returns400() throws Exception {
        mockMvc.perform(post("/api/admin/users").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin_made_student@trustreview.edu\",\"password\":\"Pass@12345\",\"fullName\":\"Fake Student\",\"role\":\"STUDENT\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Use the public /register endpoint for student accounts. Admin endpoint is restricted to privileged roles."));
    }

    // ── Item 6: Audit IP Logging ──────────────────────────────────────────────

    @Test
    @DisplayName("Item 6: Dispute filing records client IP address in audit ledger")
    void appealFiling_logsClientIpInLedger() {
        User student = makeUser("audit_ip_student@trustreview.edu", Role.STUDENT);
        User reviewer = makeUser("audit_ip_reviewer@trustreview.edu", Role.STUDENT);
        User instructor = makeUser("audit_ip_instructor@trustreview.edu", Role.INSTRUCTOR);

        Assignment a = new Assignment();
        a.setTitle("Audit IP Test");
        a.setDescription("desc");
        a.setRubricCriteria("[\"Quality\"]");
        a.setDeadline(LocalDateTime.now().plusDays(10));
        a.setCreatedBy(instructor);
        a = assignmentRepository.save(a);

        Submission s = new Submission();
        s.setAssignment(a);
        s.setAuthor(student);
        s.setOriginalFileName("audit.pdf");
        s.setFilePath("audit.enc");
        s.setFileHash("hash");
        s.setFileSize("10 KB");
        s.setFileType("application/pdf");
        s.setStatus("SUBMITTED");
        s.setSubmittedAt(LocalDateTime.now());
        s = submissionRepository.save(s);

        Review r = new Review();
        r.setSubmission(s);
        r.setReviewer(reviewer);
        r.setReviewerPseudonym("Reviewer-Audit");
        r.setStatus("COMPLETED");
        r.setScores("{\"Quality\":4}");
        r.setSubmittedAt(LocalDateTime.now());
        r = reviewRepository.save(r);

        CreateAppealRequest car = new CreateAppealRequest();
        car.setReviewId(r.getId());
        car.setReason(AppealReason.UNFAIR_GRADING_OUTLIER);
        car.setStatement("Dispute with IP check");
        String targetIp = "198.51.100.77";

        var appealDto = appealService.createAppeal(car, student, targetIp);

        // Verify audit log has target IP
        var logs = auditLogRepository.findAllByOrderBySequenceNumberDesc(org.springframework.data.domain.PageRequest.of(0, 10));
        var disputeLog = logs.getContent().stream()
                .filter(l -> "DISPUTE_FILED".equals(l.getAction()) && appealDto.getId().equals(l.getTargetId()))
                .findFirst();

        assertTrue(disputeLog.isPresent(), "DISPUTE_FILED log must be recorded");
        assertEquals(targetIp, disputeLog.get().getIpAddress(), "Audit log must preserve client IP");
    }

    // ── Item 14 & 17: Quorum Recusal Badge & Sealed Voting ────────────────────

    @Test
    @DisplayName("Item 14 & 17: Appellant and Reviewer are marked recused, and votes are sealed while pending")
    void quorumStatus_recusalAndSealedVotes() {
        User appellant = makeUser("quorum_appellant@trustreview.edu", Role.COMMITTEE);
        User reviewer = makeUser("quorum_reviewer@trustreview.edu", Role.COMMITTEE);
        User thirdMember = makeUser("quorum_third@trustreview.edu", Role.COMMITTEE);
        User instructor = makeUser("quorum_instructor@trustreview.edu", Role.INSTRUCTOR);

        Assignment a = new Assignment();
        a.setTitle("Quorum Badge Test");
        a.setDescription("desc");
        a.setRubricCriteria("[\"Quality\"]");
        a.setDeadline(LocalDateTime.now().plusDays(10));
        a.setCreatedBy(instructor);
        a = assignmentRepository.save(a);

        Submission s = new Submission();
        s.setAssignment(a);
        s.setAuthor(appellant);
        s.setOriginalFileName("test.pdf");
        s.setFilePath("test.enc");
        s.setFileHash("hash");
        s.setFileSize("10 KB");
        s.setFileType("application/pdf");
        s.setStatus("SUBMITTED");
        s.setSubmittedAt(LocalDateTime.now());
        s = submissionRepository.save(s);

        Review r = new Review();
        r.setSubmission(s);
        r.setReviewer(reviewer);
        r.setReviewerPseudonym("Reviewer-Recused");
        r.setStatus("COMPLETED");
        r.setScores("{\"Quality\":4}");
        r.setSubmittedAt(LocalDateTime.now());
        r = reviewRepository.save(r);

        CreateAppealRequest car = new CreateAppealRequest();
        car.setReviewId(r.getId());
        car.setReason(AppealReason.UNFAIR_GRADING_OUTLIER);
        car.setStatement("Dispute recusal test");
        var appealDto = appealService.createAppeal(car, appellant, "127.0.0.1");

        // 1. Appellant checking status -> isRecused must be true
        QuorumStatusDto appellantStatus = quorumService.getQuorumStatus(appealDto.getId(), appellant);
        assertTrue(appellantStatus.isRecused(), "Appellant must be marked recused");
        assertTrue(appellantStatus.getRecusalReason().contains("appellant"));

        // 2. Reviewer checking status -> isRecused must be true
        QuorumStatusDto reviewerStatus = quorumService.getQuorumStatus(appealDto.getId(), reviewer);
        assertTrue(reviewerStatus.isRecused(), "Reviewer must be marked recused");
        assertTrue(reviewerStatus.getRecusalReason().contains("reviewer"));

        // 3. Independent third committee member checking status -> NOT recused
        QuorumStatusDto thirdStatus = quorumService.getQuorumStatus(appealDto.getId(), thirdMember);
        assertFalse(thirdStatus.isRecused(), "Unconflicted member must NOT be recused");

        // 4. Sealed voting: While pending, votes list must be empty
        assertEquals(0, thirdStatus.getVotes().size(), "Votes list must be empty while voting is open (sealed votes)");
    }

    // ── Item 16: Scoped Instructor Analytics ──────────────────────────────────

    @Test
    @DisplayName("Item 16: Instructor only sees analytics metrics for their own created assignments")
    void instructorAnalytics_isScopedToOwnAssignments() {
        User instructor1 = makeUser("analytics_inst1@trustreview.edu", Role.INSTRUCTOR);
        User instructor2 = makeUser("analytics_inst2@trustreview.edu", Role.INSTRUCTOR);
        User studentA = makeUser("analytics_stA@trustreview.edu", Role.STUDENT);
        User studentB = makeUser("analytics_stB@trustreview.edu", Role.STUDENT);

        // Course 1 by Instructor 1
        Assignment a1 = new Assignment();
        a1.setTitle("Course 1 Assignment");
        a1.setDescription("desc");
        a1.setRubricCriteria("[\"Quality\"]");
        a1.setDeadline(LocalDateTime.now().plusDays(10));
        a1.setCreatedBy(instructor1);
        a1 = assignmentRepository.save(a1);

        Submission s1 = new Submission();
        s1.setAssignment(a1);
        s1.setAuthor(studentA);
        s1.setOriginalFileName("a1.pdf");
        s1.setFilePath("a1.enc");
        s1.setFileHash("hash1");
        s1.setFileSize("10 KB");
        s1.setFileType("application/pdf");
        s1.setStatus("SUBMITTED");
        s1.setSubmittedAt(LocalDateTime.now());
        s1 = submissionRepository.save(s1);

        Review r1 = new Review();
        r1.setSubmission(s1);
        r1.setReviewer(studentB);
        r1.setReviewerPseudonym("Rev-1");
        r1.setStatus("COMPLETED");
        r1.setScores("{\"Quality\":9}");
        r1.setSubmittedAt(LocalDateTime.now());
        reviewRepository.save(r1);

        // Course 2 by Instructor 2
        Assignment a2 = new Assignment();
        a2.setTitle("Course 2 Assignment");
        a2.setDescription("desc");
        a2.setRubricCriteria("[\"Quality\"]");
        a2.setDeadline(LocalDateTime.now().plusDays(10));
        a2.setCreatedBy(instructor2);
        a2 = assignmentRepository.save(a2);

        Submission s2 = new Submission();
        s2.setAssignment(a2);
        s2.setAuthor(studentB);
        s2.setOriginalFileName("a2.pdf");
        s2.setFilePath("a2.enc");
        s2.setFileHash("hash2");
        s2.setFileSize("10 KB");
        s2.setFileType("application/pdf");
        s2.setStatus("SUBMITTED");
        s2.setSubmittedAt(LocalDateTime.now());
        s2 = submissionRepository.save(s2);

        Review r2 = new Review();
        r2.setSubmission(s2);
        r2.setReviewer(studentA);
        r2.setReviewerPseudonym("Rev-2");
        r2.setStatus("COMPLETED");
        r2.setScores("{\"Quality\":7}");
        r2.setSubmittedAt(LocalDateTime.now());
        reviewRepository.save(r2);

        // Query analytics as Instructor 1 -> should only see 1 review
        var inst1Metrics = analyticsService.getDashboardMetrics(instructor1);
        assertEquals(1, inst1Metrics.getReviewCompletion().getTotalAssigned(),
                "Instructor 1 must only see reviews assigned in their own course");

        // Query analytics as Admin -> should see at least 2 reviews
        User admin = makeUser("admin@trustreview.edu", Role.ADMIN);
        var adminMetrics = analyticsService.getDashboardMetrics(admin);
        assertTrue(adminMetrics.getReviewCompletion().getTotalAssigned() >= 2,
                "Admin sees aggregate reviews across all courses");
    }
}

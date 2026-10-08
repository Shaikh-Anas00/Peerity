package com.trustreview;

import com.trustreview.model.*;
import com.trustreview.repository.*;
import com.trustreview.service.QuorumService;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Quorum Edge-Case Tests.
 *
 * Tests the exact Model A binary-gate state machine edge cases:
 *   1. Duplicate vote by the same member → IllegalStateException (409)
 *   2. Vote after quorum already resolved → IllegalStateException (closed)
 *   3. Non-COMMITTEE member (ADMIN) vote → SecurityException (403)
 *   4. Appellant self-recusal → SecurityException (403)
 *   5. Two REJECTs → DisclosureStatus.REJECTED + AppealStatus.RESOLVED_DISMISSED
 *   6. Two APPROVEs → DisclosureStatus.APPROVED + AppealStatus.RESOLVED_UPHELD
 */
@SpringBootTest
@DisplayName("Quorum Edge Cases — Model A Binary Gate")
class QuorumEdgeCaseTest {

    @Autowired private QuorumService quorumService;
    @Autowired private UserRepository userRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private AppealRepository appealRepository;
    @Autowired private DisclosureRequestRepository disclosureRequestRepository;

    // ── Security Context Helper ──────────────────────────────────────────────

    /**
     * Sets up a mock Spring Security context so @PreAuthorize on QuorumService works
     * when calling the service directly (not via MockMvc).
     */
    private void runAsCommittee(String email) {
        var auth = new UsernamePasswordAuthenticationToken(
            email, null,
            List.of(new SimpleGrantedAuthority("ROLE_COMMITTEE"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @org.junit.jupiter.api.AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User makeUser(String email, Role role) {
        if (userRepository.existsByEmail(email))
            return userRepository.findByEmail(email).orElseThrow();
        return userRepository.save(new User(email, "hash", email, role, "Apex", "CS"));
    }

    private Appeal buildAppealScenario(String prefix) {
        User instructor = makeUser(prefix + "_instructor@t.edu", Role.INSTRUCTOR);
        User student    = makeUser(prefix + "_student@t.edu",    Role.STUDENT);
        User reviewer   = makeUser(prefix + "_reviewer@t.edu",   Role.STUDENT);

        Assignment a = new Assignment();
        a.setTitle(prefix + " Assignment");
        a.setDescription("quorum test");
        a.setRubricCriteria("[\"Q\"]");
        a.setDeadline(LocalDateTime.now().plusDays(30));
        a.setCreatedBy(instructor);
        a = assignmentRepository.save(a);

        Submission s = new Submission();
        s.setAssignment(a); s.setAuthor(student);
        s.setOriginalFileName("file.pdf"); s.setFilePath("x.enc");
        s.setFileHash("abc"); s.setFileSize("1 KB");
        s.setFileType("application/pdf"); s.setStatus("SUBMITTED");
        s.setSubmittedAt(LocalDateTime.now());
        s = submissionRepository.save(s);

        Review rev = new Review();
        rev.setSubmission(s); rev.setReviewer(reviewer);
        rev.setReviewerPseudonym("Reviewer-Z"); rev.setStatus("COMPLETED");
        rev.setScores("{\"Q\":5}"); rev.setFeedbackText("ok");
        rev.setSubmittedAt(LocalDateTime.now());
        rev = reviewRepository.save(rev);

        Appeal appeal = new Appeal(rev, student, AppealReason.UNFAIR_GRADING_OUTLIER, "It was unfair.");
        appeal = appealRepository.save(appeal);

        DisclosureRequest dr = new DisclosureRequest(
                appeal, DisclosureLevel.LEVEL_2_INSTITUTION_DEPT,
                DisclosureLevel.LEVEL_2_INSTITUTION_DEPT, "Policy auto-calc");
        dr.setThresholdRequired(2);
        disclosureRequestRepository.save(dr);
        appeal.setDisclosureRequest(dr);
        return appealRepository.save(appeal);
    }

    // ── Test 1: Duplicate Vote ────────────────────────────────────────────────

    @Test
    @DisplayName("Duplicate vote by same committee member → IllegalStateException")
    void duplicateVote_throwsIllegalState() {
        Appeal appeal = buildAppealScenario("dup");
        User c1 = makeUser("dup_committee1@t.edu", Role.COMMITTEE);

        runAsCommittee(c1.getEmail());
        quorumService.castVote(appeal.getId(), c1, VoteDecision.APPROVE, "First vote");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            quorumService.castVote(appeal.getId(), c1, VoteDecision.APPROVE, "Duplicate vote"));
        assertTrue(ex.getMessage().toLowerCase().contains("duplicate")
                || ex.getMessage().toLowerCase().contains("already voted"),
            "Unexpected message: " + ex.getMessage());
    }

    // ── Test 2: Vote after quorum resolved ───────────────────────────────────

    @Test
    @DisplayName("Vote after quorum already resolved → IllegalStateException (voting closed)")
    void voteAfterResolved_throwsIllegalState() {
        Appeal appeal = buildAppealScenario("closed");
        User c1 = makeUser("closed_committee1@t.edu", Role.COMMITTEE);
        User c2 = makeUser("closed_committee2@t.edu", Role.COMMITTEE);
        User c3 = makeUser("closed_committee3@t.edu", Role.COMMITTEE);

        // Reach quorum
        runAsCommittee(c1.getEmail());
        quorumService.castVote(appeal.getId(), c1, VoteDecision.APPROVE, "First");
        runAsCommittee(c2.getEmail());
        quorumService.castVote(appeal.getId(), c2, VoteDecision.APPROVE, "Second — quorum reached");

        // Third vote after quorum is already resolved
        runAsCommittee(c3.getEmail());
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            quorumService.castVote(appeal.getId(), c3, VoteDecision.APPROVE, "Late vote"));
        assertTrue(ex.getMessage().toLowerCase().contains("voting is closed")
                || ex.getMessage().toLowerCase().contains("already"),
            "Unexpected message: " + ex.getMessage());
    }

    // ── Test 3: Non-COMMITTEE member (ADMIN) vote ─────────────────────────────

    @Test
    @DisplayName("ADMIN attempting to vote → SecurityException (operational custodian only)")
    void adminVote_throwsSecurityException() {
        Appeal appeal = buildAppealScenario("adminvote");
        User admin = makeUser("adminvote_admin@t.edu", Role.ADMIN);

        // Set ADMIN context — @PreAuthorize("hasRole('COMMITTEE')") will throw AccessDeniedException
        var adminAuth = new UsernamePasswordAuthenticationToken(
            admin.getEmail(), null,
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(adminAuth);

        // Spring wraps the access denial; accept any access/security-related exception
        Exception ex = assertThrows(Exception.class, () ->
            quorumService.castVote(appeal.getId(), admin, VoteDecision.APPROVE, "Admin vote attempt"));
        assertTrue(
            ex instanceof org.springframework.security.access.AccessDeniedException
            || ex instanceof SecurityException,
            "Expected access denied for admin vote, got: " + ex.getClass().getName() + ": " + ex.getMessage()
        );
    }

    // ── Test 4: Appellant self-recusal ────────────────────────────────────────

    @Test
    @DisplayName("Appellant (who is also a COMMITTEE member) voting on own appeal → SecurityException")
    void appellantRecusal_throwsSecurityException() {
        // Make the student also hold COMMITTEE role for this edge case
        User instructor2 = makeUser("recusal_instructor@t.edu", Role.INSTRUCTOR);
        User appellant = makeUser("recusal_appellant_committee@t.edu", Role.COMMITTEE);
        // Appellant files appeal of a review on their own submission
        User someReviewer = makeUser("recusal_reviewer@t.edu", Role.STUDENT);

        Assignment a = new Assignment();
        a.setTitle("Recusal Assignment");
        a.setDescription("recusal test");
        a.setRubricCriteria("[\"Q\"]");
        a.setDeadline(LocalDateTime.now().plusDays(30));
        a.setCreatedBy(instructor2);
        a = assignmentRepository.save(a);

        Submission s = new Submission();
        s.setAssignment(a); s.setAuthor(appellant);
        s.setOriginalFileName("file.pdf"); s.setFilePath("y.enc");
        s.setFileHash("xyz"); s.setFileSize("2 KB");
        s.setFileType("application/pdf"); s.setStatus("SUBMITTED");
        s.setSubmittedAt(LocalDateTime.now());
        s = submissionRepository.save(s);

        Review rev = new Review();
        rev.setSubmission(s); rev.setReviewer(someReviewer);
        rev.setReviewerPseudonym("Reviewer-Q"); rev.setStatus("COMPLETED");
        rev.setScores("{\"Q\":3}"); rev.setFeedbackText("bad");
        rev.setSubmittedAt(LocalDateTime.now());
        rev = reviewRepository.save(rev);

        // Appellant files the appeal (their own submission)
        Appeal appeal = new Appeal(rev, appellant, AppealReason.UNFAIR_GRADING_OUTLIER, "I appeal myself");
        appeal = appealRepository.save(appeal);

        DisclosureRequest dr = new DisclosureRequest(
                appeal, DisclosureLevel.LEVEL_2_INSTITUTION_DEPT,
                DisclosureLevel.LEVEL_2_INSTITUTION_DEPT, "Recusal test");
        dr.setThresholdRequired(2);
        disclosureRequestRepository.save(dr);
        appeal.setDisclosureRequest(dr);
        appealRepository.save(appeal);

        // Appellant (who is COMMITTEE) tries to vote on their own appeal
        final String appealId = appeal.getId();
        runAsCommittee(appellant.getEmail());
        SecurityException ex = assertThrows(SecurityException.class, () ->
            quorumService.castVote(appealId, appellant, VoteDecision.APPROVE, "Self-vote attempt"));
        assertTrue(ex.getMessage().toLowerCase().contains("recusal"),
            "Expected recusal mention, got: " + ex.getMessage());
    }

    // ── Test 5: Two REJECTs → RESOLVED_DISMISSED ─────────────────────────────

    @Test
    @DisplayName("Two REJECT votes → DisclosureStatus.REJECTED + AppealStatus.RESOLVED_DISMISSED")
    void twoRejects_resolvesDismissed() {
        Appeal appeal = buildAppealScenario("tworeject");
        User c1 = makeUser("tworeject_c1@t.edu", Role.COMMITTEE);
        User c2 = makeUser("tworeject_c2@t.edu", Role.COMMITTEE);

        runAsCommittee(c1.getEmail());
        quorumService.castVote(appeal.getId(), c1, VoteDecision.REJECT, "Reject 1");
        runAsCommittee(c2.getEmail());
        var status = quorumService.castVote(appeal.getId(), c2, VoteDecision.REJECT, "Reject 2 — quorum reject");

        assertEquals(DisclosureStatus.REJECTED, status.getDisclosureStatus(),
            "DisclosureRequest should be REJECTED after 2 reject votes");
        assertEquals(AppealStatus.RESOLVED_DISMISSED, status.getAppealStatus(),
            "Appeal should be RESOLVED_DISMISSED after quorum rejection");
        assertTrue(status.isQuorumReached(), "Quorum should be marked reached");
    }

    // ── Test 6: Two APPROVEs → RESOLVED_UPHELD ───────────────────────────────

    @Test
    @DisplayName("Two APPROVE votes → DisclosureStatus.APPROVED + AppealStatus.RESOLVED_UPHELD")
    void twoApprovals_resolvesUpheld() {
        Appeal appeal = buildAppealScenario("twoapprove");
        User c1 = makeUser("twoapprove_c1@t.edu", Role.COMMITTEE);
        User c2 = makeUser("twoapprove_c2@t.edu", Role.COMMITTEE);

        runAsCommittee(c1.getEmail());
        quorumService.castVote(appeal.getId(), c1, VoteDecision.APPROVE, "Approve 1");
        runAsCommittee(c2.getEmail());
        var status = quorumService.castVote(appeal.getId(), c2, VoteDecision.APPROVE, "Approve 2 — quorum approve");

        assertEquals(DisclosureStatus.APPROVED, status.getDisclosureStatus(),
            "DisclosureRequest should be APPROVED after 2 approve votes");
        assertEquals(AppealStatus.RESOLVED_UPHELD, status.getAppealStatus(),
            "Appeal should be RESOLVED_UPHELD after quorum approval");
        assertTrue(status.isQuorumReached(), "Quorum should be marked reached");
        assertEquals(2, status.getApproveCount(), "Approve count should be 2");
        assertEquals(0, status.getRejectCount(), "Reject count should be 0");
    }
}

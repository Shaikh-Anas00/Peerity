package com.trustreview.service;

import com.trustreview.dto.QuorumStatusDto;
import com.trustreview.dto.VoteDto;
import com.trustreview.model.*;
import com.trustreview.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Phase 5 — Thread-safe N-of-M Quorum Voting Engine.
 *
 * A DisclosureRequest transitions from PENDING_APPROVAL → APPROVED only when
 * at least {@code thresholdRequired} distinct COMMITTEE (or ADMIN) members
 * cast APPROVE votes.  If rejection votes make approval mathematically
 * impossible, the request transitions to REJECTED.
 */
@Service
public class QuorumService {

    private static final Logger log = LoggerFactory.getLogger(QuorumService.class);



    private final AppealRepository appealRepository;
    private final DisclosureRequestRepository disclosureRequestRepository;
    private final DisclosureApprovalRepository disclosureApprovalRepository;
    private final UserRepository userRepository;
    private final AuditLedgerService auditLedgerService;

    public QuorumService(AppealRepository appealRepository,
                         DisclosureRequestRepository disclosureRequestRepository,
                         DisclosureApprovalRepository disclosureApprovalRepository,
                         UserRepository userRepository,
                         AuditLedgerService auditLedgerService) {
        this.appealRepository = appealRepository;
        this.disclosureRequestRepository = disclosureRequestRepository;
        this.disclosureApprovalRepository = disclosureApprovalRepository;
        this.userRepository = userRepository;
        this.auditLedgerService = auditLedgerService;
    }

    // ── Public API ──────────────────────────────────────────────────────────────

    /**
     * Casts a vote from the given committee member on the DisclosureRequest linked to the appeal.
     * Evaluates quorum after persisting and transitions state when threshold is met or
     * approval becomes mathematically impossible.
     *
     * @throws IllegalArgumentException if appeal or disclosure request not found
     * @throws SecurityException        if caller is not COMMITTEE or ADMIN
     * @throws IllegalStateException    if request is not PENDING_APPROVAL
     * @throws IllegalStateException    if this member has already voted (409-style duplicate)
     */
    @Transactional
    @PreAuthorize("hasRole('COMMITTEE')")
    public QuorumStatusDto castVote(String appealId, User voter,
                                     VoteDecision decision, String rationale) {

        // ── 1. Authorization: Committee Members Only (Admins are operational custodians) ──
        if (voter.getRole() != Role.COMMITTEE) {
            throw new SecurityException("Only COMMITTEE members may vote on disclosure requests. Administrators are operational custodians without voting privileges.");
        }

        // ── 2. Load entities ──────────────────────────────────────────────────
        Appeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new IllegalArgumentException("Appeal not found: " + appealId));

        // ── 3. Recusal Check: Cannot vote if member is appellant or reviewer ──
        if (appeal.getAppellant() != null && voter.getId().equals(appeal.getAppellant().getId())) {
            throw new SecurityException("Recusal violation: Appellant cannot vote on their own appeal.");
        }
        if (appeal.getReview() != null && appeal.getReview().getReviewer() != null
                && voter.getId().equals(appeal.getReview().getReviewer().getId())) {
            throw new SecurityException("Recusal violation: The reviewer being appealed must recuse themselves from voting.");
        }

        DisclosureRequest dr = appeal.getDisclosureRequest();
        if (dr == null) {
            throw new IllegalArgumentException("No disclosure request found for appeal: " + appealId);
        }

        // Re-fetch with approvals eagerly loaded via the repository
        dr = disclosureRequestRepository.findById(dr.getId())
                .orElseThrow(() -> new IllegalArgumentException("DisclosureRequest not found."));

        // ── 4. Status guard ───────────────────────────────────────────────────
        if (dr.getStatus() != DisclosureStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Voting is closed. DisclosureRequest is already " + dr.getStatus() + ".");
        }

        // ── 5. Duplicate vote guard ───────────────────────────────────────────
        if (disclosureApprovalRepository.existsByDisclosureRequestAndCommitteeMember(dr, voter)) {
            throw new IllegalStateException(
                    "Duplicate vote: member '" + voter.getFullName() + "' has already voted on this request.");
        }

        // ── 6. Persist vote ───────────────────────────────────────────────────
        DisclosureApproval approval = new DisclosureApproval(dr, voter, decision, rationale);
        try {
            disclosureApprovalRepository.saveAndFlush(approval);
        } catch (DataIntegrityViolationException ex) {
            // Race condition: another thread saved a vote for the same member concurrently
            throw new IllegalStateException(
                    "Duplicate vote (concurrent): member '" + voter.getFullName() + "' has already voted.");
        }

        log.info("Vote recorded: appealId={}, voter={}, decision={}", appealId, voter.getEmail(), decision);

        // Phase 6: Log vote block
        auditLedgerService.logEvent(
                "QUORUM_VOTE_CAST",
                voter.getEmail(),
                "DisclosureApproval",
                approval.getId(),
                "Vote " + decision + " cast on appeal " + appealId + " | Rationale: " + rationale
        );

        // Reload fresh counts
        dr = disclosureRequestRepository.findById(dr.getId()).orElseThrow();
        long approveCount = dr.getApproveCount();
        long rejectCount = dr.getRejectCount();
        int threshold = dr.getThresholdRequired();

        // ── 7. Quorum evaluation (Model A: Binary Gate on Policy-Calculated Tier) ──
        // Approvals >= 2: Disclose up to the policy-calculated tier
        if (approveCount >= threshold) {
            dr.setStatus(DisclosureStatus.APPROVED);
            appeal.setStatus(AppealStatus.RESOLVED_UPHELD);
            appeal.setResolution("Disclosure approved by committee quorum (" + approveCount + "/" + threshold
                    + " approvals). Disclosed up to policy tier: " + dr.getRequestedLevel() + ".");
            appeal.setResolvedAt(LocalDateTime.now());
            disclosureRequestRepository.save(dr);
            appealRepository.save(appeal);
            log.info("Quorum APPROVED (Model A): appealId={}, approveCount={}/{}, policyTier={}",
                    appealId, approveCount, threshold, dr.getRequestedLevel());

            // Phase 6: Log identity disclosure authorization
            auditLedgerService.logEvent(
                    "IDENTITY_DISCLOSED",
                    voter.getEmail(),
                    "DisclosureRequest",
                    dr.getId(),
                    "Quorum approved (" + approveCount + "/" + threshold + " approvals) unlocking " + dr.getRequestedLevel() + " for appeal " + appealId
            );

        // Rejections >= 2: Request permanently rejected (RESOLVED_DISMISSED)
        } else if (rejectCount >= threshold) {
            dr.setStatus(DisclosureStatus.REJECTED);
            appeal.setStatus(AppealStatus.RESOLVED_DISMISSED);
            appeal.setResolution("Disclosure permanently rejected by committee quorum (" + rejectCount + " rejection votes).");
            appeal.setResolvedAt(LocalDateTime.now());
            disclosureRequestRepository.save(dr);
            appealRepository.save(appeal);
            log.info("Quorum REJECTED (Model A): appealId={}, rejectCount={}", appealId, rejectCount);

            // Phase 6: Log dispute rejection
            auditLedgerService.logEvent(
                    "DISPUTE_REJECTED",
                    voter.getEmail(),
                    "DisclosureRequest",
                    dr.getId(),
                    "Quorum permanently rejected with " + rejectCount + " rejection votes for appeal " + appealId
            );
        }
        // else: still pending, waiting for more votes

        // ── 7. Build and return QuorumStatusDto ──────────────────────────────
        return buildQuorumStatus(appeal, dr, voter);
    }

    /**
     * Returns the current quorum state for an appeal without casting a vote.
     */
    @Transactional(readOnly = true)
    public QuorumStatusDto getQuorumStatus(String appealId, User currentUser) {
        Appeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new IllegalArgumentException("Appeal not found: " + appealId));

        DisclosureRequest dr = appeal.getDisclosureRequest();
        if (dr == null) {
            throw new IllegalArgumentException("No disclosure request found for appeal: " + appealId);
        }
        dr = disclosureRequestRepository.findById(dr.getId()).orElseThrow();

        return buildQuorumStatus(appeal, dr, currentUser);
    }

    // ── Private helpers ─────────────────────────────────────────────────────────

    private QuorumStatusDto buildQuorumStatus(Appeal appeal, DisclosureRequest dr, User currentUser) {
        List<DisclosureApproval> votes =
                disclosureApprovalRepository.findByDisclosureRequestOrderByVotedAtAsc(dr);

        QuorumStatusDto dto = new QuorumStatusDto();
        dto.setAppealId(appeal.getId());
        dto.setDisclosureRequestId(dr.getId());
        dto.setApproveCount((int) dr.getApproveCount());
        dto.setRejectCount((int) dr.getRejectCount());
        dto.setThresholdRequired(dr.getThresholdRequired());
        dto.setTotalVotesCast(votes.size());
        dto.setQuorumReached(dr.getStatus() != DisclosureStatus.PENDING_APPROVAL);
        dto.setDisclosureStatus(dr.getStatus());
        dto.setAppealStatus(appeal.getStatus());
        dto.setRequestedLevel(dr.getRequestedLevel());

        // Determine whether the current user has voted and what their decision was
        Optional<DisclosureApproval> myVote = votes.stream()
                .filter(v -> v.getCommitteeMember() != null &&
                             v.getCommitteeMember().getId().equals(currentUser.getId()))
                .findFirst();
        dto.setCurrentUserHasVoted(myVote.isPresent());
        myVote.ifPresent(v -> dto.setCurrentUserVoteDecision(v.getDecision().name()));

        // Check recusal for current user
        boolean isAppellant = appeal.getAppellant() != null &&
                appeal.getAppellant().getId().equals(currentUser.getId());
        boolean isReviewer = appeal.getReview() != null &&
                appeal.getReview().getReviewer() != null &&
                appeal.getReview().getReviewer().getId().equals(currentUser.getId());
        boolean isRecused = isAppellant || isReviewer;
        dto.setRecused(isRecused);
        if (isRecused) {
            dto.setRecusalReason(isAppellant
                    ? "Recused: You are the appellant filing this dispute."
                    : "Recused: You are the reviewer whose evaluation is under dispute.");
        }

        // Sealed Voting: While voting is PENDING_APPROVAL, do NOT leak individual votes
        // across the network to prevent anchoring / peer influence.
        if (dr.getStatus() != DisclosureStatus.PENDING_APPROVAL) {
            // Once resolved, return votes with member identity stripped (only decision, rationale, timestamp)
            dto.setVotes(votes.stream().map(v -> {
                VoteDto vdto = new VoteDto();
                vdto.setId(v.getId());
                vdto.setDecision(v.getDecision());
                vdto.setRationale(v.getRationale());
                vdto.setVotedAt(v.getVotedAt());
                // Anonymized: committeeMemberId and committeeMemberName left null
                return vdto;
            }).collect(Collectors.toList()));
        } else {
            dto.setVotes(Collections.emptyList());
        }

        return dto;
    }
}

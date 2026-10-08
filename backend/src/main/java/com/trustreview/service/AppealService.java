package com.trustreview.service;

import com.trustreview.dto.AppealDto;
import com.trustreview.dto.CreateAppealRequest;
import com.trustreview.dto.DisclosedIdentityDto;
import com.trustreview.dto.ResolveAppealRequest;
import com.trustreview.model.*;
import com.trustreview.repository.AppealRepository;
import com.trustreview.repository.ReviewRepository;
import com.trustreview.repository.ReviewRatingRepository;
import com.trustreview.service.CalibrationService;
import com.trustreview.service.ReviewRatingService;
import com.trustreview.model.ReviewRating;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppealService {

    private static final Logger logger = LoggerFactory.getLogger(AppealService.class);

    private final AppealRepository appealRepository;
    private final ReviewRepository reviewRepository;
    private final PolicyEngineService policyEngineService;
    private final AuditLedgerService auditLedgerService;
    private final CalibrationService calibrationService;
    private final ReviewRatingService reviewRatingService;
    private final ReviewRatingRepository reviewRatingRepository;

    @Value("${trustreview.quorum.threshold:2}")
    private int quorumThreshold;

    public AppealService(AppealRepository appealRepository,
                         ReviewRepository reviewRepository,
                         PolicyEngineService policyEngineService,
                         AuditLedgerService auditLedgerService,
                         CalibrationService calibrationService,
                         ReviewRatingService reviewRatingService,
                         ReviewRatingRepository reviewRatingRepository) {
        this.appealRepository = appealRepository;
        this.reviewRepository = reviewRepository;
        this.policyEngineService = policyEngineService;
        this.auditLedgerService = auditLedgerService;
        this.calibrationService = calibrationService;
        this.reviewRatingService = reviewRatingService;
        this.reviewRatingRepository = reviewRatingRepository;
    }

    /**
     * Submits an appeal against a completed peer review.
     * Evaluates policy boundary and links a pending DisclosureRequest.
     */
    @Transactional
    public AppealDto createAppeal(CreateAppealRequest req, User appellant) {
        return createAppeal(req, appellant, "N/A");
    }

    @Transactional
    public AppealDto createAppeal(CreateAppealRequest req, User appellant, String clientIp) {
        Review review = reviewRepository.findById(req.getReviewId())
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + req.getReviewId()));

        // Validate that appellant is the author of the submission that was reviewed
        if (review.getSubmission() == null || review.getSubmission().getAuthor() == null ||
                !review.getSubmission().getAuthor().getId().equals(appellant.getId())) {
            throw new SecurityException("You can only dispute reviews on your own submissions.");
        }

        // Validate review is completed
        if (!"COMPLETED".equalsIgnoreCase(review.getStatus())) {
            throw new IllegalStateException("Only completed reviews can be disputed.");
        }

        // Check if an appeal already exists for this review
        if (appealRepository.existsByReview(review)) {
            throw new IllegalArgumentException("An appeal has already been filed for this review.");
        }

        // ── Model A: Policy Engine pre-calculates maximum disclosure tier ──
        DisclosureLevel policyCalculatedTier = policyEngineService.getRecommendedLevel(req.getReason());

        // Create Appeal entity
        Appeal appeal = new Appeal();
        appeal.setReview(review);
        appeal.setAppellant(appellant);
        appeal.setReason(req.getReason());
        appeal.setStatement(req.getStatement());
        appeal.setEvidenceFilePath(req.getEvidenceFilePath());
        appeal.setStatus(AppealStatus.SUBMITTED);

        // Create linked DisclosureRequest (Model A: binary gate on policyCalculatedTier)
        DisclosureRequest disclosureRequest = new DisclosureRequest(
                appeal,
                policyCalculatedTier,
                policyCalculatedTier,
                "Model A Policy Engine pre-calculated disclosure tier: " + policyCalculatedTier + " for reason: " + req.getReason()
        );
        disclosureRequest.setThresholdRequired(this.quorumThreshold);
        appeal.setDisclosureRequest(disclosureRequest);

        Appeal saved = appealRepository.save(appeal);
        logger.info("Created appeal id={} for reviewId={} with policyCalculatedTier={}",
                saved.getId(), review.getId(), policyCalculatedTier);

        // Phase 6: Log cryptographically chained audit event
        auditLedgerService.logEvent(
                "DISPUTE_FILED",
                appellant.getEmail(),
                "Appeal",
                saved.getId(),
                "Dispute filed for review " + review.getId() + " | Reason: " + req.getReason()
                        + " | PolicyTier: " + policyCalculatedTier,
                clientIp
        );

        return AppealDto.from(saved);
    }

    /**
     * Returns appeals submitted by the logged-in student.
     */
    @Transactional(readOnly = true)
    public List<AppealDto> getMyAppeals(User appellant) {
        return appealRepository.findByAppellantOrderByCreatedAtDesc(appellant)
                .stream()
                .map(a -> enrichAppealDto(a, appellant))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AppealDto enrichAppealDto(Appeal a, User viewer) {
        AppealDto dto = AppealDto.from(a);

        // Include author's rating on this specific review as case evidence
        if (a.getReview() != null) {
            reviewRatingRepository.findByReview(a.getReview()).ifPresent(r -> {
                dto.setReviewRating(r.getRating());
                dto.setReviewRatingHelpful(r.getIsHelpful());
                dto.setReviewRatingComment(r.getComment());
            });
        }

        // DISCLOSURE TIER GATE (User correction #1):
        // Reviewer's aggregate calibration reliability profile is only revealed if:
        // 1. Disclosure is APPROVED up to at least LEVEL_1_ELIGIBILITY
        // 2. OR the viewer is an INSTRUCTOR (who already has grading authority over all students)
        boolean isDisclosureApproved = a.getDisclosureRequest() != null &&
                a.getDisclosureRequest().getStatus() == DisclosureStatus.APPROVED &&
                a.getDisclosureRequest().getRequestedLevel() != null &&
                a.getDisclosureRequest().getRequestedLevel().getRank() >= 1;

        boolean isInstructor = viewer != null && viewer.getRole() == Role.INSTRUCTOR;

        if ((isDisclosureApproved || isInstructor) && a.getReview() != null && a.getReview().getReviewer() != null) {
            User reviewer = a.getReview().getReviewer();
            var reliability = calibrationService.getStudentReliability(reviewer);
            var feedbackStats = reviewRatingService.getReviewerFeedbackStats(reviewer);

            if (reliability.isCalibrated()) {
                dto.setReviewerReliabilityScore(reliability.getReliabilityScore());
                dto.setReviewerCalibrationCount(reliability.getSamplesCompleted());
                dto.setReviewerHelpfulPercentage(feedbackStats.helpfulPercentage());

                String signal = policyEngineService.evaluateStatisticalSignal(
                        reliability.getReliabilityScore(),
                        reliability.getSamplesCompleted(),
                        feedbackStats.helpfulPercentage()
                );
                dto.setStatisticalSignalNote(signal);
            }
        }

        return dto;
    }

    /**
     * Returns all open appeals for Committee, Admin, or Instructor review.
     */
    @Transactional(readOnly = true)
    public List<AppealDto> getPendingAppeals() {
        return appealRepository.findOpenAppeals()
                .stream()
                .map(a -> enrichAppealDto(a, null))
                .collect(Collectors.toList());
    }

    /**
     * Returns reviewer information strictly bounded by the approved DisclosureLevel.
     * Defaults strictly to LEVEL_0_ANONYMOUS unless approved by Committee.
     */
    @Transactional(readOnly = true)
    public DisclosedIdentityDto getDisclosedIdentity(String reviewId, User requester) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        boolean isAuthor = review.getSubmission() != null &&
                review.getSubmission().getAuthor() != null &&
                review.getSubmission().getAuthor().getId().equals(requester.getId());

        boolean isStaff = requester.getRole() == Role.COMMITTEE ||
                requester.getRole() == Role.ADMIN ||
                requester.getRole() == Role.INSTRUCTOR;

        if (!isAuthor && !isStaff) {
            throw new SecurityException("You are not authorized to query disclosure details for this review.");
        }

        // Look for approved disclosure request on the review's appeal
        Appeal appeal = appealRepository.findByReview(review).orElse(null);

        if (appeal == null || appeal.getDisclosureRequest() == null ||
                appeal.getDisclosureRequest().getStatus() != DisclosureStatus.APPROVED) {
            // Strictly anonymous by default
            return DisclosedIdentityDto.anonymousOnly(review.getReviewerPseudonym());
        }

        DisclosureLevel approvedLevel = appeal.getDisclosureRequest().getRequestedLevel();

        int reviewsCompleted = 0;
        if (review.getReviewer() != null) {
            reviewsCompleted = (int) reviewRepository.findByReviewerOrderByCreatedAtDesc(review.getReviewer())
                    .stream()
                    .filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus()))
                    .count();
        }

        String courseTitle = review.getSubmission() != null && review.getSubmission().getAssignment() != null
                ? review.getSubmission().getAssignment().getTitle()
                : "Web Technologies";

        return policyEngineService.buildDisclosedIdentity(
                review.getReviewer(),
                review.getReviewerPseudonym(),
                approvedLevel,
                true,
                reviewsCompleted,
                courseTitle
        );
    }

    /**
     * Committee / Admin resolves an appeal and approves or rejects progressive disclosure.
     */
    @Transactional
    public AppealDto resolveAppeal(String appealId, ResolveAppealRequest req, User resolver) {
        Appeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new IllegalArgumentException("Appeal not found: " + appealId));

        if (appeal.getDisclosureRequest() != null && appeal.getDisclosureRequest().getStatus() == DisclosureStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Appeal cannot be manually resolved while quorum voting is still open.");
        }

        appeal.setStatus(req.getStatus());
        appeal.setResolvedAt(LocalDateTime.now());
        appeal.setResolution(req.getResolutionNote());

        if (appeal.getDisclosureRequest() != null) {
            appeal.getDisclosureRequest().setStatus(
                    req.isApproveDisclosure() ? DisclosureStatus.APPROVED : DisclosureStatus.REJECTED
            );
        }

        Appeal saved = appealRepository.save(appeal);
        logger.info("Resolved appeal id={} with status={}, disclosureApproved={}",
                saved.getId(), req.getStatus(), req.isApproveDisclosure());

        return AppealDto.from(saved);
    }
}
package com.trustreview.service;

import com.trustreview.dto.ReviewDto;
import com.trustreview.dto.SubmitReviewRequest;
import com.trustreview.model.Assignment;
import com.trustreview.model.Review;
import com.trustreview.model.Submission;
import com.trustreview.model.User;
import com.trustreview.repository.AssignmentRepository;
import com.trustreview.repository.ReviewRepository;
import com.trustreview.repository.SubmissionRepository;
import com.trustreview.repository.UserRepository;
import com.trustreview.repository.ReviewRatingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final ReviewRatingRepository reviewRatingRepository;
    private final AuditLedgerService auditLedgerService;

    // Pseudonym alphabet pool
    private static final String[] PSEUDO_PREFIXES = {
        "Alpha","Beta","Gamma","Delta","Epsilon","Zeta","Eta","Theta",
        "Iota","Kappa","Lambda","Mu","Nu","Xi","Omicron","Pi"
    };

    public ReviewService(ReviewRepository reviewRepository,
                         SubmissionRepository submissionRepository,
                         AssignmentRepository assignmentRepository,
                         UserRepository userRepository,
                         ReviewRatingRepository reviewRatingRepository,
                         AuditLedgerService auditLedgerService) {
        this.reviewRepository = reviewRepository;
        this.submissionRepository = submissionRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.reviewRatingRepository = reviewRatingRepository;
        this.auditLedgerService = auditLedgerService;
    }

    /**
     * Distribute reviewers for all submissions in an assignment.
     * Rules:
     *  - reviewerCount in [1,3], default 2
     *  - A student cannot review their own submission
     *  - (totalStudents - 1) must be >= reviewerCount
     *  - Each reviewer gets a unique pseudonym per submission
     */
    @Transactional
    public Map<String, Object> distribute(String assignmentId, int reviewerCount, User requestor) {
        if (reviewerCount < 1 || reviewerCount > 3) {
            throw new IllegalArgumentException("reviewerCount must be between 1 and 3.");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));

        List<Submission> submissions = submissionRepository.findByAssignmentOrderBySubmittedAtAsc(assignment);
        if (submissions.isEmpty()) {
            throw new IllegalStateException("No submissions found for this assignment.");
        }

        int totalStudents = submissions.size();
        if (totalStudents - 1 < reviewerCount) {
            throw new IllegalStateException(
                "Not enough distinct students to assign " + reviewerCount + " reviewers per submission. " +
                "Need at least " + (reviewerCount + 1) + " submissions, found " + totalStudents + ".");
        }

        int reviewsCreated = 0;

        for (Submission submission : submissions) {
            // Remove the author from the eligible reviewer pool
            List<User> eligibleReviewers = submissions.stream()
                    .map(Submission::getAuthor)
                    .filter(u -> !u.getId().equals(submission.getAuthor().getId()))
                    .filter(u -> !reviewRepository.existsByReviewerAndSubmission(u, submission))
                    .collect(Collectors.toList());

            // Shuffle for randomness
            Collections.shuffle(eligibleReviewers);

            int toAssign = Math.min(reviewerCount, eligibleReviewers.size());
            List<User> assigned = eligibleReviewers.subList(0, toAssign);

            for (int i = 0; i < assigned.size(); i++) {
                Review review = new Review();
                review.setSubmission(submission);
                review.setReviewer(assigned.get(i));
                review.setReviewerPseudonym(generatePseudonym(i));
                review.setStatus("PENDING");
                reviewRepository.save(review);
                reviewsCreated++;
            }

            // Mark submission as under review
            submission.setStatus("UNDER_REVIEW");
            submissionRepository.save(submission);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("assignmentId", assignmentId);
        result.put("submissionsProcessed", submissions.size());
        result.put("reviewsCreated", reviewsCreated);
        result.put("reviewersPerSubmission", reviewerCount);
        return result;
    }

    /** Returns reviews assigned to the given student (author of submission is masked). */
    @Transactional(readOnly = true)
    public List<ReviewDto> getAssignedToMe(User reviewer) {
        return reviewRepository.findByReviewerOrderByCreatedAtDesc(reviewer)
                .stream().map(ReviewDto::forReviewer).collect(Collectors.toList());
    }

    /**
     * Student submits their rubric scores + feedback for an assigned review.
     * Validates reviewer owns this review before accepting.
     */
    @Transactional
    public ReviewDto submitReview(String reviewId, SubmitReviewRequest req, User reviewer) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        if (!review.getReviewer().getId().equals(reviewer.getId())) {
            throw new SecurityException("You are not assigned to this review.");
        }
        if ("COMPLETED".equals(review.getStatus())) {
            throw new IllegalStateException("This review has already been submitted.");
        }

        // Server-Side Deadline Enforcement for Evaluators
        Assignment assignment = (review.getSubmission() != null) ? review.getSubmission().getAssignment() : null;
        if (assignment != null) {
            LocalDateTime effectiveReviewDeadline = assignment.getReviewDeadline() != null
                    ? assignment.getReviewDeadline()
                    : (assignment.getDeadline() != null ? assignment.getDeadline().plusDays(7) : null);
            if (effectiveReviewDeadline != null && LocalDateTime.now().isAfter(effectiveReviewDeadline)) {
                throw new IllegalArgumentException("Evaluation deadline has passed (" + effectiveReviewDeadline + "). Review submissions are closed.");
            }
        }

        // Validate scores against assignment rubric
        List<com.trustreview.dto.RubricCriterionDto> rubric = (assignment != null)
                ? RubricSupport.parse(assignment.getRubricCriteria())
                : Collections.emptyList();
        Map<String, Integer> scoreMap = RubricSupport.parseScoreMap(req.getScores());
        RubricSupport.validateScores(scoreMap, rubric);

        // Question-based criteria: scores must be derivable from the reviewer's per-question answers.
        String canonicalAnswers = null;
        if (RubricSupport.hasQuestionBased(rubric)) {
            Map<String, List<Integer>> answerMap = RubricSupport.parseAnswers(req.getAnswers());
            RubricSupport.validateAnswers(answerMap, rubric, scoreMap);
            canonicalAnswers = RubricSupport.answersToJson(answerMap);
        }

        review.setScores(req.getScores());
        review.setAnswers(canonicalAnswers);
        review.setFeedbackText(req.getFeedbackText());
        review.setStatus("COMPLETED");
        review.setSubmittedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);

        // Phase 6: Log cryptographically chained audit event
        auditLedgerService.logEvent(
                "REVIEW_SUBMITTED",
                reviewer.getEmail(),
                "Review",
                saved.getId(),
                "Review submitted for submission " + (saved.getSubmission() != null ? saved.getSubmission().getId() : "unknown")
                        + " | Pseudonym: " + saved.getReviewerPseudonym() + " | Scores: " + saved.getScores()
        );

        return ReviewDto.forReviewer(saved);
    }

    /** Returns completed reviews received for the author's own submissions (reviewer masked). */
    @Transactional(readOnly = true)
    public List<ReviewDto> getMyFeedback(User author) {
        return reviewRepository.findCompletedReviewsForAuthor(author)
                .stream()
                .filter(r -> "COMPLETED".equals(r.getStatus()))
                .map(r -> {
                    ReviewDto dto = ReviewDto.forAuthor(r);
                    reviewRatingRepository.findByReview(r).ifPresent(rating -> {
                        dto.setAuthorRating(rating.getRating());
                        dto.setAuthorRatingHelpful(rating.getIsHelpful());
                        dto.setAuthorRatingComment(rating.getComment());
                    });
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // -- Helpers -----------------------------------------------------------

    private String generatePseudonym(int index) {
        String prefix = PSEUDO_PREFIXES[index % PSEUDO_PREFIXES.length];
        // Add a short random hex suffix for uniqueness across assignments
        String suffix = Integer.toHexString((int)(Math.random() * 256)).toUpperCase();
        return "Reviewer-" + prefix + "-" + suffix;
    }
}

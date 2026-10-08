package com.trustreview.service;

import com.trustreview.dto.ReviewRatingDto;
import com.trustreview.dto.SubmitReviewRatingRequest;
import com.trustreview.model.Review;
import com.trustreview.model.ReviewRating;
import com.trustreview.model.User;
import com.trustreview.repository.AppealRepository;
import com.trustreview.repository.ReviewRatingRepository;
import com.trustreview.repository.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ReviewRatingService {

    private static final Logger log = LoggerFactory.getLogger(ReviewRatingService.class);

    private final ReviewRatingRepository reviewRatingRepository;
    private final ReviewRepository reviewRepository;
    private final AppealRepository appealRepository;
    private final AuditLedgerService auditLedgerService;

    public ReviewRatingService(ReviewRatingRepository reviewRatingRepository,
                               ReviewRepository reviewRepository,
                               AppealRepository appealRepository,
                               AuditLedgerService auditLedgerService) {
        this.reviewRatingRepository = reviewRatingRepository;
        this.reviewRepository = reviewRepository;
        this.appealRepository = appealRepository;
        this.auditLedgerService = auditLedgerService;
    }

    /**
     * Author submits a quality rating (1-5 stars + helpfulness + feedback) on a received review.
     * Enforces:
     *  - Review must be COMPLETED
     *  - Caller must be the author of the submission
     *  - Single rating per review (unique constraint)
     *  - Rating locked if an appeal has already been filed for this review
     */
    @Transactional
    public ReviewRatingDto rateReview(String reviewId, SubmitReviewRatingRequest req, User author, String clientIp) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        if (!"COMPLETED".equalsIgnoreCase(review.getStatus())) {
            throw new IllegalStateException("Only completed reviews can be rated.");
        }

        // Validate author ownership
        if (review.getSubmission() == null || review.getSubmission().getAuthor() == null ||
                !review.getSubmission().getAuthor().getId().equals(author.getId())) {
            throw new SecurityException("You can only rate reviews received for your own submissions.");
        }

        // Check if an appeal already exists for this review (Finality & Anti-Manufactured Evidence Rule)
        if (appealRepository.existsByReview(review)) {
            throw new IllegalStateException("Review ratings cannot be submitted after an appeal has already been filed.");
        }

        // Check duplicate rating
        if (reviewRatingRepository.existsByReview(review)) {
            throw new IllegalStateException("You have already rated this review.");
        }

        boolean isHelpful = req.getIsHelpful() != null ? req.getIsHelpful() : (req.getRating() >= 3);

        ReviewRating rating = new ReviewRating(review, author, req.getRating(), isHelpful, req.getComment());
        ReviewRating saved = reviewRatingRepository.save(rating);

        auditLedgerService.logEvent(
                "FEEDBACK_RATED",
                author.getEmail(),
                "ReviewRating",
                saved.getId(),
                "Author rated review " + reviewId + " | Rating: " + saved.getRating() + "/5 | Helpful: " + saved.getIsHelpful(),
                clientIp
        );

        ReviewRatingDto dto = ReviewRatingDto.from(saved);
        // Ensure reviewer pseudonym is set without leaking real identity
        dto.setReviewerPseudonym(review.getReviewerPseudonym());
        return dto;
    }

    @Transactional(readOnly = true)
    public Optional<ReviewRatingDto> getRatingForReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId).orElse(null);
        if (review == null) return Optional.empty();

        return reviewRatingRepository.findByReview(review).map(r -> {
            ReviewRatingDto dto = ReviewRatingDto.from(r);
            dto.setReviewerPseudonym(review.getReviewerPseudonym());
            return dto;
        });
    }

    /**
     * Computes aggregate feedback stats for a reviewer.
     */
    @Transactional(readOnly = true)
    public ReviewerFeedbackStats getReviewerFeedbackStats(User reviewer) {
        List<ReviewRating> ratings = reviewRatingRepository.findByReview_Reviewer(reviewer);
        if (ratings.isEmpty()) {
            return new ReviewerFeedbackStats(0, 0.0, 0.0);
        }

        double avgRating = ratings.stream().mapToInt(ReviewRating::getRating).average().orElse(0.0);
        long helpfulCount = ratings.stream().filter(r -> Boolean.TRUE.equals(r.getIsHelpful())).count();
        double helpfulPct = ((double) helpfulCount / ratings.size()) * 100.0;

        return new ReviewerFeedbackStats(
                ratings.size(),
                Math.round(avgRating * 10.0) / 10.0,
                Math.round(helpfulPct * 10.0) / 10.0
        );
    }

    public record ReviewerFeedbackStats(int totalRated, double averageRating, double helpfulPercentage) {}
}

package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.ReviewDto;
import com.trustreview.dto.SubmitReviewRequest;
import com.trustreview.model.User;
import com.trustreview.repository.UserRepository;
import com.trustreview.service.ReviewService;
import com.trustreview.service.ReviewRatingService;
import com.trustreview.dto.SubmitReviewRatingRequest;
import com.trustreview.dto.ReviewRatingDto;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewRatingService reviewRatingService;
    private final UserRepository userRepository;
    private final ClientIpResolver clientIpResolver;

    public ReviewController(ReviewService reviewService,
                            ReviewRatingService reviewRatingService,
                            UserRepository userRepository,
                            ClientIpResolver clientIpResolver) {
        this.reviewService = reviewService;
        this.reviewRatingService = reviewRatingService;
        this.userRepository = userRepository;
        this.clientIpResolver = clientIpResolver;
    }

    /**
     * GET /api/reviews/assigned-to-me � Reviews the logged-in student must complete.
     * Submission author identity is masked.
     */
    @GetMapping("/assigned-to-me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<ReviewDto>> assignedToMe(Authentication auth) {
        User reviewer = resolveUser(auth);
        return ResponseEntity.ok(reviewService.getAssignedToMe(reviewer));
    }

    /**
     * POST /api/reviews/{id}/submit � Student submits rubric scores + feedback.
     * Only the assigned reviewer can submit.
     */
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitReview(@PathVariable String id,
                                          @Valid @RequestBody SubmitReviewRequest req,
                                          Authentication auth) {
        try {
            User reviewer = resolveUser(auth);
            ReviewDto dto = reviewService.submitReview(id, req, reviewer);
            return ResponseEntity.ok(dto);
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    /**
     * GET /api/submissions/my-feedback � Completed reviews received on the student's own submissions.
     * Reviewer identity replaced with pseudonym.
     */
    @GetMapping("/my-feedback")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<ReviewDto>> myFeedback(Authentication auth) {
        User author = resolveUser(auth);
        return ResponseEntity.ok(reviewService.getMyFeedback(author));
    }


    /** POST /api/reviews/{id}/rate — STUDENT only (Author rates received review) */
    @PostMapping("/{id}/rate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> rateReview(
            @PathVariable String id,
            @Valid @RequestBody SubmitReviewRatingRequest req,
            Authentication auth,
            HttpServletRequest httpRequest) {
        try {
            User author = resolveUser(auth);
            String clientIp = clientIpResolver.resolveClientIp(httpRequest);
            ReviewRatingDto dto = reviewRatingService.rateReview(id, req, author, clientIp);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse(false, ex.getMessage()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    /** GET /api/reviews/{id}/rating — Authenticated */
    @GetMapping("/{id}/rating")
    public ResponseEntity<?> getReviewRating(@PathVariable String id) {
        return reviewRatingService.getRatingForReview(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "No rating found for review: " + id)));
    }

    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}

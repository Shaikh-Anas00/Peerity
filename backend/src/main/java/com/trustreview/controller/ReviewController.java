package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.ReviewDto;
import com.trustreview.dto.SubmitReviewRequest;
import com.trustreview.model.User;
import com.trustreview.security.PeerityUserDetails;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewRatingService reviewRatingService;
    private final ClientIpResolver clientIpResolver;

    public ReviewController(ReviewService reviewService,
                            ReviewRatingService reviewRatingService,
                            ClientIpResolver clientIpResolver) {
        this.reviewService = reviewService;
        this.reviewRatingService = reviewRatingService;
        this.clientIpResolver = clientIpResolver;
    }

    /**
     * GET /api/reviews/assigned-to-me � Reviews the logged-in student must complete.
     * Submission author identity is masked.
     */
    @GetMapping("/assigned-to-me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<ReviewDto>> assignedToMe(@AuthenticationPrincipal PeerityUserDetails principal) {
        User reviewer = principal.getUser();
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
                                          @AuthenticationPrincipal PeerityUserDetails principal) {
        try {
            User reviewer = principal.getUser();
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
    public ResponseEntity<List<ReviewDto>> myFeedback(@AuthenticationPrincipal PeerityUserDetails principal) {
        User author = principal.getUser();
        return ResponseEntity.ok(reviewService.getMyFeedback(author));
    }


    /** POST /api/reviews/{id}/rate — STUDENT only (Author rates received review) */
    @PostMapping("/{id}/rate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> rateReview(
            @PathVariable String id,
            @Valid @RequestBody SubmitReviewRatingRequest req,
            @AuthenticationPrincipal PeerityUserDetails principal,
            HttpServletRequest httpRequest) {
        User author = principal.getUser();
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        ReviewRatingDto dto = reviewRatingService.rateReview(id, req, author, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /** GET /api/reviews/{id}/rating — Authenticated */
    @GetMapping("/{id}/rating")
    public ResponseEntity<?> getReviewRating(@PathVariable String id) {
        return reviewRatingService.getRatingForReview(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "No rating found for review: " + id)));
    }

    /**
     * POST /api/reviews/distribute — INSTRUCTOR/ADMIN
     * Distributes reviews across submissions in a classroom.
     */
    @PostMapping("/distribute")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> distributeReviews(
            @RequestParam("courseRoomId") String courseRoomId,
            @RequestParam(value = "assignmentId", required = false) String assignmentId,
            @RequestBody(required = false) java.util.Map<String, Integer> body,
            Authentication auth) {
        int count = (body != null && body.containsKey("reviewerCount"))
                ? body.get("reviewerCount") : 2;
        User requestor = PeerityUserDetails.requireUser(auth);
        java.util.Map<String, Object> result;
        if (assignmentId != null && !assignmentId.isBlank()) {
            result = reviewService.distribute(assignmentId, count, requestor, courseRoomId);
        } else {
            result = reviewService.distributeForClassroom(courseRoomId, count, requestor);
        }
        return ResponseEntity.ok(result);
    }
}

package com.trustreview.service;

import com.trustreview.dto.ReviewDto;
import com.trustreview.dto.SubmitReviewRequest;
import com.trustreview.exception.InsufficientAnonymitySetException;
import com.trustreview.model.Assignment;
import com.trustreview.model.AssignmentPseudonym;
import com.trustreview.model.CourseRoom;
import com.trustreview.model.Role;
import com.trustreview.repository.AssignmentPseudonymRepository;
import com.trustreview.repository.CourseRoomEnrollmentRepository;
import com.trustreview.repository.CourseRoomRepository;
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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
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
    private final CourseRoomRepository courseRoomRepository;
    private final CourseRoomEnrollmentRepository enrollmentRepository;
    private final AssignmentPseudonymRepository pseudonymRepository;

    // Pseudonym alphabet pool
    private static final String[] PSEUDO_PREFIXES = {
        "Alpha","Beta","Gamma","Delta","Epsilon","Zeta","Eta","Theta",
        "Iota","Kappa","Lambda","Mu","Nu","Xi","Omicron","Pi"
    };

    @org.springframework.beans.factory.annotation.Autowired
    public ReviewService(ReviewRepository reviewRepository,
                         SubmissionRepository submissionRepository,
                         AssignmentRepository assignmentRepository,
                         UserRepository userRepository,
                         ReviewRatingRepository reviewRatingRepository,
                         AuditLedgerService auditLedgerService,
                         CourseRoomRepository courseRoomRepository,
                         CourseRoomEnrollmentRepository enrollmentRepository,
                         AssignmentPseudonymRepository pseudonymRepository) {
        this.reviewRepository = reviewRepository;
        this.submissionRepository = submissionRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.reviewRatingRepository = reviewRatingRepository;
        this.auditLedgerService = auditLedgerService;
        this.courseRoomRepository = courseRoomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.pseudonymRepository = pseudonymRepository;
    }

    public ReviewService(ReviewRepository reviewRepository,
                         SubmissionRepository submissionRepository,
                         AssignmentRepository assignmentRepository,
                         UserRepository userRepository,
                         ReviewRatingRepository reviewRatingRepository,
                         AuditLedgerService auditLedgerService) {
        this(reviewRepository, submissionRepository, assignmentRepository, userRepository,
             reviewRatingRepository, auditLedgerService, null, null, null);
    }

    /**
     * Distribute reviewers for all submissions in an assignment.
     * Rules:
     *  - reviewerCount in [1,3], default 2
     *  - A student cannot review their own submission
     *  - (totalStudents - 1) must be >= reviewerCount
     *  - Each reviewer gets a stable per-(student, assignment) pseudonym (HMAC-SHA256)
     *  - If room-scoped, enforces k >= 3 anonymity floor (throws InsufficientAnonymitySetException)
     */
    @Transactional
    public Map<String, Object> distribute(String assignmentId, int reviewerCount, User requestor) {
        return distribute(assignmentId, reviewerCount, requestor, null);
    }

    @Transactional
    public Map<String, Object> distribute(String assignmentId, int reviewerCount, User requestor, String courseRoomId) {
        if (reviewerCount < 1 || reviewerCount > 3) {
            throw new IllegalArgumentException("reviewerCount must be between 1 and 3.");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));

        CourseRoom courseRoom = null;
        if (courseRoomId != null && !courseRoomId.isBlank() && courseRoomRepository != null) {
            courseRoom = courseRoomRepository.findById(courseRoomId)
                    .orElseThrow(() -> new IllegalArgumentException("Course room not found: " + courseRoomId));
            boolean isOwner = courseRoom.getInstructor() != null && courseRoom.getInstructor().getId().equals(requestor.getId());
            if (!isOwner && requestor.getRole() != Role.ADMIN) {
                throw new SecurityException("You do not own this course room.");
            }
        }

        List<Submission> allSubmissions = submissionRepository.findByAssignmentOrderBySubmittedAtAsc(assignment);
        List<Submission> submissions;
        if (courseRoom != null) {
            String targetRoomId = courseRoom.getId();
            submissions = allSubmissions.stream()
                    .filter(s -> s.getCourseRoom() != null && targetRoomId.equals(s.getCourseRoom().getId()))
                    .collect(Collectors.toList());
        } else {
            submissions = allSubmissions;
        }

        if (submissions.isEmpty()) {
            throw new IllegalStateException("No submissions found for this assignment" + (courseRoom != null ? " in this classroom." : "."));
        }

        // Submission-time k >= 3 anonymity floor check for classrooms (or room-scoped assignments)
        boolean isRoomScoped = (courseRoom != null || assignment.getCourseRoom() != null);
        long distinctSubmitters = submissions.stream()
                .map(s -> s.getAuthor() != null ? s.getAuthor().getId() : null)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        if (isRoomScoped && distinctSubmitters < 3) {
            throw new InsufficientAnonymitySetException(
                "Cannot distribute reviews: only " + distinctSubmitters + " distinct submitter(s) found. " +
                "A minimum of 3 distinct submitters is required to preserve anonymity (k >= 3 floor)."
            );
        }

        int totalStudents = submissions.size();
        if (totalStudents - 1 < reviewerCount) {
            throw new IllegalStateException(
                "Not enough distinct students to assign " + reviewerCount + " reviewers per submission. " +
                "Need at least " + (reviewerCount + 1) + " submissions, found " + totalStudents + ".");
        }

        int reviewsCreated = 0;

        Set<String> targetEnrolledIds = null;
        if (courseRoom != null && enrollmentRepository != null) {
            targetEnrolledIds = enrollmentRepository.findByCourseRoomOrderByEnrolledAtDesc(courseRoom).stream()
                    .map(e -> e.getStudent().getId())
                    .collect(Collectors.toSet());
        }

        Set<String> alreadyAssignedPairs = reviewRepository.findBySubmissionIn(submissions).stream()
                .map(r -> r.getReviewer().getId() + "::" + r.getSubmission().getId())
                .collect(Collectors.toSet());

        for (Submission submission : submissions) {
            Set<String> allowedReviewerIds = targetEnrolledIds;
            if (allowedReviewerIds == null && submission.getCourseRoom() != null && enrollmentRepository != null) {
                allowedReviewerIds = enrollmentRepository.findByCourseRoomOrderByEnrolledAtDesc(submission.getCourseRoom()).stream()
                        .map(e -> e.getStudent().getId())
                        .collect(Collectors.toSet());
            }

            final Set<String> roomAllowedIds = allowedReviewerIds;

            // Remove author, already-assigned reviewers, and unenrolled students from the eligible pool
            List<User> eligibleReviewers = submissions.stream()
                    .map(Submission::getAuthor)
                    .filter(u -> !u.getId().equals(submission.getAuthor().getId()))
                    .filter(u -> !alreadyAssignedPairs.contains(u.getId() + "::" + submission.getId()))
                    .filter(u -> roomAllowedIds == null || roomAllowedIds.contains(u.getId()))
                    .collect(Collectors.toList());

            // Shuffle for randomness
            Collections.shuffle(eligibleReviewers);

            int toAssign = Math.min(reviewerCount, eligibleReviewers.size());
            List<User> assigned = eligibleReviewers.subList(0, toAssign);

            for (int i = 0; i < assigned.size(); i++) {
                Review review = new Review();
                review.setSubmission(submission);
                review.setReviewer(assigned.get(i));
                review.setReviewerPseudonym(getOrCreatePseudonym(assigned.get(i), assignment));
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
        if (courseRoom != null) {
            result.put("courseRoomId", courseRoom.getId());
            result.put("courseRoomName", courseRoom.getName());
        }
        result.put("submissionsProcessed", submissions.size());
        result.put("reviewsCreated", reviewsCreated);
        result.put("reviewersPerSubmission", reviewerCount);
        return result;
    }

    @Transactional
    public Map<String, Object> distributeForClassroom(String courseRoomId, int reviewerCount, User requestor) {
        if (courseRoomRepository == null) {
            throw new IllegalStateException("Course room repository not available.");
        }
        CourseRoom courseRoom = courseRoomRepository.findById(courseRoomId)
                .orElseThrow(() -> new IllegalArgumentException("Course room not found: " + courseRoomId));

        boolean isOwner = courseRoom.getInstructor() != null && courseRoom.getInstructor().getId().equals(requestor.getId());
        if (!isOwner && requestor.getRole() != Role.ADMIN) {
            throw new SecurityException("You do not own this course room.");
        }

        List<Submission> submissions = submissionRepository.findByCourseRoomOrderBySubmittedAtDesc(courseRoom);
        if (submissions.isEmpty()) {
            throw new IllegalStateException("No submissions found for course room: " + courseRoom.getName());
        }

        Map<String, List<Submission>> byAssignment = submissions.stream()
                .filter(s -> s.getAssignment() != null)
                .collect(Collectors.groupingBy(s -> s.getAssignment().getId()));

        int totalReviewsCreated = 0;
        int totalSubmissionsProcessed = 0;

        for (String assignmentId : byAssignment.keySet()) {
            try {
                Map<String, Object> res = distribute(assignmentId, reviewerCount, requestor, courseRoomId);
                totalReviewsCreated += ((Number) res.getOrDefault("reviewsCreated", 0)).intValue();
                totalSubmissionsProcessed += ((Number) res.getOrDefault("submissionsProcessed", 0)).intValue();
            } catch (IllegalStateException e) {
                // Skip assignments without sufficient submissions / anonymity floor
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("courseRoomId", courseRoomId);
        result.put("courseRoomName", courseRoom.getName());
        result.put("submissionsProcessed", totalSubmissionsProcessed);
        result.put("reviewsCreated", totalReviewsCreated);
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

        // Cryptographically chained audit event
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

    /**
     * Returns a stable pseudonym for a given (student, assignment) pair.
     * If one already exists in the DB, returns it (idempotent).
     * Otherwise, generates a new HMAC-SHA256-based pseudonym and persists it.
     * This ensures the same reviewer always has the same alias within one assignment
     * but different aliases across assignments — preventing longitudinal correlation.
     */
    private String getOrCreatePseudonym(User student, Assignment assignment) {
        if (pseudonymRepository != null && student != null && assignment != null) {
            return pseudonymRepository.findByStudentAndAssignment(student, assignment)
                    .map(AssignmentPseudonym::getPseudonym)
                    .orElseGet(() -> {
                        String pseudo = generateHmacPseudonym(student.getId(), assignment.getId());
                        AssignmentPseudonym ap = new AssignmentPseudonym(student, assignment, pseudo);
                        pseudonymRepository.save(ap);
                        return pseudo;
                    });
        }
        return generateHmacPseudonym(
                student != null ? student.getId() : UUID.randomUUID().toString(),
                assignment != null ? assignment.getId() : UUID.randomUUID().toString()
        );
    }

    /**
     * Generates an HMAC-SHA256-based pseudonym keyed on (studentId + ":" + assignmentId).
     * Format: "Reviewer-{Greek}-{4-hex-chars}" e.g. "Reviewer-Alpha-3F9A"
     */
    private String generateHmacPseudonym(String studentId, String assignmentId) {
        try {
            String keyMaterial = "PeerityPseudonymKey-v1-" + assignmentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(keyMaterial.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] hmac = mac.doFinal(studentId.getBytes(StandardCharsets.UTF_8));
            int prefixIdx = (hmac[0] & 0xFF) % PSEUDO_PREFIXES.length;
            String suffix = String.format("%02X%02X", hmac[1] & 0xFF, hmac[2] & 0xFF);
            return "Reviewer-" + PSEUDO_PREFIXES[prefixIdx] + "-" + suffix;
        } catch (Exception e) {
            return "Reviewer-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}

package com.trustreview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustreview.dto.AnalyticsDashboardDto;
import com.trustreview.model.*;
import com.trustreview.repository.AppealRepository;
import com.trustreview.repository.DisclosureRequestRepository;
import com.trustreview.repository.ReviewRepository;
import com.trustreview.repository.CalibrationScoreRepository;
import com.trustreview.repository.ReviewRatingRepository;
import com.trustreview.repository.UserRepository;
import com.trustreview.model.CalibrationScore;
import com.trustreview.model.ReviewRating;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    private final ReviewRepository reviewRepository;
    private final AppealRepository appealRepository;
    private final DisclosureRequestRepository disclosureRequestRepository;
    private final CalibrationScoreRepository calibrationScoreRepository;
    private final ReviewRatingRepository reviewRatingRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AnalyticsService(ReviewRepository reviewRepository,
                            AppealRepository appealRepository,
                            DisclosureRequestRepository disclosureRequestRepository,
                            CalibrationScoreRepository calibrationScoreRepository,
                            ReviewRatingRepository reviewRatingRepository,
                            UserRepository userRepository,
                            ObjectMapper objectMapper) {
        this.reviewRepository = reviewRepository;
        this.appealRepository = appealRepository;
        this.disclosureRequestRepository = disclosureRequestRepository;
        this.calibrationScoreRepository = calibrationScoreRepository;
        this.reviewRatingRepository = reviewRatingRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public AnalyticsDashboardDto getDashboardMetrics() {
        return getDashboardMetrics(null);
    }

    @Transactional(readOnly = true)
    public AnalyticsDashboardDto getDashboardMetrics(User currentUser) {
        AnalyticsDashboardDto dto = new AnalyticsDashboardDto();
        boolean isScopedInstructor = currentUser != null && currentUser.getRole() == Role.INSTRUCTOR;

        // 1. Review Completion
        List<Review> allReviews = reviewRepository.findAll();
        if (isScopedInstructor) {
            allReviews = allReviews.stream()
                    .filter(r -> r.getSubmission() != null &&
                            r.getSubmission().getAssignment() != null &&
                            r.getSubmission().getAssignment().getCreatedBy() != null &&
                            r.getSubmission().getAssignment().getCreatedBy().getId().equals(currentUser.getId()))
                    .toList();
        }

        long totalAssigned = allReviews.size();
        long completed = allReviews.stream().filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus())).count();
        long pending = Math.max(0, totalAssigned - completed);
        double completionRate = totalAssigned > 0
                ? Math.round(((double) completed / totalAssigned) * 1000.0) / 10.0
                : 0.0;
        dto.setReviewCompletion(new AnalyticsDashboardDto.ReviewCompletionDto(totalAssigned, completed, pending, completionRate));

        // 2. Score Distributions (Histogram bins: 0-20, 21-40, 41-60, 61-80, 81-100)
        long[] bins = new long[5]; // [0-20, 21-40, 41-60, 61-80, 81-100]
        List<Review> completedReviews = allReviews.stream().filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus())).toList();

        for (Review r : completedReviews) {
            if (r.getScores() != null && !r.getScores().isBlank()) {
                try {
                    Map<String, Object> scoreMap = objectMapper.readValue(
                            r.getScores(), new TypeReference<Map<String, Object>>() {});
                    for (Object val : scoreMap.values()) {
                        if (val instanceof Number num) {
                            double raw = num.doubleValue();
                            // If score is on 1-10 scale, normalize to 100
                            double normalized = raw <= 10.0 ? raw * 10.0 : raw;
                            if (normalized <= 20.0) bins[0]++;
                            else if (normalized <= 40.0) bins[1]++;
                            else if (normalized <= 60.0) bins[2]++;
                            else if (normalized <= 80.0) bins[3]++;
                            else bins[4]++;
                        }
                    }
                } catch (Exception e) {
                    log.warn("Could not parse review scores JSON for review {}: {}", r.getId(), e.getMessage());
                }
            }
        }

        dto.setScoreDistributions(List.of(
                new AnalyticsDashboardDto.ScoreDistributionDto("0-20", bins[0]),
                new AnalyticsDashboardDto.ScoreDistributionDto("21-40", bins[1]),
                new AnalyticsDashboardDto.ScoreDistributionDto("41-60", bins[2]),
                new AnalyticsDashboardDto.ScoreDistributionDto("61-80", bins[3]),
                new AnalyticsDashboardDto.ScoreDistributionDto("81-100", bins[4])
        ));

        // 3. Dispute Metrics
        List<Appeal> allAppeals = appealRepository.findAll();
        if (isScopedInstructor) {
            allAppeals = allAppeals.stream()
                    .filter(a -> a.getReview() != null &&
                            a.getReview().getSubmission() != null &&
                            a.getReview().getSubmission().getAssignment() != null &&
                            a.getReview().getSubmission().getAssignment().getCreatedBy() != null &&
                            a.getReview().getSubmission().getAssignment().getCreatedBy().getId().equals(currentUser.getId()))
                    .toList();
        }
        Map<String, Long> byReason = new LinkedHashMap<>();
        for (AppealReason reason : AppealReason.values()) {
            byReason.put(reason.name(), 0L);
        }
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (AppealStatus status : AppealStatus.values()) {
            byStatus.put(status.name(), 0L);
        }

        for (Appeal a : allAppeals) {
            if (a.getReason() != null) {
                byReason.put(a.getReason().name(), byReason.getOrDefault(a.getReason().name(), 0L) + 1L);
            }
            if (a.getStatus() != null) {
                byStatus.put(a.getStatus().name(), byStatus.getOrDefault(a.getStatus().name(), 0L) + 1L);
            }
        }
        dto.setDisputeMetrics(new AnalyticsDashboardDto.DisputeMetricsDto(byReason, byStatus, allAppeals.size()));

        // 4. Disclosure Tier Metrics
        Map<String, Long> tierMetrics = new LinkedHashMap<>();
        for (DisclosureLevel level : DisclosureLevel.values()) {
            tierMetrics.put(level.name(), 0L);
        }

        List<DisclosureRequest> approvedRequests =
                disclosureRequestRepository.findByStatus(DisclosureStatus.APPROVED);
        if (isScopedInstructor) {
            approvedRequests = approvedRequests.stream()
                    .filter(dr -> dr.getAppeal() != null &&
                            dr.getAppeal().getReview() != null &&
                            dr.getAppeal().getReview().getSubmission() != null &&
                            dr.getAppeal().getReview().getSubmission().getAssignment() != null &&
                            dr.getAppeal().getReview().getSubmission().getAssignment().getCreatedBy() != null &&
                            dr.getAppeal().getReview().getSubmission().getAssignment().getCreatedBy().getId().equals(currentUser.getId()))
                    .toList();
        }

        for (DisclosureRequest dr : approvedRequests) {
            if (dr.getRequestedLevel() != null) {
                tierMetrics.put(dr.getRequestedLevel().name(),
                        tierMetrics.getOrDefault(dr.getRequestedLevel().name(), 0L) + 1L);
            }
        }

        // Count reviews that remained anonymous (total reviews - approved disclosures)
        long totalApprovedDisclosures = approvedRequests.size();
        long anonymousCount = Math.max(0, totalAssigned - totalApprovedDisclosures);
        tierMetrics.put("LEVEL_0_ANONYMOUS", anonymousCount);

        dto.setDisclosureTierMetrics(tierMetrics);

        // 5. Reviewer Quality Metrics (Calibration & Author Feedback Ratings)
        List<CalibrationScore> allCalScores = calibrationScoreRepository.findAll();
        double avgCalScore = 0.0;
        if (!allCalScores.isEmpty()) {
            double sum = allCalScores.stream().mapToDouble(CalibrationScore::getAccuracyPercentage).sum();
            avgCalScore = Math.round((sum / allCalScores.size()) * 10.0) / 10.0;
        }

        long totalStudents = userRepository.findAll().stream().filter(u -> u.getRole() == Role.STUDENT).count();
        long calibratedStudents = allCalScores.stream().map(cs -> cs.getStudent().getId()).distinct().count();
        double calCompletionRate = totalStudents > 0
                ? Math.round(((double) calibratedStudents / totalStudents) * 1000.0) / 10.0
                : 0.0;

        List<ReviewRating> allRatings = reviewRatingRepository.findAll();
        double avgFeedbackRating = 0.0;
        double helpfulnessRate = 0.0;
        if (!allRatings.isEmpty()) {
            double sumRatings = allRatings.stream().mapToInt(ReviewRating::getRating).sum();
            avgFeedbackRating = Math.round((sumRatings / allRatings.size()) * 10.0) / 10.0;
            long helpfulCount = allRatings.stream().filter(r -> Boolean.TRUE.equals(r.getIsHelpful())).count();
            helpfulnessRate = Math.round(((double) helpfulCount / allRatings.size()) * 1000.0) / 10.0;
        }

        dto.setReviewerQuality(new AnalyticsDashboardDto.ReviewerQualityDto(
                avgCalScore, calCompletionRate, avgFeedbackRating, helpfulnessRate, allRatings.size()
        ));


        return dto;
    }
}

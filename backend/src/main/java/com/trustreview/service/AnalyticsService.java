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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Dashboard metrics aggregated in SQL (COUNT/GROUP BY pushed to the repository layer) rather
 * than loading entire tables with findAll() and aggregating in Java streams — the latter does
 * not survive real data volume. The one exception is the score-distribution histogram: the
 * `scores` column is an unparsed JSON blob, so binning it still requires fetching the relevant
 * rows and parsing JSON in Java. That is a known limitation (would need the scores column
 * normalized to fix properly), not something this pass addresses — it is however now scoped to
 * only the completed+instructor-scoped rows it actually needs, not the whole table.
 */
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
        String instructorId = isScopedInstructor ? currentUser.getId() : null;

        // 1 & 2. Review Completion + Score Distribution — one scoped query for the completed
        // list serves both purposes: its size is "completed", and its `scores` JSON feeds the
        // histogram below. totalAssigned is a pure COUNT, never materializing any rows.
        long totalAssigned = reviewRepository.countAllScoped(instructorId);
        List<Review> completedReviews = reviewRepository.findByStatusScoped("COMPLETED", instructorId);
        long completed = completedReviews.size();
        long pending = Math.max(0, totalAssigned - completed);
        double completionRate = totalAssigned > 0
                ? Math.round(((double) completed / totalAssigned) * 1000.0) / 10.0
                : 0.0;
        dto.setReviewCompletion(new AnalyticsDashboardDto.ReviewCompletionDto(totalAssigned, completed, pending, completionRate));

        long[] bins = new long[5]; // [0-20, 21-40, 41-60, 61-80, 81-100]
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

        // 3. Dispute Metrics — GROUP BY pushed to SQL instead of streaming every Appeal row.
        Map<String, Long> byReason = new LinkedHashMap<>();
        for (AppealReason reason : AppealReason.values()) {
            byReason.put(reason.name(), 0L);
        }
        for (Object[] row : appealRepository.countGroupedByReasonScoped(instructorId)) {
            AppealReason reason = (AppealReason) row[0];
            if (reason != null) byReason.put(reason.name(), (Long) row[1]);
        }

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (AppealStatus status : AppealStatus.values()) {
            byStatus.put(status.name(), 0L);
        }
        for (Object[] row : appealRepository.countGroupedByStatusScoped(instructorId)) {
            AppealStatus status = (AppealStatus) row[0];
            if (status != null) byStatus.put(status.name(), (Long) row[1]);
        }

        long totalDisputes = appealRepository.countAllScoped(instructorId);
        dto.setDisputeMetrics(new AnalyticsDashboardDto.DisputeMetricsDto(byReason, byStatus, totalDisputes));

        // 4. Disclosure Tier Metrics
        Map<String, Long> tierMetrics = new LinkedHashMap<>();
        for (DisclosureLevel level : DisclosureLevel.values()) {
            tierMetrics.put(level.name(), 0L);
        }
        for (Object[] row : disclosureRequestRepository.countGroupedByRequestedLevelScoped(DisclosureStatus.APPROVED, instructorId)) {
            DisclosureLevel level = (DisclosureLevel) row[0];
            if (level != null) tierMetrics.put(level.name(), (Long) row[1]);
        }

        // Count of reviews that remained anonymous (total reviews - approved disclosures)
        long totalApprovedDisclosures = disclosureRequestRepository.countByStatusScoped(DisclosureStatus.APPROVED, instructorId);
        long anonymousCount = Math.max(0, totalAssigned - totalApprovedDisclosures);
        tierMetrics.put("LEVEL_0_ANONYMOUS", anonymousCount);

        dto.setDisclosureTierMetrics(tierMetrics);

        // 5. Reviewer Quality Metrics (Calibration & Author Feedback Ratings).
        // Not instructor-scoped, matching the prior behavior exactly (these are course-wide
        // reviewer-reliability signals, not tied to a specific instructor's assignments).
        Double avgCalScoreRaw = calibrationScoreRepository.findAverageAccuracyPercentage();
        double avgCalScore = avgCalScoreRaw != null ? Math.round(avgCalScoreRaw * 10.0) / 10.0 : 0.0;

        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long calibratedStudents = calibrationScoreRepository.countDistinctStudents();
        double calCompletionRate = totalStudents > 0
                ? Math.round(((double) calibratedStudents / totalStudents) * 1000.0) / 10.0
                : 0.0;

        long totalRatings = reviewRatingRepository.count();
        Double avgRatingRaw = reviewRatingRepository.findAverageRating();
        double avgFeedbackRating = avgRatingRaw != null ? Math.round(avgRatingRaw * 10.0) / 10.0 : 0.0;
        long helpfulCount = reviewRatingRepository.countHelpful();
        double helpfulnessRate = totalRatings > 0
                ? Math.round(((double) helpfulCount / totalRatings) * 1000.0) / 10.0
                : 0.0;

        dto.setReviewerQuality(new AnalyticsDashboardDto.ReviewerQualityDto(
                avgCalScore, calCompletionRate, avgFeedbackRating, helpfulnessRate, totalRatings
        ));

        return dto;
    }
}

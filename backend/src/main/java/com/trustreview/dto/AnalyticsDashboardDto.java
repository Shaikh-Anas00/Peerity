package com.trustreview.dto;

import java.util.List;
import java.util.Map;

/**
 * Aggregated analytics metrics for instructors and administrators.
 */
public class AnalyticsDashboardDto {

    private ReviewCompletionDto reviewCompletion;
    private List<ScoreDistributionDto> scoreDistributions;
    private DisputeMetricsDto disputeMetrics;
    private Map<String, Long> disclosureTierMetrics;
    private ReviewerQualityDto reviewerQuality;

    public AnalyticsDashboardDto() {}

    public static class ReviewCompletionDto {
        private long totalAssigned;
        private long completed;
        private long pending;
        private double completionRate;

        public ReviewCompletionDto() {}

        public ReviewCompletionDto(long totalAssigned, long completed, long pending, double completionRate) {
            this.totalAssigned = totalAssigned;
            this.completed = completed;
            this.pending = pending;
            this.completionRate = completionRate;
        }

        public long getTotalAssigned() { return totalAssigned; }
        public void setTotalAssigned(long totalAssigned) { this.totalAssigned = totalAssigned; }
        public long getCompleted() { return completed; }
        public void setCompleted(long completed) { this.completed = completed; }
        public long getPending() { return pending; }
        public void setPending(long pending) { this.pending = pending; }
        public double getCompletionRate() { return completionRate; }
        public void setCompletionRate(double completionRate) { this.completionRate = completionRate; }
    }

    public static class ScoreDistributionDto {
        private String range; // "0-20", "21-40", "41-60", "61-80", "81-100"
        private long count;

        public ScoreDistributionDto() {}

        public ScoreDistributionDto(String range, long count) {
            this.range = range;
            this.count = count;
        }

        public String getRange() { return range; }
        public void setRange(String range) { this.range = range; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class DisputeMetricsDto {
        private Map<String, Long> byReason;
        private Map<String, Long> byStatus;
        private long totalDisputes;

        public DisputeMetricsDto() {}

        public DisputeMetricsDto(Map<String, Long> byReason, Map<String, Long> byStatus, long totalDisputes) {
            this.byReason = byReason;
            this.byStatus = byStatus;
            this.totalDisputes = totalDisputes;
        }

        public Map<String, Long> getByReason() { return byReason; }
        public void setByReason(Map<String, Long> byReason) { this.byReason = byReason; }
        public Map<String, Long> getByStatus() { return byStatus; }
        public void setByStatus(Map<String, Long> byStatus) { this.byStatus = byStatus; }
        public long getTotalDisputes() { return totalDisputes; }
        public void setTotalDisputes(long totalDisputes) { this.totalDisputes = totalDisputes; }
    }

    public ReviewCompletionDto getReviewCompletion() { return reviewCompletion; }
    public void setReviewCompletion(ReviewCompletionDto reviewCompletion) { this.reviewCompletion = reviewCompletion; }

    public List<ScoreDistributionDto> getScoreDistributions() { return scoreDistributions; }
    public void setScoreDistributions(List<ScoreDistributionDto> scoreDistributions) { this.scoreDistributions = scoreDistributions; }

    public DisputeMetricsDto getDisputeMetrics() { return disputeMetrics; }
    public void setDisputeMetrics(DisputeMetricsDto disputeMetrics) { this.disputeMetrics = disputeMetrics; }


    public static class ReviewerQualityDto {
        private double averageCalibrationScore;
        private double calibrationCompletionRate;
        private double averageFeedbackRating;
        private double helpfulnessRate;
        private long totalRatingsCount;

        public ReviewerQualityDto() {}

        public ReviewerQualityDto(double averageCalibrationScore, double calibrationCompletionRate,
                                  double averageFeedbackRating, double helpfulnessRate, long totalRatingsCount) {
            this.averageCalibrationScore = averageCalibrationScore;
            this.calibrationCompletionRate = calibrationCompletionRate;
            this.averageFeedbackRating = averageFeedbackRating;
            this.helpfulnessRate = helpfulnessRate;
            this.totalRatingsCount = totalRatingsCount;
        }

        public double getAverageCalibrationScore() { return averageCalibrationScore; }
        public void setAverageCalibrationScore(double averageCalibrationScore) { this.averageCalibrationScore = averageCalibrationScore; }
        public double getCalibrationCompletionRate() { return calibrationCompletionRate; }
        public void setCalibrationCompletionRate(double calibrationCompletionRate) { this.calibrationCompletionRate = calibrationCompletionRate; }
        public double getAverageFeedbackRating() { return averageFeedbackRating; }
        public void setAverageFeedbackRating(double averageFeedbackRating) { this.averageFeedbackRating = averageFeedbackRating; }
        public double getHelpfulnessRate() { return helpfulnessRate; }
        public void setHelpfulnessRate(double helpfulnessRate) { this.helpfulnessRate = helpfulnessRate; }
        public long getTotalRatingsCount() { return totalRatingsCount; }
        public void setTotalRatingsCount(long totalRatingsCount) { this.totalRatingsCount = totalRatingsCount; }
    }

    public ReviewerQualityDto getReviewerQuality() { return reviewerQuality; }
    public void setReviewerQuality(ReviewerQualityDto reviewerQuality) { this.reviewerQuality = reviewerQuality; }

    public Map<String, Long> getDisclosureTierMetrics() { return disclosureTierMetrics; }
    public void setDisclosureTierMetrics(Map<String, Long> disclosureTierMetrics) { this.disclosureTierMetrics = disclosureTierMetrics; }
}

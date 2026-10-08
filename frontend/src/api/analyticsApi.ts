import { apiClient } from "./client";

export interface ReviewCompletion {
  totalAssigned: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface DisputeMetrics {
  byReason: Record<string, number>;
  byStatus: Record<string, number>;
  totalDisputes: number;
}


export interface ReviewerQuality {
  averageCalibrationScore: number;
  calibrationCompletionRate: number;
  averageFeedbackRating: number;
  helpfulnessRate: number;
  totalRatingsCount: number;
}

export interface AnalyticsDashboardData {
  reviewCompletion: ReviewCompletion;
  scoreDistributions: ScoreDistribution[];
  disputeMetrics: DisputeMetrics;
  disclosureTierMetrics: Record<string, number>;
  reviewerQuality?: ReviewerQuality;
}

export const analyticsApi = {
  getDashboard: () =>
    apiClient.get<AnalyticsDashboardData>("/analytics/dashboard"),
};

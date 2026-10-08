import { apiClient } from "./client";
import { RubricCriterion } from "./assignmentApi";

export interface CalibrationSample {
  id: string;
  assignmentId?: string;
  assignmentTitle?: string;
  title: string;
  description: string;
  sampleContent: string;
  rubric?: RubricCriterion[];
  createdAt: string;
  isCompletedByMe: boolean;
  myAccuracyScore?: number | null;
}

export interface SubmitCalibrationPayload {
  scores: Record<string, number>;
  rationale: string;
}

export interface CalibrationResult {
  sampleId: string;
  sampleTitle: string;
  studentScores: Record<string, number>;
  expertScores: Record<string, number>;
  expertFeedback: string;
  meanAbsoluteError: number;
  accuracyPercentage: number;
  levelAgreementPct?: number;
  studentLevels?: Record<string, string>;
  expertLevels?: Record<string, string>;
  overallReliabilityScore: number | null;
  reliabilityTier: string;
}

export interface ReviewerReliability {
  studentId: string;
  studentName: string;
  reliabilityScore: number | null;
  reliabilityTier: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT_DATA";
  samplesCompleted: number;
  isCalibrated: boolean;
}

export const calibrationApi = {
  getSamples: (assignmentId?: string) =>
    apiClient.get<CalibrationSample[]>(`/calibration/samples${assignmentId ? `?assignmentId=${assignmentId}` : ""}`),

  evaluateSample: (sampleId: string, data: SubmitCalibrationPayload) =>
    apiClient.post<CalibrationResult>(`/calibration/${sampleId}/evaluate`, data),

  getMyReliability: () =>
    apiClient.get<ReviewerReliability>("/calibration/my-reliability"),
};

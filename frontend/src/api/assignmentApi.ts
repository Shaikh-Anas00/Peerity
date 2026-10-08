import { apiClient } from "./client";

export interface PerformanceLevel {
  label: string;
  score: number;
  scoreRange: string;
  description?: string;
}

export type EvaluationType = "SCALE_WITH_LEVELS" | "QUESTION_BASED";

export interface RubricOption {
  text: string;
  scoreValue?: number;
}

export interface RubricQuestion {
  prompt: string;
  options: RubricOption[];
}

export interface RubricCriterion {
  name: string;
  description?: string;
  weight?: number | null;
  levels: PerformanceLevel[];
  evaluationType?: EvaluationType;
  questions?: RubricQuestion[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  rubricCriteria: string; // Legacy JSON string
  rubric?: RubricCriterion[];
  deadline: string;
  reviewDeadline?: string;
  createdByName: string;
  createdById: string;
  createdAt: string;
  hasSubmitted?: boolean;
}

export interface CreateAssignmentPayload {
  title: string;
  description: string;
  rubricCriteria?: string;
  rubric?: RubricCriterion[];
  deadline: string;
  reviewDeadline?: string;
}

export const assignmentApi = {
  getAll: () => apiClient.get<Assignment[]>("/assignments"),
  getById: (id: string) => apiClient.get<Assignment>(`/assignments/${id}`),
  create: (data: CreateAssignmentPayload) =>
    apiClient.post<Assignment>("/assignments", data),
  distribute: (id: string, reviewerCount = 2) =>
    apiClient.post(`/assignments/${id}/distribute`, { reviewerCount }),
};

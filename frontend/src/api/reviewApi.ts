import { apiClient } from "./client";
import { RubricCriterion } from "./assignmentApi";

export interface Review {
  id: string;
  submissionId: string;
  submissionFileName: string;
  fileHash?: string;
  assignmentId: string;
  assignmentTitle: string;
  reviewDeadline?: string;
  scores: string | null; // JSON string
  rubric?: RubricCriterion[];
  feedbackText: string | null;
  status: "PENDING" | "COMPLETED";
  submittedAt: string | null;
  createdAt: string;
  reviewerPseudonym: string;
  isAnonymousView: boolean;
  reviewerId?: string;
  reviewerName?: string;
  authorRating?: number;
  authorRatingHelpful?: boolean;
  authorRatingComment?: string;
  answers?: string | null;
}


export interface SubmitReviewRatingPayload {
  rating: number; // 1-5
  isHelpful?: boolean;
  comment?: string;
}

export interface ReviewRating {
  id: string;
  reviewId: string;
  reviewerPseudonym?: string;
  rating: number;
  isHelpful: boolean;
  comment?: string;
  createdAt: string;
}

export interface SubmitReviewPayload {
  scores: string; // JSON string e.g. {"Code Quality":8}
  feedbackText: string;
  answers?: string; // Optional JSON string for question-based rubric answers
}

export const reviewApi = {
  getAssignedToMe: () => apiClient.get<Review[]>("/reviews/assigned-to-me"),
  getMyFeedback: () => apiClient.get<Review[]>("/reviews/my-feedback"),
  submit: (id: string, data: SubmitReviewPayload) =>
    apiClient.post<Review>(`/reviews/${id}/submit`, data),
  rateReview: (id: string, data: SubmitReviewRatingPayload) =>
    apiClient.post<ReviewRating>(`/reviews/${id}/rate`, data),
  getRating: (id: string) =>
    apiClient.get<ReviewRating>(`/reviews/${id}/rating`),
};

import { apiClient } from "./client";

export type AppealReason =
  | "HARASSMENT_OR_ABUSE"
  | "FACTUAL_FABRICATION"
  | "UNFAIR_GRADING_OUTLIER"
  | "PROCEDURAL_ERROR";

export type DisclosureLevel =
  | "LEVEL_0_ANONYMOUS"
  | "LEVEL_1_ELIGIBILITY"
  | "LEVEL_2_INSTITUTION_DEPT"
  | "LEVEL_3_ACADEMIC_STANDING"
  | "LEVEL_4_FULL_IDENTITY";

export type AppealStatus =
  | "SUBMITTED"
  | "UNDER_INVESTIGATION"
  | "RESOLVED_UPHELD"
  | "RESOLVED_DISMISSED";

export type DisclosureStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type VoteDecision = "APPROVE" | "REJECT";

export interface Appeal {
  id: string;
  reviewId: string;
  submissionId?: string;
  assignmentTitle?: string;
  reviewerPseudonym?: string;
  reviewScores?: string;
  reviewFeedback?: string;
  reason: AppealReason;
  statement: string;
  status: AppealStatus;
  evidenceFilePath?: string;
  resolution?: string;
  requestedLevel?: DisclosureLevel;
  recommendedLevel?: DisclosureLevel;
  disclosureStatus?: DisclosureStatus;
  // Phase 5 quorum fields
  approveCount: number;
  rejectCount: number;
  thresholdRequired: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface VoteDto {
  id: string;
  committeeMemberId: string;
  committeeMemberName: string;
  decision: VoteDecision;
  rationale: string;
  votedAt: string;
}

export interface QuorumStatusDto {
  appealId: string;
  disclosureRequestId: string;
  approveCount: number;
  rejectCount: number;
  thresholdRequired: number;
  totalVotesCast: number;
  quorumReached: boolean;
  disclosureStatus: DisclosureStatus;
  appealStatus: AppealStatus;
  requestedLevel: DisclosureLevel;
  currentUserHasVoted: boolean;
  currentUserVoteDecision?: VoteDecision | null;
  // B3 fix: recusal fields — were present in Java DTO but missing from TS type
  recused: boolean;
  recusalReason?: string | null;
  votes: VoteDto[];
}

export interface CreateAppealPayload {
  reviewId: string;
  reason: AppealReason;
  statement: string;
  requestedLevel?: DisclosureLevel;
  evidenceFilePath?: string;
}

export interface CastVotePayload {
  decision: VoteDecision;
  rationale: string;
}

export interface ResolveAppealPayload {
  status: "RESOLVED_UPHELD" | "RESOLVED_DISMISSED";
  approveDisclosure: boolean;
  resolutionNote?: string;
}

export interface DisclosedIdentity {
  pseudonym: string;
  level: DisclosureLevel;
  isApproved: boolean;
  eligibilityStatus?: string;
  course?: string;
  institution?: string;
  department?: string;
  academicStanding?: string;
  reviewsCompleted?: number;
  fullName?: string;
  email?: string;
}

export const appealApi = {
  create: (data: CreateAppealPayload) =>
    apiClient.post<Appeal>("/appeals", data),

  getMyAppeals: () =>
    apiClient.get<Appeal[]>("/appeals/my-appeals"),

  getPending: () =>
    apiClient.get<Appeal[]>("/appeals/pending"),

  resolve: (id: string, data: ResolveAppealPayload) =>
    apiClient.post<Appeal>(`/appeals/${id}/resolve`, data),

  castVote: (id: string, data: CastVotePayload) =>
    apiClient.post<QuorumStatusDto>(`/appeals/${id}/vote`, data),

  getVotes: (id: string) =>
    apiClient.get<QuorumStatusDto>(`/appeals/${id}/votes`),

  getDisclosedIdentity: (reviewId: string) =>
    apiClient.get<DisclosedIdentity>(`/reviews/${reviewId}/disclosed-identity`),
};
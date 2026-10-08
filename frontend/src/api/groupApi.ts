import { apiClient } from "./client";
import { RubricCriterion } from "./assignmentApi";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  description: string | null;
  status: "FORMING" | "ACTIVE" | "CLOSED";
  assignmentId: string | null;
  assignmentTitle: string | null;
  activeMemberCount: number;
  pendingMemberCount: number;
  createdAt: string;
}

export interface GroupMember {
  membershipId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: "LEADER" | "MEMBER";
  status: "PENDING" | "ACTIVE" | "REMOVED";
  joinedAt: string | null;
}

/**
 * Student-facing aggregate evaluation result.
 * NEVER contains evaluator identity — that is a backend-enforced privacy guarantee.
 */
export interface GroupMemberEvaluationAggregate {
  evaluateeId: string;
  evaluationCount: number;
  aggregateScores: Record<string, number>; // criterion → averaged score
  feedbackDisclosed: boolean;
  feedbackItems: string[] | null;          // null when not yet disclosed
  feedbackDisclosureMessage: string | null; // explanation when withheld
}

/** Instructor/Admin full attributed evaluation record */
export interface GroupMemberEvaluationAdmin {
  id: string;
  groupId: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluateeId: string;
  evaluateeName: string;
  scores: string; // JSON string
  feedback: string | null;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  assignmentId?: string;
}

export interface SubmitEvaluationPayload {
  evaluateeId: string;
  scores: string; // JSON string e.g. '{"Contribution":8,"Communication":7}'
  feedback: string;
}

// ── Standard evaluation criteria (matches backend constant) ──────────────────
export const EVALUATION_CRITERIA = ["Contribution", "Communication", "Reliability", "Teamwork"] as const;

export const EVALUATION_RUBRIC: RubricCriterion[] = [
  {
    name: "Contribution",
    description: "Quality, effort, and volume of deliverables contributed to the project milestones.",
    levels: [
      { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Consistently delivered high-quality work exceeding milestone goals." },
      { label: "Proficient", score: 8, scoreRange: "7-8", description: "Completed assigned deliverables thoroughly and on schedule." },
      { label: "Developing", score: 6, scoreRange: "5-6", description: "Completed basic tasks but required reminders or rework." },
      { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Failed to contribute meaningful deliverables." }
    ]
  },
  {
    name: "Communication",
    description: "Responsiveness, openness to feedback, and proactive coordination with team members.",
    levels: [
      { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Proactive, clear communicator who facilitated consensus and team synergy." },
      { label: "Proficient", score: 8, scoreRange: "7-8", description: "Regular, helpful updates and receptive to feedback." },
      { label: "Developing", score: 6, scoreRange: "5-6", description: "Occasional updates; occasionally unresponsive during critical milestones." },
      { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Unresponsive, dismissive, or created communication barriers." }
    ]
  },
  {
    name: "Reliability",
    description: "Meeting deadlines, honoring team commitments, and active attendance at meetings.",
    levels: [
      { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Flawless reliability; was the anchor for all team deadlines." },
      { label: "Proficient", score: 8, scoreRange: "7-8", description: "Met agreed deadlines and attended team check-ins." },
      { label: "Developing", score: 6, scoreRange: "5-6", description: "Missed deadlines occasionally or arrived unprepared." },
      { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Habitually late, missing meetings without notice." }
    ]
  },
  {
    name: "Teamwork",
    description: "Fostering positive team morale, helping teammates, and collaborative problem solving.",
    levels: [
      { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Elevated entire team morale, supported others, resolved friction gracefully." },
      { label: "Proficient", score: 8, scoreRange: "7-8", description: "Supportive collaborator who worked harmoniously with everyone." },
      { label: "Developing", score: 6, scoreRange: "5-6", description: "Worked in isolation; reluctant to assist peers or adjust to team needs." },
      { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Disruptive, uncooperative, or hostile toward teammates." }
    ]
  }
];

// ── API client ───────────────────────────────────────────────────────────────

export const groupApi = {
  // ── Group CRUD (instructor/admin) ──────────────────────────────────────────
  createGroup: (data: CreateGroupPayload) =>
    apiClient.post<Group>("/groups", data),

  getAllGroups: (assignmentId?: string) =>
    apiClient.get<Group[]>("/groups", {
      params: assignmentId ? { assignmentId } : undefined,
    }),

  // ── Group membership (all authenticated) ───────────────────────────────────
  getMyGroups: () =>
    apiClient.get<Group[]>("/groups/my"),

  getGroupMembers: (groupId: string) =>
    apiClient.get<GroupMember[]>(`/groups/${groupId}/members`),

  joinGroup: (groupId: string) =>
    apiClient.post(`/groups/${groupId}/join`, {}),

  // ── Member management (instructor/admin) ───────────────────────────────────
  approveMember: (groupId: string, userId: string) =>
    apiClient.post(`/groups/${groupId}/members/${userId}/approve`, {}),

  removeMember: (groupId: string, userId: string) =>
    apiClient.delete(`/groups/${groupId}/members/${userId}`),

  // ── Peer evaluation (student: submit + aggregate view) ─────────────────────
  submitEvaluation: (groupId: string, data: SubmitEvaluationPayload) =>
    apiClient.post(`/groups/${groupId}/evaluations`, data),

  /** Student-facing: aggregate scores, no evaluator names. Backend enforces this. */
  getMyEvaluationAggregate: (groupId: string) =>
    apiClient.get<GroupMemberEvaluationAggregate>(`/groups/${groupId}/evaluations/my-aggregate`),

  /** Instructor/Admin-facing: full attributed evaluations (audit logged on backend). */
  getAllEvaluations: (groupId: string) =>
    apiClient.get<GroupMemberEvaluationAdmin[]>(`/groups/${groupId}/evaluations/all`),
};

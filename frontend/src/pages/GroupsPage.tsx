/**
 * GroupsPage.tsx — Student view of group formation and peer evaluation.
 *
 * Tabs per group:
 *   Members     — group member list, join button for non-members
 *   Evaluate    — step-by-step rubric to evaluate each team member
 *   My Results  — aggregate scores received (NO evaluator names)
 *
 * Privacy note: The "My Results" tab is backed by /evaluations/my-aggregate which
 * is a backend-enforced endpoint. Even if a student modifies the frontend, they
 * cannot retrieve evaluator identities — that endpoint physically cannot return them.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Star,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Eye,
  ShieldCheck,
  Info,
  BarChart2,
  Lock,
} from "lucide-react";
import {
  groupApi,
  EVALUATION_CRITERIA,
  EVALUATION_RUBRIC,
  Group,
  GroupMember,
  GroupMemberEvaluationAggregate,
} from "../api/groupApi";
import { useAuth } from "../context/AuthContext";
import { ContentHeader, StatusPill } from "../components/ContentHeader";
import { SteppedCriterionScoring } from "../components/SteppedCriterionScoring";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

// ── Toast helper ─────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface Toast { msg: string; type: ToastType }

// =============================================================================
// STATUS BADGE
// =============================================================================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, string> = {
    FORMING: "bg-amber-50 text-amber-700 border-amber-200",
    ACTIVE:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    CLOSED:  "bg-slate-100 text-slate-500 border-slate-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    REMOVED: "bg-red-50 text-red-700 border-red-200",
    LEADER:  "bg-peerity-100 text-peerity-800 border-peerity-200",
    MEMBER:  "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${cfg[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
};

// =============================================================================
// STEP-BY-STEP PEER EVALUATION FORM
// =============================================================================
interface PeerEvalFormProps {
  member: GroupMember;
  groupId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

const PeerEvalForm: React.FC<PeerEvalFormProps> = ({ member, groupId, onSubmitted, onCancel }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <SteppedCriterionScoring
        criteria={EVALUATION_RUBRIC}
        title={
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-peerity-700 font-display">
              Evaluating Teammate
            </p>
            <h3 className="text-base font-bold text-slate-900 font-display">{member.userName}</h3>
          </div>
        }
        subtitle={`Role: ${member.role}`}
        headerExtra={
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
            title="Back to roster"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        }
        requireFeedback={true}
        feedbackLabel="Written Feedback"
        feedbackPlaceholder="Provide specific, constructive observations about this team member's contribution, communication, and reliability."
        feedbackMinLength={10}
        submitButtonText="Submit Evaluation"
        onCancel={onCancel}
        onSubmit={async (scores, feedback) => {
          await groupApi.submitEvaluation(groupId, {
            evaluateeId: member.userId,
            scores: JSON.stringify(scores),
            feedback: feedback.trim(),
          });
          onSubmitted();
        }}
      />
    </div>
  );
};

// =============================================================================
// GROUP DETAIL PANEL (members + evaluate + results tabs)
// =============================================================================
interface GroupDetailProps {
  group: Group;
  onBack: () => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onBack }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"members" | "evaluate" | "results">("members");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [evaluatingMember, setEvaluatingMember] = useState<GroupMember | null>(null);
  const [submittedFor, setSubmittedFor] = useState<Set<string>>(new Set());
  const [aggregate, setAggregate] = useState<GroupMemberEvaluationAggregate | null>(null);
  const [loadingAggregate, setLoadingAggregate] = useState(false);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await groupApi.getGroupMembers(group.id);
      setMembers(res.data);
    } catch { setMembers([]); } finally { setLoadingMembers(false); }
  }, [group.id]);

  const loadAggregate = useCallback(async () => {
    setLoadingAggregate(true);
    try {
      const res = await groupApi.getMyEvaluationAggregate(group.id);
      setAggregate(res.data);
    } catch { setAggregate(null); } finally { setLoadingAggregate(false); }
  }, [group.id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { if (tab === "results") loadAggregate(); }, [tab, loadAggregate]);

  const isMember = members.some(m => m.userId === user?.id && m.status === "ACTIVE");
  const myMembership = members.find(m => m.userId === user?.id);
  const evaluableMembers = members.filter(m =>
    m.userId !== user?.id && m.status === "ACTIVE"
  );

  const handleJoin = async () => {
    setJoining(true);
    try {
      await groupApi.joinGroup(group.id);
      showToast("Join request submitted. Awaiting instructor approval.", "success");
      await loadMembers();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Could not join group.", "error");
    } finally { setJoining(false); }
  };

  const tabCls = (t: typeof tab) =>
    `px-4 py-2 text-sm font-semibold border-b-2 transition font-display ${
      tab === t ? "border-peerity-800 text-peerity-800" : "border-transparent text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="space-y-4">
      {/* Content Header matching "Team Alpha / Evaluate Member [ACTIVE GROUP]" */}
      <ContentHeader
        breadcrumbs={[
          { label: "My Groups", onClick: onBack },
          { label: group.name, onClick: () => setTab("members") },
          ...(tab === "evaluate" ? [{ label: "Evaluate Member" }] : tab === "results" ? [{ label: "My Results" }] : []),
        ]}
        title={group.name}
        subtitle={
          <div className="flex items-center gap-3 flex-wrap mt-0.5 text-xs text-slate-500 font-body">
            {group.assignmentTitle && (
              <span className="text-peerity-700 font-semibold">
                Assignment: {group.assignmentTitle}
              </span>
            )}
            <span>{group.activeMemberCount} active member{group.activeMemberCount !== 1 ? "s" : ""}</span>
            {group.pendingMemberCount > 0 && (
              <span className="text-amber-600 font-medium">
                • {group.pendingMemberCount} pending approval
              </span>
            )}
            {myMembership && (
              <span className="text-peerity-800 font-medium">
                • Role: {myMembership.role}
              </span>
            )}
            {group.description && (
              <span className="text-slate-400 block w-full mt-0.5">
                {group.description}
              </span>
            )}
          </div>
        }
        icon={Users}
        statusPill={
          <StatusPill
            label={`${group.status} GROUP`}
            variant={group.status === "ACTIVE" ? "success" : group.status === "FORMING" ? "warning" : "neutral"}
          />
        }
        actions={
          !isMember && !myMembership && group.status !== "CLOSED" ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex items-center gap-1.5 px-4 py-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50 flex-shrink-0 font-display"
            >
              {joining ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {joining ? "Requesting…" : "Request to Join"}
            </button>
          ) : myMembership?.status === "PENDING" ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold font-body">
              <Clock className="w-3.5 h-3.5" />Pending Approval
            </span>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 px-2">
          <button onClick={() => setTab("members")} className={tabCls("members")}>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Members</span>
          </button>
          {isMember && (
            <>
              <button onClick={() => setTab("evaluate")} className={tabCls("evaluate")}>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" />Evaluate</span>
              </button>
              <button onClick={() => setTab("results")} className={tabCls("results")}>
                <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" />My Results</span>
              </button>
            </>
          )}
        </div>

        <div className="p-5">
          {/* Members tab */}
          {tab === "members" && (
            loadingMembers ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-peerity-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <Users className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-sm">No members yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.map(m => (
                  <div key={m.membershipId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-peerity-100 text-peerity-800 flex items-center justify-center text-xs font-bold font-display flex-shrink-0">
                      {m.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 font-display">{m.userName}</p>
                      <p className="text-xs text-slate-500 font-body">{m.userEmail}</p>
                    </div>
                    <StatusBadge status={m.role} />
                    <StatusBadge status={m.status} />
                  </div>
                ))}
              </div>
            )
          )}

          {/* Evaluate tab */}
          {tab === "evaluate" && isMember && (
            <div className="space-y-4">
              {/* Privacy notice banner */}
              <div className="flex items-start gap-2 p-3 bg-peerity-100/40 rounded-xl border border-peerity-200 text-xs text-peerity-800 font-body">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Your evaluations are <strong>anonymous to your peers</strong>. Your instructor can view attributed evaluations for course accountability purposes only.
                </span>
              </div>

              {evaluableMembers.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <Users className="w-10 h-10 opacity-30 mb-2" />
                  <p className="text-sm font-semibold text-slate-600 font-display">No other active teammates to evaluate</p>
                  <p className="text-xs text-slate-400 font-body">Once other students join and are confirmed, they will appear here.</p>
                </div>
              ) : (
                <>
                  {/* Teammate Evaluation Progress & Visible Roster */}
                  <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-peerity-800" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                          Team Evaluation Roster
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-body">
                          {evaluableMembers.filter(m => submittedFor.has(m.userId)).length} of {evaluableMembers.length} evaluated
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-display ${
                            evaluableMembers.filter(m => submittedFor.has(m.userId)).length === evaluableMembers.length
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {evaluableMembers.filter(m => submittedFor.has(m.userId)).length === evaluableMembers.length
                            ? "All Completed"
                            : `${Math.round((evaluableMembers.filter(m => submittedFor.has(m.userId)).length / evaluableMembers.length) * 100)}% Complete`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar across all teammates */}
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-peerity-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${(evaluableMembers.filter(m => submittedFor.has(m.userId)).length / evaluableMembers.length) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Teammate cards (always visible, showing progress across all teammates) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {evaluableMembers.map(m => {
                        const isSubmitted = submittedFor.has(m.userId);
                        const isBeingScored = evaluatingMember?.userId === m.userId;

                        return (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => {
                              if (!isSubmitted) {
                                setEvaluatingMember(m);
                              }
                            }}
                            className={`flex items-center justify-between p-3 rounded-lg border text-left transition ${
                              isBeingScored
                                ? "bg-peerity-100/70 border-peerity-600 ring-2 ring-peerity-600/30 shadow-xs"
                                : isSubmitted
                                ? "bg-white border-slate-200/80 opacity-90 cursor-default"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display flex-shrink-0 ${
                                  isBeingScored
                                    ? "bg-peerity-800 text-white"
                                    : isSubmitted
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {m.userName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate font-display">
                                  {m.userName}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate font-body">
                                  {m.role}
                                </p>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {isSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 font-display">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Submitted
                                </span>
                              ) : isBeingScored ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-peerity-800 text-white font-display">
                                  <Star className="w-3 h-3" />
                                  Scoring
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-display">
                                  Evaluate
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Evaluation Form OR Selection State */}
                  {evaluatingMember ? (
                    <PeerEvalForm
                      member={evaluatingMember}
                      groupId={group.id}
                      onSubmitted={() => {
                        setSubmittedFor(prev => new Set([...prev, evaluatingMember.userId]));
                        setEvaluatingMember(null);
                        showToast(`Evaluation for ${evaluatingMember.userName} submitted!`, "success");
                      }}
                      onCancel={() => setEvaluatingMember(null)}
                    />
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
                      <div className="w-12 h-12 bg-peerity-100 rounded-full flex items-center justify-center mx-auto text-peerity-800">
                        <Star className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 font-display">
                        {evaluableMembers.filter(m => submittedFor.has(m.userId)).length === evaluableMembers.length
                          ? "All Teammate Evaluations Submitted"
                          : "Select a Teammate Above to Evaluate"}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto font-body">
                        {evaluableMembers.filter(m => submittedFor.has(m.userId)).length === evaluableMembers.length
                          ? "You have completed peer reviews for all active members in this group. Thank you for your feedback!"
                          : "Click 'Evaluate' on any teammate in the roster above to launch the stepped rubric scoring form."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* My Results tab */}
          {tab === "results" && isMember && (
            loadingAggregate ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-peerity-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !aggregate ? (
              <div className="flex flex-col items-center py-12 text-slate-400">
                <Eye className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-sm font-semibold text-slate-700 font-display">Could not load results</p>
                <p className="text-xs text-slate-400 font-body">Check back after evaluations have been processed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Privacy notice */}
                <div className="flex items-start gap-2 p-3 bg-peerity-100/40 rounded-xl border border-peerity-200 text-xs text-peerity-800 font-body">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    You see <strong>aggregate scores only</strong>. Evaluator identities are never disclosed to peers — this disclosure-gating is strictly enforced at the server level.
                  </span>
                </div>

                {/* Score Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 bg-peerity-100 rounded-xl flex items-center justify-center text-peerity-800 flex-shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900 font-display leading-tight">
                        {aggregate.evaluationCount}
                      </div>
                      <p className="text-xs text-slate-500 font-body">
                        Peer evaluation{aggregate.evaluationCount !== 1 ? "s" : ""} received
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-700 flex-shrink-0">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-700 font-display leading-tight">
                        {aggregate.evaluationCount > 0 && Object.keys(aggregate.aggregateScores).length > 0
                          ? `${(
                              Object.values(aggregate.aggregateScores).reduce((a, b) => a + b, 0) /
                              Object.values(aggregate.aggregateScores).length
                            ).toFixed(1)} / 10`
                          : "—"}
                      </div>
                      <p className="text-xs text-slate-500 font-body">Composite Mean Score</p>
                    </div>
                  </div>
                </div>

                {/* Chart-based visualization using Recharts */}
                {aggregate.evaluationCount > 0 && Object.keys(aggregate.aggregateScores).length > 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-display">
                          Criterion Performance Breakdown
                        </h4>
                        <p className="text-xs text-slate-500 font-body">
                          Mean score received across all anonymous peer evaluations (0 to 10 scale)
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-peerity-800 bg-peerity-100 px-2 py-0.5 rounded border border-peerity-200">
                        10.0 Max
                      </span>
                    </div>

                    {/* Recharts Horizontal Bar Chart */}
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(aggregate.aggregateScores).map(([criterion, avg]) => ({
                            criterion,
                            score: Number(avg.toFixed(1)),
                          }))}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis
                            type="number"
                            domain={[0, 10]}
                            ticks={[0, 2, 4, 6, 8, 10]}
                            stroke="#94a3b8"
                            fontSize={11}
                          />
                          <YAxis
                            dataKey="criterion"
                            type="category"
                            width={150}
                            stroke="#475569"
                            fontSize={12}
                            tickLine={false}
                          />
                          <RechartsTooltip
                            formatter={(value: any) => [`${value} / 10`, "Average Score"]}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderRadius: "8px",
                              border: "none",
                              color: "#ffffff",
                              fontSize: "12px",
                            }}
                            itemStyle={{ color: "#2dd4bf" }}
                          />
                          <Bar dataKey="score" fill="#0f766e" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Numerical breakdown row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      {Object.entries(aggregate.aggregateScores).map(([criterion, avg]) => (
                        <div
                          key={criterion}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                        >
                          <span className="font-medium text-slate-700 font-body truncate pr-2">
                            {criterion}
                          </span>
                          <span className="font-mono font-bold text-peerity-800 flex-shrink-0">
                            {avg.toFixed(1)} / 10
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">
                    <BarChart2 className="w-10 h-10 opacity-30 mb-2" />
                    <p className="text-sm font-semibold text-slate-700 font-display">No Evaluation Data Yet</p>
                    <p className="text-xs text-slate-400 font-body">Aggregate scores will compute once teammates submit their evaluations.</p>
                  </div>
                )}

                {/* Peer Feedback Section */}
                {aggregate.feedbackDisclosed && aggregate.feedbackItems && aggregate.feedbackItems.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">
                      Peer Feedback (Anonymized)
                    </p>
                    {aggregate.feedbackItems.map((fb, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 italic font-body shadow-xs"
                      >
                        "{fb}"
                      </div>
                    ))}
                  </div>
                ) : !aggregate.feedbackDisclosed && aggregate.feedbackDisclosureMessage ? (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-body">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{aggregate.feedbackDisclosureMessage}</span>
                  </div>
                ) : null}
              </div>
            )
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600" : toast.type === "error" ? "bg-red-600" : "bg-peerity-800"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// GROUPS PAGE (main list view)
// =============================================================================
export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await groupApi.getMyGroups();
      setGroups(res.data);
    } catch { setGroups([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (selectedGroup) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
        <GroupDetail group={selectedGroup} onBack={() => { setSelectedGroup(null); load(); }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600" : toast.type === "error" ? "bg-red-600" : "bg-peerity-800"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <ContentHeader
        breadcrumbs={["Collaboration", "My Groups"]}
        title="My Groups"
        subtitle={`${groups.length} group${groups.length !== 1 ? "s" : ""} active in current term`}
        icon={Users}
        statusPill={<StatusPill label="ACTIVE ROSTER" variant="brand" />}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-400 opacity-30 mb-3" />
          <p className="font-semibold text-slate-800 font-display">No groups yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm font-body">
            Your instructor will create groups for your course. Join requests can be submitted from this page once groups are available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <button key={g.id} onClick={() => setSelectedGroup(g)}
              className="w-full text-left bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
              <div className="w-full">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-peerity-600 flex-shrink-0" />
                    <h3 className="font-semibold text-slate-900 font-display truncate">{g.name}</h3>
                  </div>
                  <StatusBadge status={g.status} />
                </div>
                {g.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2 font-body">{g.description}</p>}
                {g.assignmentTitle && <p className="text-xs text-peerity-700 font-semibold">{g.assignmentTitle}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500 font-body">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {g.activeMemberCount} active members
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

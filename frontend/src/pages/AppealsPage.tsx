import React, { useEffect, useState, useCallback } from "react";
import {
  appealApi,
  Appeal,
  DisclosedIdentity,
  AppealStatus,
  QuorumStatusDto,
  VoteDecision,
} from "../api/appealApi";
import { useAuth } from "../context/AuthContext";
import { ContentHeader, StatusPill } from "../components/ContentHeader";
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Building2,
  GraduationCap,
  Eye,
  Lock,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Vote,
  Users,
} from "lucide-react";

// ── Progressive Disclosure Stepper ──────────────────────────────────────────

const TIERS = [
  { level: "LEVEL_0_ANONYMOUS", rank: 0, title: "Level 0: Anonymous", desc: "Reviewer pseudonym only", icon: Lock },
  { level: "LEVEL_1_ELIGIBILITY", rank: 1, title: "Level 1: Eligibility", desc: "Enrollment & course status", icon: UserCheck },
  { level: "LEVEL_2_INSTITUTION_DEPT", rank: 2, title: "Level 2: Institution & Dept", desc: "Institution & department", icon: Building2 },
  { level: "LEVEL_3_ACADEMIC_STANDING", rank: 3, title: "Level 3: Academic Standing", desc: "Year & review history", icon: GraduationCap },
  { level: "LEVEL_4_FULL_IDENTITY", rank: 4, title: "Level 4: Full Legal Identity", desc: "Full legal name & email", icon: Eye },
];

interface StepperProps { currentLevel?: string; isApproved?: boolean; }

const ProgressiveDisclosureStepper: React.FC<StepperProps> = ({ currentLevel = "LEVEL_0_ANONYMOUS", isApproved = false }) => {
  const activeTier = TIERS.find(t => t.level === currentLevel) || TIERS[0];
  const activeRank = isApproved ? activeTier.rank : 0;
  return (
    <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Progressive Disclosure Stepper
        </span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border font-display ${
          isApproved ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-slate-200 text-slate-700 border-slate-300"
        }`}>
          {isApproved ? `Unlocked: ${activeTier.title}` : "Level 0: Double-Blind Anonymous"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2 relative">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isUnlocked = tier.rank <= activeRank;
          const isTarget = tier.rank === activeTier.rank;
          return (
            <div key={tier.level} className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
              isUnlocked ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm"
              : isTarget && !isApproved ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-white border-slate-200 text-slate-400"
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 ${
                isUnlocked ? "bg-emerald-600 text-white"
                : isTarget && !isApproved ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-400"
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] font-bold leading-tight line-clamp-1 font-display">{tier.title.split(":")[1]}</p>
              <p className="text-[9px] mt-0.5 opacity-80 leading-tight hidden sm:block font-body">{tier.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Quorum Voting Card ────────────────────────────────────────────────────────

interface QuorumCardProps {
  appeal: Appeal;
  onVoteSuccess: () => void;
}

const QuorumVotingCard: React.FC<QuorumCardProps> = ({ appeal, onVoteSuccess }) => {
  const [quorum, setQuorum] = useState<QuorumStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<VoteDecision>("APPROVE");
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState(false);

  const loadQuorum = useCallback(async () => {
    try {
      const res = await appealApi.getVotes(appeal.id);
      setQuorum(res.data);
    } catch {
      // If still SUBMITTED and no votes exist, construct a minimal quorum state
      setQuorum(null);
    } finally {
      setLoading(false);
    }
  }, [appeal.id]);

  useEffect(() => { loadQuorum(); }, [loadQuorum]);

  const handleVote = async () => {
    if (rationale.trim().length < 10) {
      setError("Rationale must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await appealApi.castVote(appeal.id, { decision, rationale: rationale.trim() });
      setQuorum(res.data);
      setVoteSuccess(true);
      setRationale("");
      onVoteSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cast vote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Derive quorum info from appeal if quorum status not yet loaded
  const approveCount = quorum?.approveCount ?? appeal.approveCount;
  const rejectCount = quorum?.rejectCount ?? appeal.rejectCount;
  const thresholdRequired = quorum?.thresholdRequired ?? appeal.thresholdRequired ?? 2;
  const totalVotes = approveCount + rejectCount;
  const isQuorumReached = quorum?.quorumReached ?? (appeal.disclosureStatus !== "PENDING_APPROVAL");
  const hasVoted = quorum?.currentUserHasVoted ?? false;
  const myDecision = quorum?.currentUserVoteDecision;
  const progressPct = Math.min((approveCount / thresholdRequired) * 100, 100);

  return (
    <div className="bg-white border border-orange-200 rounded-2xl p-5 space-y-4 shadow-sm font-body">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <Vote className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 font-display">Committee Quorum Vote</p>
          <p className="text-xs text-slate-500">Requires {thresholdRequired} approvals from {3} committee members</p>
        </div>
        {isQuorumReached && (
          <span className={`ml-auto text-[11px] font-bold px-3 py-1 rounded-full border font-display ${
            quorum?.disclosureStatus === "APPROVED" || appeal.disclosureStatus === "APPROVED"
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : "bg-red-100 text-red-800 border-red-300"
          }`}>
            {quorum?.disclosureStatus === "APPROVED" || appeal.disclosureStatus === "APPROVED"
              ? "✓ Quorum Approved" : "✗ Quorum Rejected"}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-slate-700">
            {approveCount} / {thresholdRequired} Approvals Needed to Disclose
          </span>
          <div className="flex gap-2 text-xs">
            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              ✓ {approveCount} Approve
            </span>
            <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              ✗ {rejectCount} Reject
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isQuorumReached && (quorum?.disclosureStatus === "APPROVED" || appeal.disclosureStatus === "APPROVED")
                ? "bg-emerald-500" : "bg-orange-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Vote History */}
      {quorum && quorum.votes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Vote History ({totalVotes} cast)
          </p>
          {quorum.votes.map((vote) => (
            <div key={vote.id} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
              vote.decision === "APPROVE"
                ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
            }`}>
              <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                vote.decision === "APPROVE" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              }`}>
                {vote.decision === "APPROVE" ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">{vote.committeeMemberName}</span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(vote.votedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-700 mt-0.5 italic">"{vote.rationale}"</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-xs text-slate-400 text-center py-2">Loading vote history...</p>
      )}

      {/* Voting Form */}
      {!isQuorumReached && (
        <div className="border-t border-slate-200 pt-4 space-y-3">
          {/* B3 fix: recusal notice — rendered before the vote form check */}
          {quorum?.recused ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Recused — Cannot Vote</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  {quorum.recusalReason || "You have a conflict of interest in this dispute and are excluded from the vote to preserve procedural fairness."}
                </p>
              </div>
            </div>
          ) : hasVoted ? (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium border ${
              myDecision === "APPROVE"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}>
              {myDecision === "APPROVE"
                ? <ThumbsUp className="w-4 h-4" />
                : <ThumbsDown className="w-4 h-4" />}
              You have already voted: <strong>{myDecision}</strong>. Awaiting other committee members.
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase text-slate-600 tracking-wider">Cast Your Vote</p>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              {voteSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> Vote recorded successfully.
                </div>
              )}

              {/* Decision Toggle */}
              <div className="flex gap-2 font-display">
                <button
                  onClick={() => setDecision("APPROVE")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition flex items-center justify-center gap-2 ${
                    decision === "APPROVE"
                      ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" /> Approve Disclosure
                </button>
                <button
                  onClick={() => setDecision("REJECT")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition flex items-center justify-center gap-2 ${
                    decision === "REJECT"
                      ? "border-red-500 bg-red-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-red-300"
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" /> Reject Disclosure
                </button>
              </div>

              {/* Rationale */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-display">
                  Rationale <span className="text-red-500">*</span>
                  <span className="ml-2 text-slate-400 font-normal font-body">(min. 10 characters)</span>
                </label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  rows={3}
                  placeholder="State your findings and reasoning for this vote..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-peerity-600 transition font-body"
                />
                <p className={`text-[10px] mt-1 ${rationale.trim().length < 10 ? "text-red-500" : "text-emerald-600"}`}>
                  {rationale.trim().length} / 10 minimum characters
                </p>
              </div>

              <button
                onClick={handleVote}
                disabled={submitting || rationale.trim().length < 10}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm font-display ${
                  decision === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Vote className="w-4 h-4" />
                )}
                {submitting ? "Recording Vote..." : `Submit Quorum Vote (${decision})`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const AppealsPage: React.FC = () => {
  const { user } = useAuth();
  const [myAppeals, setMyAppeals] = useState<Appeal[]>([]);
  const [pendingAppeals, setPendingAppeals] = useState<Appeal[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "committee">("my");
  const [selectedDisclosed, setSelectedDisclosed] = useState<{ reviewId: string; data: DisclosedIdentity } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const isStaff = user?.role === "COMMITTEE" || user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.role === "STUDENT") {
        const res = await appealApi.getMyAppeals();
        setMyAppeals(res.data);
      }
      if (isStaff) {
        const [pendingRes] = await Promise.all([
          appealApi.getPending().catch(() => ({ data: [] as Appeal[] })),
        ]);
        setPendingAppeals(pendingRes.data);
        // Staff can also see their own filed appeals (if any)
        try {
          const myRes = await appealApi.getMyAppeals();
          setMyAppeals(myRes.data);
        } catch { /* staff may not have filed appeals */ }
      }
    } catch {
      setMyAppeals([]);
      setPendingAppeals([]);
    } finally {
      setLoading(false);
    }
  }, [user, isStaff]);

  useEffect(() => {
    loadData();
    if (isStaff) setActiveTab("committee");
  }, [user]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInspectIdentity = async (reviewId: string) => {
    try {
      const res = await appealApi.getDisclosedIdentity(reviewId);
      setSelectedDisclosed({ reviewId, data: res.data });
    } catch (err: any) {
      showToast(err.response?.data?.message || "Could not fetch disclosed identity.", "error");
    }
  };

  const getStatusBadge = (status: AppealStatus) => {
    switch (status) {
      case "SUBMITTED": return "bg-amber-100 text-amber-800 border-amber-300";
      case "UNDER_INVESTIGATION": return "bg-blue-100 text-blue-800 border-blue-300";
      case "RESOLVED_UPHELD": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "RESOLVED_DISMISSED": return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getQuorumBadge = (appeal: Appeal) => {
    if (appeal.disclosureStatus === "APPROVED") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Quorum Approved
        </span>
      );
    }
    if (appeal.disclosureStatus === "REJECTED") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
          Quorum Rejected
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Committee Review ({appeal.approveCount ?? 0}/{appeal.thresholdRequired ?? 2} Approvals)
      </span>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <ContentHeader
        breadcrumbs={["Adjudication", activeTab === "committee" && isStaff ? "Quorum Votes" : "Disputes"]}
        title={activeTab === "committee" && isStaff ? "Quorum Adjudication" : "Dispute Adjudication"}
        subtitle="N-of-M quorum voting engine — 2 of 3 committee approvals required to unlock disclosure."
        icon={Scale}
        statusPill={
          <StatusPill
            label={isStaff && pendingAppeals.length > 0 ? `${pendingAppeals.length} CASES PENDING` : `${myAppeals.length} CASES FILED`}
            variant={isStaff && pendingAppeals.length > 0 ? "warning" : "brand"}
          />
        }
        actions={
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {/* Tabs (staff gets committee tab) */}
      {isStaff && (
        <div className="flex gap-2 border-b border-slate-200 mb-6 font-display">
          <button
            onClick={() => setActiveTab("committee")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "committee" ? "border-peerity-800 text-peerity-800" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Quorum Adjudication ({pendingAppeals.length})
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "my" ? "border-peerity-800 text-peerity-800" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Scale className="w-4 h-4" />
            My Filed Disputes ({myAppeals.length})
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="h-6 w-24 bg-slate-200 rounded-lg" />
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : activeTab === "committee" && isStaff ? (

        /* ── Committee Quorum Adjudication View ── */
        <div>
          {pendingAppeals.length === 0 ? (
            <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
              <p className="font-semibold text-slate-700 font-display">No Pending Disputes</p>
              <p className="text-sm mt-1 font-body">All filed peer review appeals have been resolved or dismissed.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingAppeals.map((appeal) => (
                <div key={appeal.id} className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-6 space-y-5">
                  {/* Appeal Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border font-display ${getStatusBadge(appeal.status)}`}>
                          {appeal.status.replace(/_/g, " ")}
                        </span>
                        {getQuorumBadge(appeal)}
                        <span className="text-xs text-slate-400 font-body">Filed {new Date(appeal.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1 font-display">{appeal.assignmentTitle || "Assignment Dispute"}</h3>
                      <p className="text-xs text-slate-500 font-body">
                        Reviewer Pseudonym: <span className="font-semibold text-slate-700">{appeal.reviewerPseudonym}</span>
                      </p>
                    </div>
                    <span className="text-xs font-bold text-peerity-800 bg-peerity-100 border border-peerity-200 px-3 py-1 rounded-lg inline-block flex-shrink-0 font-display">
                      Policy Tier: {appeal.recommendedLevel || "LEVEL_2"}
                    </span>
                  </div>

                  {/* Progressive Disclosure Stepper */}
                  <ProgressiveDisclosureStepper
                    currentLevel={appeal.requestedLevel || appeal.recommendedLevel}
                    isApproved={appeal.disclosureStatus === "APPROVED"}
                  />

                  {/* Dispute Statement */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1 font-display">
                      Appellant Grounds ({appeal.reason.replace(/_/g, " ")})
                    </p>
                    <p className="text-sm text-slate-800 leading-relaxed italic font-body">"{appeal.statement}"</p>
                  </div>

                  {/* Disputed Review Feedback */}
                  {appeal.reviewFeedback && (
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 text-xs text-slate-700 font-body">
                      <span className="font-semibold text-amber-900 font-display">Disputed Feedback:</span> "{appeal.reviewFeedback}"
                    </div>
                  )}

                  {/* Quorum Voting Card */}
                  <QuorumVotingCard
                    appeal={appeal}
                    onVoteSuccess={() => {
                      showToast("Vote recorded. Checking quorum threshold...", "success");
                      loadData();
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      ) : (

        /* ── Student View: My Filed Disputes ── */
        <div>
          {myAppeals.length === 0 ? (
            <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-700 font-display">No Active Disputes</p>
              <p className="text-sm mt-1 font-body">
                If you receive an unfair or abusive review, you can file a dispute directly from your <strong>Feedback</strong> page.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {myAppeals.map((appeal) => {
                const isDisclosedOpen = selectedDisclosed?.reviewId === appeal.reviewId;
                const disclosed = selectedDisclosed?.data;
                return (
                  <div key={appeal.id} className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border font-display ${getStatusBadge(appeal.status)}`}>
                            {appeal.status.replace(/_/g, " ")}
                          </span>
                          {getQuorumBadge(appeal)}
                          <span className="text-xs text-slate-400 font-body">Filed {new Date(appeal.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1 font-display">{appeal.assignmentTitle || "Assignment Dispute"}</h3>
                        <p className="text-xs text-slate-500 font-body">
                          Reviewer: <span className="font-semibold text-slate-700">{appeal.reviewerPseudonym}</span> &bull; Reason:{" "}
                          <span className="font-semibold text-slate-700">{appeal.reason.replace(/_/g, " ")}</span>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg inline-block flex-shrink-0 font-display">
                        Target Tier: {appeal.requestedLevel || appeal.recommendedLevel}
                      </span>
                    </div>

                    {/* Progressive Stepper */}
                    <ProgressiveDisclosureStepper
                      currentLevel={appeal.requestedLevel || appeal.recommendedLevel}
                      isApproved={appeal.disclosureStatus === "APPROVED"}
                    />

                    {/* Quorum Status Banner (student-visible) */}
                    {appeal.disclosureStatus === "PENDING_APPROVAL" && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-body">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <span className="font-bold font-display">Committee Review In Progress</span>
                          <span className="ml-2">({appeal.approveCount ?? 0} / {appeal.thresholdRequired ?? 2} Approvals received)</span>
                          <span className="block text-amber-600 mt-0.5 font-body">
                            Identity will remain double-blind until {appeal.thresholdRequired ?? 2} committee members vote to approve.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Resolution Notes */}
                    {appeal.resolution && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-body">
                        <span className="font-bold font-display">Committee Findings:</span> {appeal.resolution}
                      </div>
                    )}

                    {/* Appellant Statement */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1 font-display">Your Dispute Statement</p>
                      <p className="text-sm text-slate-800 leading-relaxed italic font-body">"{appeal.statement}"</p>
                    </div>

                    {/* Identity Inspection Controls */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                      <div className="text-xs text-slate-500 font-body">
                        {appeal.disclosureStatus === "APPROVED" ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1 font-display">
                            <CheckCircle className="w-3.5 h-3.5" /> Disclosure approved by committee quorum
                          </span>
                        ) : appeal.status === "RESOLVED_DISMISSED" ? (
                          <span className="text-slate-500 font-body">Dispute dismissed. Identity kept confidential.</span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1 font-body">
                            <Clock className="w-3.5 h-3.5" /> Awaiting committee votes
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleInspectIdentity(appeal.reviewId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition shadow-sm font-display"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        {isDisclosedOpen ? "Refresh Metadata" : "View Disclosed Identity"}
                      </button>
                    </div>

                    {/* Disclosed Identity Card */}
                    {isDisclosedOpen && disclosed && (
                      <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2 mt-3 font-body">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5 font-display">
                            <Eye className="w-4 h-4 text-purple-600" />
                            Disclosed Identity (Tier: {disclosed.level})
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-display ${
                            disclosed.isApproved ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                          }`}>
                            {disclosed.isApproved ? "Committee Authorized" : "Strictly Anonymous (Level 0)"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded-lg p-2 border border-purple-100">
                            <p className="text-slate-400 text-[10px] uppercase font-bold font-display">Pseudonym</p>
                            <p className="font-semibold text-slate-900">{disclosed.pseudonym}</p>
                          </div>
                          {disclosed.institution && (
                            <div className="bg-white rounded-lg p-2 border border-purple-100">
                              <p className="text-slate-400 text-[10px] uppercase font-bold font-display">Institution</p>
                              <p className="font-semibold text-slate-900">{disclosed.institution}</p>
                            </div>
                          )}
                          {disclosed.department && (
                            <div className="bg-white rounded-lg p-2 border border-purple-100">
                              <p className="text-slate-400 text-[10px] uppercase font-bold font-display">Department</p>
                              <p className="font-semibold text-slate-900">{disclosed.department}</p>
                            </div>
                          )}
                          {disclosed.eligibilityStatus && (
                            <div className="bg-white rounded-lg p-2 border border-purple-100">
                              <p className="text-slate-400 text-[10px] uppercase font-bold font-display">Eligibility</p>
                              <p className="font-semibold text-slate-900">{disclosed.eligibilityStatus}</p>
                            </div>
                          )}
                          {disclosed.academicStanding && (
                            <div className="bg-white rounded-lg p-2 border border-purple-100">
                              <p className="text-slate-400 text-[10px] uppercase font-bold font-display">Academic Standing</p>
                              <p className="font-semibold text-slate-900">{disclosed.academicStanding}</p>
                            </div>
                          )}
                          {disclosed.fullName && (
                            <div className="bg-white rounded-lg p-2 border border-red-200">
                              <p className="text-red-400 text-[10px] uppercase font-bold font-display">Full Legal Name</p>
                              <p className="font-semibold text-slate-900">{disclosed.fullName}</p>
                            </div>
                          )}
                          {disclosed.email && (
                            <div className="bg-white rounded-lg p-2 border border-red-200">
                              <p className="text-red-400 text-[10px] uppercase font-bold font-display">University Email</p>
                              <p className="font-semibold text-slate-900">{disclosed.email}</p>
                            </div>
                          )}
                        </div>
                        {!disclosed.isApproved && (
                          <p className="text-xs text-center text-slate-400 pt-1 italic font-body">
                            All identity attributes are masked pending committee quorum approval.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
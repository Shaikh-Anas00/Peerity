import React, { useEffect, useState, useCallback } from "react";
import {
  appealApi,
  Appeal,
  QuorumStatusDto,
  VoteDecision,
} from "../../api/appealApi";
import {
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Vote,
  Users,
} from "lucide-react";

export interface QuorumVotingCardProps {
  appeal: Appeal;
  onVoteSuccess: () => void;
}

export const QuorumVotingCard: React.FC<QuorumVotingCardProps> = ({ appeal, onVoteSuccess }) => {
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
    <div className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-5 space-y-4 shadow-sm font-body">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
          <Vote className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">Committee Quorum Vote</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Requires {thresholdRequired} approvals from {3} committee members</p>
        </div>
        {isQuorumReached && (
          <span className={`ml-auto text-[11px] font-bold px-3 py-1 rounded-full border font-display ${
            quorum?.disclosureStatus === "APPROVED" || appeal.disclosureStatus === "APPROVED"
              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
              : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
          }`}>
            {quorum?.disclosureStatus === "APPROVED" || appeal.disclosureStatus === "APPROVED"
              ? "✓ Quorum Approved" : "✗ Quorum Rejected"}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {approveCount} / {thresholdRequired} Approvals Needed to Disclose
          </span>
          <div className="flex gap-2 text-xs">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 rounded-full">
              ✓ {approveCount} Approve
            </span>
            <span className="text-red-700 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-full">
              ✗ {rejectCount} Reject
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
          <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Vote History ({totalVotes} cast)
          </p>
          {quorum.votes.map((vote) => (
            <div key={vote.id} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
              vote.decision === "APPROVE"
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50"
            }`}>
              <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                vote.decision === "APPROVE" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              }`}>
                {vote.decision === "APPROVE" ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{vote.committeeMemberName}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                    {new Date(vote.votedAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 italic">"{vote.rationale}"</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">Loading vote history...</p>
      )}

      {/* Voting Form */}
      {!isQuorumReached && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
          {/* B3 fix: recusal notice — rendered before the vote form check */}
          {quorum?.recused ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Recused — Cannot Vote</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  {quorum.recusalReason || "You have a conflict of interest in this dispute and are excluded from the vote to preserve procedural fairness."}
                </p>
              </div>
            </div>
          ) : hasVoted ? (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium border ${
              myDecision === "APPROVE"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400"
            }`}>
              {myDecision === "APPROVE"
                ? <ThumbsUp className="w-4 h-4" />
                : <ThumbsDown className="w-4 h-4" />}
              You have already voted: <strong>{myDecision}</strong>. Awaiting other committee members.
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">Cast Your Vote</p>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              {voteSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-xs rounded-lg">
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
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-700"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" /> Approve Disclosure
                </button>
                <button
                  onClick={() => setDecision("REJECT")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition flex items-center justify-center gap-2 ${
                    decision === "REJECT"
                      ? "border-red-500 bg-red-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-red-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-700"
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" /> Reject Disclosure
                </button>
              </div>

              {/* Rationale */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 font-display">
                  Rationale <span className="text-red-500 dark:text-red-400">*</span>
                  <span className="ml-2 text-slate-400 dark:text-slate-500 font-normal font-body">(min. 10 characters)</span>
                </label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  rows={3}
                  placeholder="State your findings and reasoning for this vote..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-peerity-600 transition font-body"
                />
                <p className={`text-[10px] mt-1 ${rationale.trim().length < 10 ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
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

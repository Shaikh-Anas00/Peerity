import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reviewApi, Review } from "../../api/reviewApi";
import { submissionApi, Submission } from "../../api/submissionApi";
import { appealApi, Appeal, AppealStatus } from "../../api/appealApi";
import {
  MessageSquare,
  CheckCircle,
  AlertCircle,
  FileText,
  Star,
  Scale,
  ExternalLink
} from "lucide-react";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { Badge, BadgeTone } from "../../components/ui";
import { AppealModal } from "./AppealModal";
import { RateReviewModal } from "./RateReviewModal";

const STATUS_TONE: Record<string, BadgeTone> = {
  SUBMITTED: "warning",
  UNDER_INVESTIGATION: "info",
  RESOLVED_UPHELD: "success",
  RESOLVED_DISMISSED: "neutral",
};

export const FeedbackPage: React.FC = () => {
  const [feedback, setFeedback] = useState<Review[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [disputeTarget, setDisputeTarget] = useState<Review | null>(null);
  const [rateTarget, setRateTarget] = useState<Review | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fbRes, subRes, appealRes] = await Promise.all([
        reviewApi.getMyFeedback(),
        submissionApi.getMy(),
        appealApi.getMyAppeals().catch(() => ({ data: [] as Appeal[] }))
      ]);
      setFeedback(fbRes.data);
      setSubmissions(subRes.data);
      setAppeals(appealRes.data);
    } catch {
      setFeedback([]);
      setSubmissions([]);
      setAppeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const subMap = Object.fromEntries(submissions.map(s => [s.id, s]));
  const appealMap = Object.fromEntries(appeals.map(a => [a.reviewId, a]));

  const grouped = feedback.reduce((acc: Record<string, Review[]>, r) => {
    const key = r.submissionId || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const scoreColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800";
    if (pct >= 60) return "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800";
    if (pct >= 40) return "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/40 dark:border-orange-800";
    return "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/40 dark:border-red-800";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen font-body space-y-6">
      {/* Toast */}
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
        breadcrumbs={["Peer Review", "Feedback Received"]}
        title="Feedback Received"
        subtitle={`${feedback.length} review${feedback.length !== 1 ? "s" : ""} on ${Object.keys(grouped).length} submission${Object.keys(grouped).length !== 1 ? "s" : ""}`}
        icon={MessageSquare}
        statusPill={<StatusPill label="ANONYMIZED FEEDBACK" variant="brand" />}
        actions={
          appeals.length > 0 ? (
            <Link
              to="/appeals"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg text-xs font-semibold border border-orange-200 transition font-display shadow-xs dark:bg-orange-950/40 dark:hover:bg-orange-950/60 dark:text-orange-400 dark:border-orange-800"
            >
              <Scale className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              My Disputes ({appeals.length})
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </Link>
          ) : undefined
        }
      />

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-pulse">
              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
                  </div>
                  <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[1, 2, 4, 4].map((_, i) => (
                    <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 space-y-1.5">
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : feedback.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MessageSquare className="w-14 h-14 text-slate-400 dark:text-slate-600 opacity-30 mb-4" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1 font-display">No feedback received yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed font-body">
            Feedback from peer reviewers will appear here after your submissions are reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([subId, reviews]) => {
            const sub = subMap[subId];
            return (
              <div key={subId} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Submission Header */}
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm font-display">{sub?.assignmentTitle || "Assignment"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-body">{sub?.originalFileName || subId}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-body">
                      {reviews.length} peer review{reviews.length !== 1 ? "s" : ""} received
                    </p>
                  </div>
                </div>

                {/* Reviews */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reviews.map((r, idx) => {
                    let parsedScores: Record<string, number> = {};
                    try { if (r.scores) parsedScores = JSON.parse(r.scores); } catch {}
                    const entries = Object.entries(parsedScores);
                    const avg = entries.length > 0
                      ? entries.reduce((a, [, v]) => a + v, 0) / entries.length
                      : null;
                    const pct = avg !== null ? Math.round((avg / 10) * 100) : null;
                    const existingAppeal = appealMap[r.id];

                    return (
                      <div key={r.id} className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-peerity-100 dark:bg-teal-950/40 flex items-center justify-center">
                              <Star className="w-3.5 h-3.5 text-peerity-800 dark:text-teal-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-display">{r.reviewerPseudonym}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 font-body">
                                Reviewer #{idx + 1} &bull; {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "Pending"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {r.authorRating != null ? (
                              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-peerity-100 text-peerity-900 border border-peerity-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-medium font-body">
                                <span className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => {
                                    const ratingVal = r.authorRating ?? 0;
                                    return (
                                      <Star
                                        key={s}
                                        className={`w-3 h-3 ${s <= ratingVal ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                                        fill={s <= ratingVal ? "currentColor" : "none"}
                                      />
                                    );
                                  })}
                                </span>
                                {r.authorRatingHelpful ? "Helpful" : "Unhelpful"}
                              </span>
                            ) : !existingAppeal ? (
                              <button
                                onClick={() => setRateTarget(r)}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-peerity-100 hover:bg-peerity-200 text-peerity-800 border border-peerity-200 rounded-lg font-semibold transition font-display shadow-sm dark:bg-teal-950/40 dark:hover:bg-teal-900/50 dark:text-teal-400 dark:border-teal-800"
                              >
                                Rate Feedback
                              </button>
                            ) : null}

                            {existingAppeal ? (
                              <Link to="/appeals">
                                <Badge tone={STATUS_TONE[existingAppeal.status] ?? "neutral"} icon={<Scale className="w-3 h-3" />}>
                                  Dispute: {existingAppeal.status.replace("_", " ")}
                                </Badge>
                              </Link>
                            ) : (
                              <button
                                onClick={() => setDisputeTarget(r)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition font-display shadow-sm dark:text-orange-400 dark:bg-orange-950/40 dark:hover:bg-orange-950/60 dark:border-orange-800"
                              >
                                <Scale className="w-3 h-3" />
                                Dispute Review
                              </button>
                            )}

                            {pct !== null && (
                              <div className={`px-3 py-1.5 rounded-xl border text-sm font-bold font-display ${scoreColor(pct)}`}>
                                {pct}%
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Per-criterion scores */}
                        {entries.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                            {entries.map(([criterion, score]) => {
                              const sPct = Math.round((score / 10) * 100);
                              const critDef = r.rubric?.find(c => c.name === criterion);
                              const matchedLevel = critDef?.levels?.find(l => l.score === score);

                              return (
                                <div key={criterion} className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="min-w-0 pr-1">
                                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate block">{criterion}</span>
                                      {matchedLevel && (
                                        <span className="text-[10px] font-bold text-peerity-800 dark:text-teal-400 font-display">
                                          {matchedLevel.label}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 ml-1 flex-shrink-0">{score}/10</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-peerity-600 dark:bg-teal-500"
                                      style={{ width: `${sPct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Written feedback */}
                        {r.feedbackText ? (
                          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Written Feedback</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{r.feedbackText}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No written feedback provided.</p>
                        )}

                        {/* Privacy badge */}
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                            <span>Identity protected by policy-driven double-blind pseudonymity</span>
                          </div>
                          {existingAppeal && (
                            <Link to="/appeals" className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold flex items-center gap-1">
                              View Progressive Disclosure <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rateTarget && (
        <RateReviewModal
          review={rateTarget}
          onClose={() => setRateTarget(null)}
          onSuccess={() => {
            loadData();
            showToast("Review rating saved!", "success");
          }}
        />
      )}

      {disputeTarget && (
        <AppealModal
          review={disputeTarget}
          onClose={() => setDisputeTarget(null)}
          onSuccess={() => {
            loadData();
            showToast("Dispute appeal filed successfully! Track progress under Disputes.", "success");
          }}
        />
      )}
    </div>
  );
};

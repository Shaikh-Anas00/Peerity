import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reviewApi, Review } from "../api/reviewApi";
import { submissionApi, Submission } from "../api/submissionApi";
import { appealApi, Appeal, AppealReason } from "../api/appealApi";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import {
  MessageSquare,
  CheckCircle,
  AlertCircle,
  FileText,
  Star,
  Scale,
  ShieldAlert,
  Send,
  X,
  ExternalLink
} from "lucide-react";
import { ContentHeader, StatusPill } from "../components/ContentHeader";

interface AppealModalProps {
  review: Review;
  onClose: () => void;
  onSuccess: () => void;
}

const POLICY_INFO: Record<AppealReason, { level: string; name: string; details: string; badgeColor: string }> = {
  HARASSMENT_OR_ABUSE: {
    level: "Tier 4",
    name: "Full Legal Identity",
    details: "Unmasks full legal name and university email address if approved by the Integrity Committee.",
    badgeColor: "bg-red-100 text-red-800 border-red-200"
  },
  FACTUAL_FABRICATION: {
    level: "Tier 3",
    name: "Academic Standing",
    details: "Unmasks year of study and historical review counts to assess reviewer credibility.",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200"
  },
  UNFAIR_GRADING_OUTLIER: {
    level: "Tier 2",
    name: "Institution & Department",
    details: "Unmasks institution name and department affiliation to detect inter-departmental grading bias.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200"
  },
  PROCEDURAL_ERROR: {
    level: "Tier 1",
    name: "Eligibility & Enrollment",
    details: "Verifies student enrollment status and course eligibility without revealing identifying data.",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
  }
};

const AppealModal: React.FC<AppealModalProps> = ({ review, onClose, onSuccess }) => {
  const [reason, setReason] = useState<AppealReason>("UNFAIR_GRADING_OUTLIER");
  const [statement, setStatement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policy = POLICY_INFO[reason];
  const charCount = statement.trim().length;
  const isValid = charCount >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError("Statement must be at least 20 characters detailing the dispute.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await appealApi.create({
        reviewId: review.id,
        reason,
        statement: statement.trim()
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to file dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 font-body">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-display">Dispute Peer Review</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4 font-body">
          Reviewer: <span className="font-semibold text-slate-700">{review.reviewerPseudonym}</span> &bull; Assignment: <span className="font-semibold text-slate-700">{review.assignmentTitle}</span>
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex gap-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 font-display">
              Dispute Category (Reason)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as AppealReason)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 bg-white font-body"
            >
              <option value="UNFAIR_GRADING_OUTLIER">Unfair Grading Outlier or Bias (Medium Severity)</option>
              <option value="FACTUAL_FABRICATION">Factual Fabrication or False Claims (High Severity)</option>
              <option value="HARASSMENT_OR_ABUSE">Harassment, Hate Speech, or Abuse (Severe)</option>
              <option value="PROCEDURAL_ERROR">Procedural or Rubric Error (Low Severity)</option>
            </select>
          </div>

          {/* Dynamic Policy Engine Preview Badge */}
          <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-display">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                Policy Engine Projected Disclosure Tier
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${policy.badgeColor}`}>
                {policy.level}: {policy.name}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-body">{policy.details}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 font-display">
                Appellant Statement
              </label>
              <span className={`text-[11px] font-medium ${charCount < 20 ? "text-orange-600" : "text-emerald-600"}`}>
                {charCount} / 20 min characters
              </span>
            </div>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={4}
              placeholder="Explain specifically why this review violates fair evaluation standards (minimum 20 characters)..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 resize-none font-body"
            />
          </div>

          <div className="flex gap-2 pt-1 font-display">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isValid}
              className="flex-1 py-2.5 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition shadow-sm"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  File Dispute
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


interface RateReviewModalProps {
  review: Review;
  onClose: () => void;
  onSuccess: () => void;
}

const RateReviewModal: React.FC<RateReviewModalProps> = ({ review, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [isHelpful, setIsHelpful] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await reviewApi.rateReview(review.id, {
        rating,
        isHelpful,
        comment: comment.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 font-body">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 font-display">Rate Review Quality</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4 font-body">
          Provide constructive feedback on <span className="font-semibold text-slate-700">{review.reviewerPseudonym}</span>'s evaluation (Kritik Model).
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex gap-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 font-display">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => { setRating(s); setIsHelpful(s >= 3); }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition border ${
                    rating >= s
                      ? "bg-amber-50 border-amber-300 text-amber-400"
                      : "bg-slate-50 border-slate-200 text-slate-300"
                  }`}
                >
                  <Star
                    className="w-5 h-5"
                    fill={rating >= s ? "currentColor" : "none"}
                  />
                </button>
              ))}
              <span className="text-xs text-slate-500 font-semibold ml-2 font-display">{rating} of 5 Stars</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 font-display">Was this critique helpful?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsHelpful(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition font-body ${
                  isHelpful ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Constructive &amp; Helpful
              </button>
              <button
                type="button"
                onClick={() => setIsHelpful(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition font-body ${
                  !isHelpful ? "bg-red-50 border-red-300 text-red-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Unhelpful / Vague
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-display">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="What specifically made this evaluation helpful or unhelpful?"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 resize-none font-body"
            />
          </div>

          <div className="flex gap-2 pt-2 font-display">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition shadow-sm"
            >
              {submitting ? "Saving..." : "Submit Rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
    if (pct >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (pct >= 60) return "text-blue-700 bg-blue-50 border-blue-200";
    if (pct >= 40) return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "UNDER_INVESTIGATION":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "RESOLVED_UPHELD":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg text-xs font-semibold border border-orange-200 transition font-display shadow-xs"
            >
              <Scale className="w-3.5 h-3.5 text-orange-600" />
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
            <div key={n} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-200 rounded w-1/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/5" />
                  </div>
                  <div className="h-8 w-16 bg-slate-200 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[1, 2, 4, 4].map((_, i) => (
                    <div key={i} className="bg-slate-100 rounded-lg p-2.5 space-y-1.5">
                      <div className="h-2.5 bg-slate-200 rounded w-2/3" />
                      <div className="h-1.5 bg-slate-200 rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="bg-slate-100 rounded-xl p-3 space-y-1.5">
                  <div className="h-2.5 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : feedback.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MessageSquare className="w-14 h-14 text-slate-400 opacity-30 mb-4" />
          <p className="text-lg font-bold text-slate-700 mb-1 font-display">No feedback received yet</p>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-body">
            Feedback from peer reviewers will appear here after your submissions are reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([subId, reviews]) => {
            const sub = subMap[subId];
            return (
              <div key={subId} className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Submission Header */}
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm font-display">{sub?.assignmentTitle || "Assignment"}</p>
                    <p className="text-xs text-slate-500 font-body">{sub?.originalFileName || subId}</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-body">
                      {reviews.length} peer review{reviews.length !== 1 ? "s" : ""} received
                    </p>
                  </div>
                </div>

                {/* Reviews */}
                <div className="divide-y divide-slate-100">
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
                            <div className="w-7 h-7 rounded-full bg-peerity-100 flex items-center justify-center">
                              <Star className="w-3.5 h-3.5 text-peerity-800" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 font-display">{r.reviewerPseudonym}</p>
                              <p className="text-xs text-slate-400 font-body">
                                Reviewer #{idx + 1} &bull; {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "Pending"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {r.authorRating != null ? (
                              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-peerity-100 text-peerity-900 border border-peerity-200 font-medium font-body">
                                <span className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => {
                                    const ratingVal = r.authorRating ?? 0;
                                    return (
                                      <Star
                                        key={s}
                                        className={`w-3 h-3 ${s <= ratingVal ? "text-amber-400" : "text-slate-300"}`}
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
                                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-peerity-100 hover:bg-peerity-200 text-peerity-800 border border-peerity-200 rounded-lg font-semibold transition font-display shadow-sm"
                              >
                                Rate Feedback
                              </button>
                            ) : null}

                            {existingAppeal ? (
                              <Link
                                to="/appeals"
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 font-display ${getStatusBadge(existingAppeal.status)}`}
                              >
                                <Scale className="w-3 h-3" />
                                Dispute: {existingAppeal.status.replace("_", " ")}
                              </Link>
                            ) : (
                              <button
                                onClick={() => setDisputeTarget(r)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition font-display shadow-sm"
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
                                <div key={criterion} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="min-w-0 pr-1">
                                      <span className="text-xs text-slate-700 font-medium truncate block">{criterion}</span>
                                      {matchedLevel && (
                                        <span className="text-[10px] font-bold text-peerity-800 font-display">
                                          {matchedLevel.label}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-800 ml-1 flex-shrink-0">{score}/10</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-peerity-600"
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
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Written Feedback</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{r.feedbackText}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No written feedback provided.</p>
                        )}

                        {/* Privacy badge */}
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>Identity protected by policy-driven double-blind pseudonymity</span>
                          </div>
                          {existingAppeal && (
                            <Link to="/appeals" className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
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
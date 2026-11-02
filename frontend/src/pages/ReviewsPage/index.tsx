/**
 * ReviewsPage — Split-pane review submission experience.
 *
 * Layout when grading:
 *   ┌─────────────────────────────────┬─────────────────────────┐
 *   │  PDF Viewer (fixed-height pane) │  Rubric Sidebar          │
 *   │  • Canvas-rendered via pdf.js   │  • Progress bar          │
 *   │  • Zoom in / out                │  • One criterion / step  │
 *   │  • Page ← / → controls         │  • Prev / Next nav       │
 *   │  • Scrolls independently        │  • Feedback at final step│
 *   └─────────────────────────────────┴─────────────────────────┘
 *
 * IMPORTANT: Zero changes to scoring logic, API calls, or CalibrationModal.
 */

import React, { useEffect, useState, useCallback } from "react";
import { reviewApi, Review } from "../../api/reviewApi";
import { RubricCriterion } from "../../api/assignmentApi";
import { calibrationApi, CalibrationSample, ReviewerReliability } from "../../api/calibrationApi";
import { submissionApi } from "../../api/submissionApi";
import { Award, Target } from "lucide-react";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { SplitPaneRubric } from "./SplitPaneRubric";
import { CalibrationModal } from "./CalibrationModal";
import {
  ClipboardList,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Star,
  Download,
  ShieldCheck,
  Copy,
  Check,
  FileText,
  Clock,
} from "lucide-react";

export const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [calibrationSamples, setCalibrationSamples] = useState<CalibrationSample[]>([]);
  const [reliability, setReliability] = useState<ReviewerReliability | null>(null);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);

  // PDF viewer state — keyed per submission so it resets when switching reviews
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfForSubmissionId, setPdfForSubmissionId] = useState<string | null>(null);

  const isReviewPast = (d?: string) => (d ? new Date(d) < new Date() : false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await reviewApi.getAssignedToMe();
      setReviews(r.data);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCalibration = async () => {
    try {
      const [samplesRes, reliabilityRes] = await Promise.all([
        calibrationApi.getSamples(),
        calibrationApi.getMyReliability(),
      ]);
      setCalibrationSamples(samplesRes.data);
      setReliability(reliabilityRes.data);
    } catch {
      // Calibration data is supplementary — fail silently
    }
  };

  useEffect(() => {
    load();
    loadCalibration();
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load PDF bytes for the currently active review
  const loadPdf = useCallback(async (submissionId: string) => {
    if (pdfForSubmissionId === submissionId) return; // already loaded
    setPdfBytes(null);
    setPdfError(null);
    setPdfLoading(true);
    setPdfForSubmissionId(submissionId);
    try {
      const res = await submissionApi.downloadFile(submissionId);
      const arrayBuffer = await (res.data as Blob).arrayBuffer();
      setPdfBytes(new Uint8Array(arrayBuffer));
    } catch (err: any) {
      setPdfError(err.response?.data?.message || "Could not load submission preview.");
    } finally {
      setPdfLoading(false);
    }
  }, [pdfForSubmissionId]);

  const handleOpenReview = (review: Review) => {
    setActiveReviewId(review.id);
    loadPdf(review.submissionId);
  };

  const handleCloseReview = () => {
    setActiveReviewId(null);
    setPdfBytes(null);
    setPdfError(null);
    setPdfForSubmissionId(null);
  };

  const handleDownload = async (submissionId: string, fileName: string) => {
    setDownloadingId(submissionId);
    try {
      const res = await submissionApi.downloadFile(submissionId);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "submission.bin");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("File decrypted and downloaded successfully!", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to download and decrypt file.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const parseCriteria = (review: Review): (RubricCriterion | string)[] => {
    if (review.rubric && review.rubric.length > 0) {
      return review.rubric;
    }
    return ["Code Quality", "Documentation", "Correctness", "Testing"];
  };

  const handleSubmitReview = async (
    review: Review,
    scores: Record<string, number>,
    feedback: string,
    answers?: Record<string, number[]>
  ) => {
    await reviewApi.submit(review.id, {
      scores: JSON.stringify(scores),
      feedbackText: feedback,
      answers: answers && Object.keys(answers).length > 0 ? JSON.stringify(answers) : undefined,
    });
    showToast("Review submitted successfully!", "success");
    handleCloseReview();
    await load();
  };

  const pending = reviews.filter(r => r.status === "PENDING");
  const completed = reviews.filter(r => r.status === "COMPLETED");
  const activeReview = reviews.find(r => r.id === activeReviewId) ?? null;

  // ── Split-pane grading view ──────────────────────────────────────────────────
  if (activeReview) {
    const criteria = parseCriteria(activeReview);
    const isPast = isReviewPast(activeReview.reviewDeadline);

    return (
      <div className="flex flex-col h-full">
        {/* Standardized breadcrumb bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex-shrink-0">
          <ContentHeader
            breadcrumbs={[
              { label: "My Reviews", onClick: handleCloseReview },
              activeReview.assignmentTitle,
            ]}
            compact
            className="mb-0 space-y-0"
            statusPill={
              activeReview.reviewDeadline ? (
                <StatusPill
                  label={isPast ? "EXPIRED" : `DUE: ${new Date(activeReview.reviewDeadline).toLocaleDateString()}`}
                  variant={isPast ? "error" : "brand"}
                  icon={Clock}
                />
              ) : (
                <StatusPill label="IN PROGRESS" variant="brand" />
              )
            }
          />
        </div>

        {/* Split pane fills remaining height */}
        <div className="flex-1 min-h-0">
          <SplitPaneRubric
            review={activeReview}
            criteria={criteria}
            onSubmit={(s, f, a) => handleSubmitReview(activeReview, s, f, a)}
            isPast={isPast}
            pdfBytes={pdfBytes}
            pdfLoading={pdfLoading}
            pdfError={pdfError}
            onDownload={() => handleDownload(activeReview.submissionId, activeReview.submissionFileName)}
            isDownloading={downloadingId === activeReview.submissionId}
            onClose={handleCloseReview}
          />
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
              toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
      </div>
    );
  }

  // ── List view (default) ──────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <ContentHeader
        breadcrumbs={["Peer Review", "My Reviews"]}
        title="My Reviews"
        subtitle={`${pending.length} pending • ${completed.length} completed`}
        icon={ClipboardList}
        statusPill={
          reliability && reliability.isCalibrated ? (
            <StatusPill
              label={`RELIABILITY: ${reliability.reliabilityTier.toUpperCase()}${reliability.reliabilityScore !== null ? ` · ${Math.round(reliability.reliabilityScore)}%` : ""}`}
              variant="purple"
              icon={Award}
            />
          ) : (
            <StatusPill label="CALIBRATION PENDING" variant="warning" icon={Target} />
          )
        }
      />

      {/* Calibration banner */}
      {calibrationSamples.some(s => !s.isCompletedByMe) && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl flex items-start justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-300 font-display">Reviewer Calibration Required</p>
              <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5 font-body">
                Score {calibrationSamples.filter(s => !s.isCompletedByMe).length} benchmark sample
                {calibrationSamples.filter(s => !s.isCompletedByMe).length !== 1 ? "s" : ""} to establish your reliability score before grading peers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCalibrationModal(true)}
            className="flex-shrink-0 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm font-display"
          >
            Open Calibration
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <ClipboardList className="w-12 h-12 text-slate-400 dark:text-slate-600 opacity-30 mb-3" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No reviews assigned yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Your instructor will assign peer reviews after the submission deadline.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 font-display">
                Pending Reviews ({pending.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pending.map(r => {
                  const isPast = isReviewPast(r.reviewDeadline);
                  return (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate font-display">
                                {r.assignmentTitle}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                              Submission:{" "}
                              <span className="font-medium text-slate-700 dark:text-slate-300">{r.submissionFileName}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-body">
                                Assigned: {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                              {r.reviewDeadline && (
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 font-body ${
                                    isPast
                                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50"
                                      : "bg-peerity-100 text-peerity-800 border-peerity-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800"
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  {isPast ? "Review Expired: " : "Review Cutoff: "}
                                  {new Date(r.reviewDeadline).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenReview(r)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-peerity-800 hover:bg-peerity-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition shadow-sm font-display"
                          >
                            <Star className="w-3.5 h-3.5" />
                            {isPast ? "View" : "Grade"}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* File integrity bar */}
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-peerity-100 text-peerity-800 dark:bg-teal-950/40 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-peerity-200 dark:border-teal-800">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-display">
                                  Encrypted Submission
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 rounded font-medium">
                                  SHA-256 Verified
                                </span>
                              </div>
                              {r.fileHash ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate"
                                    title={r.fileHash}
                                  >
                                    {r.fileHash.slice(0, 10)}...{r.fileHash.slice(-8)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(r.fileHash!, r.id)}
                                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-0.5"
                                    title="Copy SHA-256 hash"
                                  >
                                    {copiedHash === r.id ? (
                                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-body">Hash available</span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownload(r.submissionId, r.submissionFileName)}
                            disabled={downloadingId === r.submissionId}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition disabled:opacity-50 flex-shrink-0 shadow-sm font-display"
                          >
                            {downloadingId === r.submissionId ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-slate-700 dark:border-slate-300 border-t-transparent rounded-full animate-spin" />
                                Decrypting...
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                Download Submission File
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 font-display">
                Completed Reviews ({completed.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {completed.map(r => {
                  let parsedScores: Record<string, number> = {};
                  try {
                    if (r.scores) parsedScores = JSON.parse(r.scores);
                  } catch {}
                  const avg =
                    Object.values(parsedScores).length > 0
                      ? Object.values(parsedScores).reduce((a, b) => a + b, 0) /
                        Object.values(parsedScores).length
                      : 0;
                  const isDownloading = downloadingId === r.submissionId;

                  return (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate font-display">
                              {r.assignmentTitle}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-body">
                            Submission: {r.submissionFileName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-body">
                            Submitted:{" "}
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                            {Math.round((avg / 10) * 100)}%
                          </span>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-body">avg score</p>
                        </div>
                      </div>

                      {/* File download */}
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                            {r.submissionFileName}
                          </span>
                          {r.fileHash && (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                              ({r.fileHash.slice(0, 8)}...)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownload(r.submissionId, r.submissionFileName)}
                          disabled={isDownloading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {isDownloading ? "Decrypting..." : "Download"}
                        </button>
                      </div>

                      {Object.keys(parsedScores).length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {Object.entries(parsedScores).map(([k, v]) => (
                            <div key={k} className="flex justify-between bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 text-xs border border-slate-100 dark:border-slate-800">
                              <span className="text-slate-600 dark:text-slate-400">{k}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{v}/10</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {r.feedbackText && (
                        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-lg p-3 border border-emerald-100 dark:border-emerald-900/50 italic">
                          "{r.feedbackText}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calibration modal */}
      {showCalibrationModal && calibrationSamples.length > 0 && (
        <CalibrationModal
          samples={calibrationSamples}
          onClose={() => setShowCalibrationModal(false)}
          onCompleted={() => {
            loadCalibration();
            showToast("Calibration score recorded!", "success");
          }}
        />
      )}
    </div>
  );
};

/**
 * ReviewsPage.tsx — Split-pane review submission experience.
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
 * This file is a layout / UX redesign only.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import { reviewApi, Review } from "../api/reviewApi";
import { RubricCriterion } from "../api/assignmentApi";
import { calibrationApi, CalibrationSample, CalibrationResult, ReviewerReliability } from "../api/calibrationApi";
import { submissionApi } from "../api/submissionApi";
import { Award, Target, X } from "lucide-react";
import { ContentHeader, StatusPill } from "../components/ContentHeader";
import { SteppedCriterionScoring } from "../components/SteppedCriterionScoring";
import {
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  Star,
  Download,
  ShieldCheck,
  Copy,
  Check,
  FileText,
  Clock,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

// ─── pdf.js worker ────────────────────────────────────────────────────────────
// Point to the worker we copied into /public
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

import { DocViewer } from "../components/DocViewer";

// =============================================================================
// SPLIT-PANE RUBRIC FORM
// =============================================================================

interface SplitPaneRubricProps {
  review: Review;
  criteria: (RubricCriterion | string)[];
  onSubmit: (scores: Record<string, number>, feedback: string, answers?: Record<string, number[]>) => Promise<void>;
  isPast?: boolean;
  // Document viewer props
  pdfBytes: Uint8Array | null;
  pdfLoading: boolean;
  pdfError: string | null;
  onDownload: () => void;
  isDownloading: boolean;
  onClose: () => void;
}

const SplitPaneRubric: React.FC<SplitPaneRubricProps> = ({
  review,
  criteria,
  onSubmit,
  isPast,
  pdfBytes,
  pdfLoading,
  pdfError,
  onDownload,
  isDownloading,
  onClose,
}) => {
  const [isDocMaximized, setIsDocMaximized] = useState(false);

  const initialAnswers = review.answers ? (() => {
    try {
      return JSON.parse(review.answers);
    } catch {
      return undefined;
    }
  })() : undefined;

  return (
    <div className="flex h-full relative">
      {/* ── LEFT PANE: Enhanced Document Viewer ────────────────── */}
      <div className="flex-1 min-w-0 h-full">
        <DocViewer
          pdfBytes={pdfBytes}
          loading={pdfLoading}
          error={pdfError}
          fileName={review.submissionFileName}
          onDownload={onDownload}
          isDownloading={isDownloading}
          isMaximized={isDocMaximized}
          onToggleMaximize={() => setIsDocMaximized((prev) => !prev)}
        />
      </div>

      {/* ── RIGHT PANE: Step-by-step Rubric Sidebar ───────────── */}
      {isDocMaximized ? (
        <button
          type="button"
          onClick={() => setIsDocMaximized(false)}
          className="w-10 bg-white border-l border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-peerity-800 hover:bg-slate-50 transition"
          title="Restore Rubric Panel"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider [writing-mode:vertical-lr] rotate-180 font-display">
            Open Rubric
          </span>
        </button>
      ) : (
        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col h-full border-l border-slate-200 bg-white">
          <SteppedCriterionScoring
            criteria={criteria}
            initialAnswers={initialAnswers}
            title={
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-peerity-700 font-display">
                  Review Rubric
                </p>
                <h3 className="text-sm font-bold text-slate-900 font-display leading-tight truncate">
                  {review.assignmentTitle}
                </h3>
              </div>
            }
            headerExtra={
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="Close review panel"
              >
                <X className="w-4 h-4" />
              </button>
            }
            isPast={isPast}
            disabledMessage="The evaluation deadline for this review has passed."
            requireFeedback={true}
            feedbackLabel="Written Feedback"
            feedbackPlaceholder="Provide constructive, specific feedback for this submission. Reference the rubric criteria and explain your scoring decisions."
            feedbackMinLength={20}
            submitButtonText="Submit Review"
            onSubmit={async (scores, feedback, answers) => {
              await onSubmit(scores, feedback, answers);
            }}
          />
        </div>
      )}
    </div>
  );
};

// =============================================================================
// CALIBRATION MODAL  (unchanged from original)
// =============================================================================

interface CalibrationModalProps {
  samples: CalibrationSample[];
  onClose: () => void;
  onCompleted: () => void;
}

const CalibrationModal: React.FC<CalibrationModalProps> = ({ samples, onClose, onCompleted }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [rationale, setRationale] = useState("");
  const [, setSubmitting] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentSample = samples[selectedIdx];

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [selectedIdx]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 font-body">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-display">Reviewer Calibration (Peerceptiv Model)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Score this instructor-provided benchmark sample to calibrate your grading accuracy and establish your reliability score.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-emerald-900">Calibration Accuracy: {result.accuracyPercentage}%</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                  MAE: {result.meanAbsoluteError} pts
                </span>
              </div>
              <p className="text-xs text-emerald-700">
                Overall Reliability Tier: <strong>{result.reliabilityTier}</strong> ({result.overallReliabilityScore}% across benchmarks)
              </p>
              {result.levelAgreementPct !== undefined && (
                <p className="text-xs text-emerald-800 font-medium mt-1">
                  Level Agreement: <strong>{result.levelAgreementPct}%</strong> of criteria matched the expert performance level
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <p className="font-bold text-slate-800 uppercase tracking-wider">Score Comparison vs Expert</p>
              <div className="space-y-1.5">
                {Object.keys(result.expertScores).map((crit) => {
                  const sLvl = result.studentLevels?.[crit];
                  const eLvl = result.expertLevels?.[crit];

                  return (
                    <div key={crit} className="flex justify-between items-center py-1.5 border-b border-slate-200/60 last:border-0">
                      <div>
                        <span className="font-semibold text-slate-800">{crit}</span>
                        {(sLvl || eLvl) && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            You: <span className="font-semibold text-blue-600">{sLvl ?? result.studentScores[crit]}</span> &bull; Expert: <span className="font-semibold text-purple-600">{eLvl ?? result.expertScores[crit]}</span>
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-right flex-shrink-0">
                        Your Score: <strong className="text-blue-600">{result.studentScores[crit] ?? "-"}</strong> / 10 &bull; Expert:{" "}
                        <strong className="text-purple-600">{result.expertScores[crit]}</strong> / 10
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs">
              <p className="font-bold text-purple-900 uppercase tracking-wider mb-1">Instructor Expert Feedback</p>
              <p className="text-purple-800 leading-relaxed">{result.expertFeedback}</p>
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition"
            >
              Continue Calibration
            </button>
          </div>
        ) : currentSample ? (
          <SteppedCriterionScoring
            key={currentSample.id}
            criteria={currentSample.rubric && currentSample.rubric.length > 0 ? currentSample.rubric : ["Code Quality", "Documentation", "Correctness"]}
            initialFeedback={rationale}
            accentColor="purple"
            requireFeedback={true}
            feedbackLabel="Evaluation Rationale"
            feedbackPlaceholder="Explain why you selected these performance levels against the rubric..."
            feedbackMinLength={10}
            feedbackRows={3}
            submitButtonText="Submit Benchmark Score"
            onCancel={onClose}
            renderCustomTop={
              <div className="space-y-3 mb-2">
                {samples.length > 1 && (
                  <div className="flex gap-2 mb-2">
                    {samples.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition font-display ${
                          selectedIdx === idx
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        Benchmark #{idx + 1} {s.isCompletedByMe && "✓"}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{currentSample.title}</h3>
                  <p className="text-xs text-slate-600 mb-2">{currentSample.description}</p>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono max-h-36 overflow-auto whitespace-pre">
                    {currentSample.sampleContent}
                  </div>
                </div>
              </div>
            }
            onSubmit={async (submittedScores, submittedRationale) => {
              setSubmitting(true);
              setError(null);
              try {
                const res = await calibrationApi.evaluateSample(currentSample.id, {
                  scores: submittedScores,
                  rationale: submittedRationale.trim() || "Evaluated against benchmark rubric.",
                });
                setResult(res.data);
                onCompleted();
              } catch (err: any) {
                setError(err.response?.data?.message || "Failed to evaluate benchmark.");
                throw err;
              } finally {
                setSubmitting(false);
              }
            }}
          />
        ) : (
          <div className="text-center py-8 text-slate-400">No calibration samples available for this course yet.</div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// REVIEWS PAGE  (top-level, split-pane layout when grading)
// =============================================================================

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
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex-shrink-0">
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
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900 font-display">Reviewer Calibration Required</p>
              <p className="text-xs text-purple-700 mt-0.5 font-body">
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
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
              </div>
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <ClipboardList className="w-12 h-12 text-slate-400 opacity-30 mb-3" />
          <p className="font-semibold text-slate-800">No reviews assigned yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Your instructor will assign peer reviews after the submission deadline.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 font-display">
                Pending Reviews ({pending.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pending.map(r => {
                  const isPast = isReviewPast(r.reviewDeadline);
                  return (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                              <h3 className="font-semibold text-slate-900 truncate font-display">
                                {r.assignmentTitle}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-500 font-body">
                              Submission:{" "}
                              <span className="font-medium text-slate-700">{r.submissionFileName}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400 font-body">
                                Assigned: {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                              {r.reviewDeadline && (
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 font-body ${
                                    isPast
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-peerity-100 text-peerity-800 border-peerity-200"
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
                            className="flex items-center gap-1.5 px-3 py-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-xs font-semibold transition shadow-sm font-display"
                          >
                            <Star className="w-3.5 h-3.5" />
                            {isPast ? "View" : "Grade"}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* File integrity bar */}
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-peerity-100 text-peerity-800 flex items-center justify-center flex-shrink-0 border border-peerity-200">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-800 font-display">
                                  Encrypted Submission
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200/70 text-slate-700 rounded font-medium">
                                  SHA-256 Verified
                                </span>
                              </div>
                              {r.fileHash ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="text-[11px] font-mono text-slate-500 truncate"
                                    title={r.fileHash}
                                  >
                                    {r.fileHash.slice(0, 10)}...{r.fileHash.slice(-8)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(r.fileHash!, r.id)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5"
                                    title="Copy SHA-256 hash"
                                  >
                                    {copiedHash === r.id ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-body">Hash available</span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownload(r.submissionId, r.submissionFileName)}
                            disabled={downloadingId === r.submissionId}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition disabled:opacity-50 flex-shrink-0 shadow-sm font-display"
                          >
                            {downloadingId === r.submissionId ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
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
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 font-display">
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
                      className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <h3 className="font-semibold text-slate-900 truncate font-display">
                              {r.assignmentTitle}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-600 font-body">
                            Submission: {r.submissionFileName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 font-body">
                            Submitted:{" "}
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-2xl font-bold text-slate-900 font-display">
                            {Math.round((avg / 10) * 100)}%
                          </span>
                          <p className="text-xs text-slate-400 font-body">avg score</p>
                        </div>
                      </div>

                      {/* File download */}
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-700 truncate">
                            {r.submissionFileName}
                          </span>
                          {r.fileHash && (
                            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                              ({r.fileHash.slice(0, 8)}...)
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownload(r.submissionId, r.submissionFileName)}
                          disabled={isDownloading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {isDownloading ? "Decrypting..." : "Download"}
                        </button>
                      </div>

                      {Object.keys(parsedScores).length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {Object.entries(parsedScores).map(([k, v]) => (
                            <div key={k} className="flex justify-between bg-white rounded-lg px-3 py-1.5 text-xs border border-slate-100">
                              <span className="text-slate-600">{k}</span>
                              <span className="font-bold text-slate-800">{v}/10</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {r.feedbackText && (
                        <p className="mt-3 text-sm text-slate-700 bg-white rounded-lg p-3 border border-emerald-100 italic">
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
import React, { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import { Review } from "../../api/reviewApi";
import { RubricCriterion } from "../../api/assignmentApi";
import { SteppedCriterionScoring } from "../../components/SteppedCriterionScoring";
import { DocViewer } from "../../components/DocViewer";

export interface SplitPaneRubricProps {
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

export const SplitPaneRubric: React.FC<SplitPaneRubricProps> = ({
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
          className="w-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-peerity-800 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          title="Restore Rubric Panel"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider [writing-mode:vertical-lr] rotate-180 font-display">
            Open Rubric
          </span>
        </button>
      ) : (
        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col h-full border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <SteppedCriterionScoring
            criteria={criteria}
            initialAnswers={initialAnswers}
            title={
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-peerity-700 dark:text-teal-400 font-display">
                  Review Rubric
                </p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display leading-tight truncate">
                  {review.assignmentTitle}
                </h3>
              </div>
            }
            headerExtra={
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition"
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

import React, { useState, useMemo } from "react";
import { Check, ChevronLeft, ChevronRight, Send, AlertCircle } from "lucide-react";
import { RubricCriterion, PerformanceLevel } from "../api/assignmentApi";
import { isQuestionBased, resolveQuestionScore, levelLabelForScore } from "../utils/rubricScoring";
import { QuestionOptionCards } from "./rubric/QuestionOptionCards";

export interface SteppedCriterionScoringProps {
  /**
   * List of rubric criteria to be scored (either rich RubricCriterion objects or legacy string names).
   */
  criteria: (RubricCriterion | string)[];

  /**
   * Optional initial scores keyed by criterion name.
   */
  initialScores?: Record<string, number>;

  /**
   * Optional initial answers keyed by criterion name to array of option values.
   */
  initialAnswers?: Record<string, number[]>;

  /**
   * Optional initial feedback/rationale text.
   */
  initialFeedback?: string;

  /**
   * Whether written feedback/rationale is required before submission. Defaults to true.
   */
  requireFeedback?: boolean;

  /**
   * Label for the final feedback/rationale step.
   */
  feedbackLabel?: string;

  /**
   * Placeholder for the feedback/rationale textarea.
   */
  feedbackPlaceholder?: string;

  /**
   * Minimum required character length for feedback. Defaults to 10.
   */
  feedbackMinLength?: number;

  /**
   * Number of rows for feedback textarea. Defaults to 6.
   */
  feedbackRows?: number;

  /**
   * If true, disables editing and shows disabledMessage.
   */
  isPast?: boolean;

  /**
   * Message shown when isPast is true.
   */
  disabledMessage?: string;

  /**
   * Optional header title displayed above progress bar.
   */
  title?: React.ReactNode;

  /**
   * Optional header subtitle.
   */
  subtitle?: React.ReactNode;

  /**
   * Extra element rendered top-right in header (e.g. close or back button).
   */
  headerExtra?: React.ReactNode;

  /**
   * Custom element rendered above the active step (e.g. calibration sample details).
   */
  renderCustomTop?: React.ReactNode;

  /**
   * Whether to display the sticky overall average percentage bar. Defaults to true.
   */
  showOverallBar?: boolean;

  /**
   * Submit button label on final step. Defaults to "Submit".
   */
  submitButtonText?: string;

  /**
   * External submitting state indicator.
   */
  submitting?: boolean;

  /**
   * Color accent theme: "peerity" (default) or "purple".
   */
  accentColor?: "peerity" | "purple";

  /**
   * Callback fired when user submits the completed evaluation.
   */
  onSubmit: (scores: Record<string, number>, feedback: string, answers?: Record<string, number[]>) => Promise<void> | void;

  /**
   * Optional callback for Cancel / Back navigation.
   */
  onCancel?: () => void;

  /**
   * Additional wrapper class name.
   */
  className?: string;
}

const DEFAULT_LEVELS: PerformanceLevel[] = [
  { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Demonstrates superior mastery and high quality." },
  { label: "Proficient", score: 8, scoreRange: "7-8", description: "Meets standard expectations and core requirements." },
  { label: "Developing", score: 6, scoreRange: "5-6", description: "Demonstrates emerging competence with minor gaps." },
  { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Does not meet expectations; substantial improvement required." },
];

function normalizeCriteria(raw: (RubricCriterion | string)[]): RubricCriterion[] {
  return raw.map(c => {
    if (typeof c === "string") {
      return {
        name: c,
        levels: DEFAULT_LEVELS,
      };
    }
    const levels = c.levels && c.levels.length === 4 ? c.levels : DEFAULT_LEVELS;
    return { ...c, levels };
  });
}

/**
 * Reusable Stepped-Criterion Scoring Component
 *
 * Implements level-card based evaluation across Peerity:
 * - Numbered tabs with checkmarks for completed steps
 * - Real-time progress percentage bar
 * - 4 selectable performance level cards per criterion
 * - Weighted or arithmetic composite score calculation
 * - Step-by-step Previous / Next navigation
 * - Comprehensive score summary and written feedback step
 */
export const SteppedCriterionScoring: React.FC<SteppedCriterionScoringProps> = ({
  criteria,
  initialScores,
  initialAnswers,
  initialFeedback = "",
  requireFeedback = true,
  feedbackLabel = "Written Feedback",
  feedbackPlaceholder = "Provide constructive, specific feedback referencing the rubric criteria.",
  feedbackMinLength = 10,
  feedbackRows = 6,
  isPast = false,
  disabledMessage = "The evaluation deadline for this submission has passed.",
  title,
  subtitle,
  headerExtra,
  renderCustomTop,
  showOverallBar = true,
  submitButtonText = "Submit Evaluation",
  submitting: externalSubmitting,
  accentColor = "peerity",
  onSubmit,
  onCancel,
  className = "",
}) => {
  const normalizedCriteria = useMemo(() => normalizeCriteria(criteria), [criteria]);

  // Scores map: starts empty unless initialScores provided (no artificial default 5)
  const [scores, setScores] = useState<Record<string, number>>(() => {
    return initialScores && Object.keys(initialScores).length > 0 ? { ...initialScores } : {};
  });

  const [answers, setAnswers] = useState<Record<string, number[]>>(() => {
    return initialAnswers && Object.keys(initialAnswers).length > 0 ? { ...initialAnswers } : {};
  });

  const [feedback, setFeedback] = useState(initialFeedback);
  const [step, setStep] = useState(0); // 0 ... criteria.length - 1, criteria.length = feedback step
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = externalSubmitting ?? internalSubmitting;
  const totalSteps = normalizedCriteria.length + 1;
  const isFeedbackStep = step === normalizedCriteria.length;
  const currentCriterion = !isFeedbackStep ? normalizedCriteria[step] : null;

  const goToStep = (newStep: number) => {
    setStep(newStep);
    setError(null);
  };

  // Completion metrics
  const unscoredCriteria = normalizedCriteria.filter(c => scores[c.name] === undefined);
  const allScored = unscoredCriteria.length === 0;
  const scoredCount = normalizedCriteria.length - unscoredCriteria.length;

  const progressPct = Math.round(
    ((scoredCount + (feedback.trim().length >= feedbackMinLength ? 1 : 0)) / totalSteps) * 100
  );

  // Weighted or arithmetic overall composite
  const hasWeights = normalizedCriteria.length > 0 && normalizedCriteria.every(
    c => typeof c.weight === "number" && (c.weight as number) > 0
  );

  let compositePct = 0;
  let compositePoints = 0;

  if (hasWeights) {
    let weightedSum = 0;
    let weightTotal = 0;
    normalizedCriteria.forEach(c => {
      const s = scores[c.name];
      const w = c.weight ?? 0;
      if (s !== undefined) {
        weightedSum += s * w;
        weightTotal += w;
      }
    });
    compositePoints = weightTotal > 0 ? weightedSum / weightTotal : 0;
    compositePct = Math.round((compositePoints / 10) * 100);
  } else {
    const scoredValues = normalizedCriteria
      .map(c => scores[c.name])
      .filter((v): v is number => v !== undefined);
    compositePoints = scoredValues.length > 0
      ? scoredValues.reduce((a, b) => a + b, 0) / scoredValues.length
      : 0;
    compositePct = Math.round((compositePoints / 10) * 100);
  }

  // Accent styles
  const isPurple = accentColor === "purple";
  const accentClasses = {
    bgSolid: isPurple ? "bg-purple-600 hover:bg-purple-700" : "bg-peerity-800 hover:bg-peerity-900",
    bgPillActive: isPurple ? "bg-purple-600 text-white border-purple-600" : "bg-peerity-800 text-white border-peerity-800",
    bgLight: isPurple ? "bg-purple-50/70 border-purple-200" : "bg-peerity-100/40 border-peerity-200",
    badgeNumber: isPurple ? "bg-purple-600 text-white" : "bg-peerity-800 text-white",
    textPrimary: isPurple ? "text-purple-600" : "text-peerity-800",
    progressFill: isPurple ? "bg-purple-600" : "bg-peerity-600",
    focusRing: isPurple ? "focus:ring-purple-500" : "focus:ring-peerity-600",
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      goToStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      goToStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (isPast) {
      setError(disabledMessage);
      return;
    }
    if (!allScored) {
      setError(`Please select a performance level for all ${normalizedCriteria.length} criteria before submitting.`);
      return;
    }
    if (requireFeedback && feedback.trim().length < feedbackMinLength) {
      setError(`Written feedback must be at least ${feedbackMinLength} characters before submitting.`);
      return;
    }
    setError(null);
    setInternalSubmitting(true);
    try {
      await onSubmit(scores, feedback, answers);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to submit evaluation.");
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white font-body ${className}`}>
      {/* ── Top Header / Stepper Bar ────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex-shrink-0 bg-slate-50/60">
        {(title || headerExtra) && (
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 pr-2">
              {title && (
                <div className="text-sm font-bold text-slate-900 font-display leading-tight truncate">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-xs text-slate-500 font-body truncate mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
            {headerExtra && <div className="flex-shrink-0">{headerExtra}</div>}
          </div>
        )}

        {/* Progress label & bar */}
        <div className="mt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-body">
            <span>
              Step {step + 1} of {totalSteps}
              {isFeedbackStep ? ` · ${feedbackLabel}` : ` · ${currentCriterion?.name}`}
            </span>
            <span className={`font-bold font-display ${accentClasses.textPrimary}`}>
              {progressPct}% completed
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${accentClasses.progressFill} rounded-full transition-all duration-300`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Numbered tabs with checkmarks */}
        <div className="flex flex-wrap gap-1.5 mt-3" role="tablist">
          {normalizedCriteria.map((c, i) => {
            const isCurrent = i === step;
            const isCompleted = scores[c.name] !== undefined;

            return (
              <button
                key={c.name}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                onClick={() => goToStep(i)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${
                  isCurrent
                    ? accentClasses.bgPillActive
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
                title={c.name}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                ) : (
                  <span className="w-3 text-center">{i + 1}</span>
                )}
                <span className="max-w-[85px] sm:max-w-[110px] truncate">{c.name}</span>
              </button>
            );
          })}

          {/* Final Feedback tab */}
          <button
            type="button"
            role="tab"
            aria-selected={isFeedbackStep}
            onClick={() => goToStep(normalizedCriteria.length)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${
              isFeedbackStep
                ? accentClasses.bgPillActive
                : feedback.trim().length >= feedbackMinLength
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
            title={feedbackLabel}
          >
            {feedback.trim().length >= feedbackMinLength && !isFeedbackStep ? (
              <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            ) : (
              <Send className="w-2.5 h-2.5 flex-shrink-0" />
            )}
            <span className="truncate">{feedbackLabel}</span>
          </button>
        </div>
      </div>

      {/* ── Optional Overall Score Bar ──────────────────────────────────────── */}
      {showOverallBar && (
        <div className="px-5 py-2 border-b border-slate-100 bg-slate-50/80 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-display">
              {hasWeights ? "Weighted Composite Score" : "Overall Score"}
            </span>
            <span className={`text-sm font-bold font-display ${accentClasses.textPrimary}`}>
              {compositePct}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${accentClasses.progressFill} rounded-full transition-all duration-200`}
              style={{ width: `${compositePct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-body">
            {scoredCount} of {normalizedCriteria.length} scored &bull; Avg {compositePoints.toFixed(1)} / 10
            {hasWeights && " (weighted)"}
          </p>
        </div>
      )}

      {/* ── Active Step Body (Scrollable) ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Custom top element (e.g. calibration benchmark preview) */}
        {renderCustomTop}

        {isPast && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{disabledMessage}</span>
          </div>
        )}

        {/* Criterion Level-Card Scoring */}
        {!isFeedbackStep && currentCriterion && (
          <>
            <div className={`rounded-xl border p-4.5 ${accentClasses.bgLight}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg ${accentClasses.badgeNumber} flex items-center justify-center flex-shrink-0 text-xs font-bold font-display shadow-xs`}
                  >
                    {step + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-display">
                      {currentCriterion.name}
                    </h4>
                    {currentCriterion.description && (
                      <p className="text-xs text-slate-600 mt-0.5 font-body leading-relaxed">
                        {currentCriterion.description}
                      </p>
                    )}
                  </div>
                </div>

                {currentCriterion.weight && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md font-mono flex-shrink-0">
                    Weight: {currentCriterion.weight}%
                  </span>
                )}
              </div>

              {isQuestionBased(currentCriterion) ? (
                <>
                  <p className="text-[11px] text-slate-500 font-medium mb-3 mt-1">
                    Answer each question by selecting the statement that best describes the work:
                  </p>
                  <QuestionOptionCards
                    criterion={currentCriterion}
                    selectedAnswers={answers[currentCriterion.name] || []}
                    disabled={isPast}
                    accentColor={accentColor}
                    onChangeAnswers={(newAnswers) => {
                      const updatedAnswers = {
                        ...answers,
                        [currentCriterion.name]: newAnswers,
                      };
                      setAnswers(updatedAnswers);
                      const totalQ = currentCriterion.questions?.length ?? 0;
                      if (
                        newAnswers.length === totalQ &&
                        newAnswers.every((v) => typeof v === "number" && v >= 1 && v <= 5)
                      ) {
                        const resolved = resolveQuestionScore(newAnswers);
                        setScores((prev) => ({ ...prev, [currentCriterion.name]: resolved }));
                      } else {
                        setScores((prev) => {
                          const copy = { ...prev };
                          delete copy[currentCriterion.name];
                          return copy;
                        });
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <p className="text-[11px] text-slate-500 font-medium mb-3 mt-1">
                    Select the performance level that best describes this submission:
                  </p>

                  {/* 4 Performance Level Cards */}
                  <div
                    className="space-y-2"
                    role="radiogroup"
                    aria-label={`Performance levels for ${currentCriterion.name}`}
                  >
                    {currentCriterion.levels.map(lvl => {
                      const isSelected = scores[currentCriterion.name] === lvl.score;

                      return (
                        <button
                          key={lvl.label}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={isPast}
                          onClick={() => {
                            if (!isPast) {
                              setScores(prev => ({ ...prev, [currentCriterion.name]: lvl.score }));
                            }
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 ${accentClasses.focusRing} disabled:opacity-50 ${
                            isSelected
                              ? isPurple
                                ? "border-purple-600 bg-purple-50/80 shadow-xs ring-1 ring-purple-600"
                                : "border-peerity-800 bg-peerity-100/60 shadow-xs ring-1 ring-peerity-800"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border flex-shrink-0 transition-colors ${
                                  isSelected
                                    ? isPurple
                                      ? "bg-purple-600 border-purple-600 text-white"
                                      : "bg-peerity-800 border-peerity-800 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span
                                className={`text-xs font-bold font-display ${
                                  isSelected ? "text-slate-900" : "text-slate-700"
                                }`}
                              >
                                {lvl.label}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded ${
                                isSelected
                                  ? isPurple
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-peerity-200 text-peerity-900"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {lvl.scoreRange ?? `${lvl.score} pts`}
                            </span>
                          </div>

                          {lvl.description && (
                            <p className="text-[11px] text-slate-600 mt-1.5 pl-7 font-body leading-relaxed">
                              {lvl.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Other Criteria Progress List */}
            {normalizedCriteria.length > 1 && (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-display">
                  Other Criteria
                </p>
                <div className="space-y-1.5">
                  {normalizedCriteria
                    .filter((_, i) => i !== step)
                    .map(c => {
                      const s = scores[c.name];
                      const matchedLevel = c.levels.find(l => l.score === s);
                      const displayLabel = matchedLevel?.label ?? (s !== undefined ? levelLabelForScore(s) : null);
                      return (
                        <div key={c.name} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-slate-600 truncate flex-1 pr-2 font-body">
                            {c.name}
                          </span>
                          <span className="font-body text-[11px]">
                            {displayLabel ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-semibold text-slate-800">{displayLabel}</span>
                                <span className="text-slate-400 font-mono">({s}/10)</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unscored</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Written Feedback / Summary Step */}
        {isFeedbackStep && (
          <div className="space-y-4">
            {/* Unscored criteria alert if any */}
            {!allScored && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="font-bold">Incomplete Rubric Scoring</p>
                  <p className="mt-0.5 text-amber-700">
                    {unscoredCriteria.length} criteria still need a performance level selection:{" "}
                    {unscoredCriteria.map((u, i) => (
                      <button
                        key={u.name}
                        type="button"
                        onClick={() =>
                          goToStep(normalizedCriteria.findIndex(c => c.name === u.name))
                        }
                        className="underline font-bold mr-1 hover:text-amber-950 inline-block"
                      >
                        {u.name}
                        {i < unscoredCriteria.length - 1 ? "," : ""}
                      </button>
                    ))}
                  </p>
                </div>
              </div>
            )}

            {/* Complete score summary table */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-display">
                Score Summary
              </p>
              <div className="space-y-2">
                {normalizedCriteria.map((c, idx) => {
                  const s = scores[c.name];
                  const matchedLevel = c.levels.find(l => l.score === s);
                  const displayLabel = matchedLevel?.label ?? (s !== undefined ? levelLabelForScore(s) : null);

                  return (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="text-slate-400 font-mono font-semibold text-[11px]">
                          {idx + 1}.
                        </span>
                        <button
                          type="button"
                          onClick={() => goToStep(idx)}
                          className="text-slate-700 hover:text-slate-900 font-medium truncate text-left hover:underline"
                        >
                          {c.name}
                        </button>
                        {c.weight && (
                          <span className="text-[10px] text-slate-400 font-mono">({c.weight}%)</span>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        {displayLabel ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{displayLabel}</span>
                            <span className="font-mono text-slate-500 font-semibold">({s}/10)</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => goToStep(idx)}
                            className="text-amber-600 font-bold hover:underline"
                          >
                            {isQuestionBased(c) ? "Answer Questions \u2192" : "Select Level \u2192"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 font-body">
                  {hasWeights ? "Weighted Composite Score" : "Overall Composite Score"}
                </span>
                <span className={`text-sm font-bold font-display ${accentClasses.textPrimary}`}>
                  {compositePct}% ({compositePoints.toFixed(1)}/10)
                </span>
              </div>
            </div>

            {/* Written feedback input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-display">
                {feedbackLabel} {requireFeedback && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={feedbackRows}
                disabled={isPast}
                placeholder={isPast ? disabledMessage : feedbackPlaceholder}
                className={`w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 ${accentClasses.focusRing} resize-none disabled:bg-slate-100 disabled:text-slate-500 font-body leading-relaxed`}
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-body">
                <span>
                  {feedback.length} characters
                  {requireFeedback && feedbackMinLength > 0 && (
                    <span className="ml-1">(min {feedbackMinLength} required)</span>
                  )}
                </span>
                {requireFeedback && feedback.trim().length < feedbackMinLength && (
                  <span className="text-amber-600 font-medium">
                    {feedbackMinLength - feedback.trim().length} more needed
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fixed Navigation Footer ─────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-slate-100 bg-white flex-shrink-0 space-y-2">
        <div className="flex gap-2.5 font-display">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 0 || isSubmitting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          {!isFeedbackStep ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${accentClasses.bgSolid} text-white rounded-lg text-xs font-semibold transition shadow-sm`}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isPast ||
                !allScored ||
                (requireFeedback && feedback.trim().length < feedbackMinLength)
              }
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 ${accentClasses.bgSolid} text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50`}
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSubmitting ? "Submitting…" : submitButtonText}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

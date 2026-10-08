import React from "react";
import { Check } from "lucide-react";
import { RubricCriterion } from "../../api/assignmentApi";

export interface QuestionOptionCardsProps {
  criterion: RubricCriterion;
  /**
   * Array of selected score values (1-5) for each question, indexed by question position.
   */
  selectedAnswers?: number[];
  /**
   * Callback fired when an option is selected for a question.
   */
  onChangeAnswers: (answers: number[]) => void;
  disabled?: boolean;
  accentColor?: "peerity" | "purple";
}

export const QuestionOptionCards: React.FC<QuestionOptionCardsProps> = ({
  criterion,
  selectedAnswers = [],
  onChangeAnswers,
  disabled = false,
  accentColor = "peerity",
}) => {
  const isPurple = accentColor === "purple";
  const questions = criterion.questions ?? [];

  const accentClasses = {
    radioActive: isPurple ? "bg-purple-600 border-purple-600 text-white" : "bg-peerity-800 border-peerity-800 text-white",
    cardSelected: isPurple
      ? "border-purple-600 bg-purple-50/80 shadow-xs ring-1 ring-purple-600"
      : "border-peerity-800 bg-peerity-100/60 shadow-xs ring-1 ring-peerity-800",
    focusRing: isPurple ? "focus:ring-purple-500" : "focus:ring-peerity-600",
    headerBadge: isPurple ? "bg-purple-100 text-purple-800" : "bg-peerity-200 text-peerity-900",
    checkBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const handleSelectOption = (qIdx: number, scoreValue: number) => {
    if (disabled) return;
    const next = [...selectedAnswers];
    // Fill any holes up to qIdx if needed
    while (next.length < qIdx) {
      next.push(0);
    }
    next[qIdx] = scoreValue;
    onChangeAnswers(next);
  };

  if (questions.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center font-body">
        No questions defined for this criterion.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((q, qIdx) => {
        const currentAnswer = selectedAnswers[qIdx];
        const isAnswered = typeof currentAnswer === "number" && currentAnswer > 0;

        return (
          <div
            key={qIdx}
            className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs transition-shadow hover:shadow-xs"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-tight flex-shrink-0 mt-0.5 ${accentClasses.headerBadge}`}
                >
                  Q{qIdx + 1}
                </span>
                <p className="text-xs font-semibold text-slate-800 font-display leading-snug">
                  {q.prompt}
                </p>
              </div>

              {isAnswered && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${accentClasses.checkBadge}`}
                >
                  <Check className="w-2.5 h-2.5" /> Answered
                </span>
              )}
            </div>

            {/* 5 Full-sentence Option Cards (no numeric scores shown to reviewer) */}
            <div
              className="space-y-2 mt-2"
              role="radiogroup"
              aria-label={`Options for Question ${qIdx + 1}`}
            >
              {q.options.map((opt, optIdx) => {
                // Backend scores are 1..5. If scoreValue not explicitly set, default to optIdx + 1
                const optScore = opt.scoreValue ?? (optIdx + 1);
                const isSelected = currentAnswer === optScore;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={disabled}
                    onClick={() => handleSelectOption(qIdx, optScore)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 ${accentClasses.focusRing} disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? accentClasses.cardSelected
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Radio indicator */}
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border flex-shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? accentClasses.radioActive
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>

                      {/* Full-sentence option description */}
                      <span
                        className={`text-xs font-body leading-relaxed flex-1 ${
                          isSelected ? "text-slate-900 font-medium" : "text-slate-700"
                        }`}
                      >
                        {opt.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

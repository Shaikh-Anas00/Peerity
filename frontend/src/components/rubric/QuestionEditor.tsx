import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { RubricQuestion, RubricOption } from "../../api/assignmentApi";

export interface QuestionEditorProps {
  questions: RubricQuestion[];
  onChange: (questions: RubricQuestion[]) => void;
  disabled?: boolean;
}

const DEFAULT_OPTIONS_TEMPLATE: RubricOption[] = [
  { scoreValue: 1, text: "Does not meet basic expectations; significant issues or omissions present." },
  { scoreValue: 2, text: "Shows emerging understanding but contains notable errors or missing elements." },
  { scoreValue: 3, text: "Satisfies core requirements adequately with minor deficiencies." },
  { scoreValue: 4, text: "Strong execution that clearly meets all requirements with high polish." },
  { scoreValue: 5, text: "Exemplary mastery exceeding standard expectations with thorough rigor." },
];

const OPTION_TIER_LABELS = [
  { score: 1, label: "Level 1 (Needs Improvement)", color: "text-red-700 bg-red-50 border-red-200" },
  { score: 2, label: "Level 2 (Developing)", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { score: 3, label: "Level 3 (Competent)", color: "text-blue-700 bg-blue-50 border-blue-200" },
  { score: 4, label: "Level 4 (Proficient)", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { score: 5, label: "Level 5 (Exemplary)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
];

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  questions,
  onChange,
  disabled = false,
}) => {
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({ 0: true });

  const toggleExpand = (index: number) => {
    setExpandedIndices(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleAddQuestion = () => {
    if (disabled) return;
    const newQuestion: RubricQuestion = {
      prompt: `Evaluation Question ${questions.length + 1}`,
      options: JSON.parse(JSON.stringify(DEFAULT_OPTIONS_TEMPLATE)),
    };
    const nextQuestions = [...questions, newQuestion];
    onChange(nextQuestions);
    setExpandedIndices(prev => ({ ...prev, [nextQuestions.length - 1]: true }));
  };

  const handleRemoveQuestion = (index: number) => {
    if (disabled || questions.length <= 1) return;
    const nextQuestions = questions.filter((_, i) => i !== index);
    onChange(nextQuestions);
  };

  const handlePromptChange = (index: number, prompt: string) => {
    const nextQuestions = [...questions];
    nextQuestions[index] = { ...nextQuestions[index], prompt };
    onChange(nextQuestions);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    const nextQuestions = [...questions];
    const nextOptions = [...nextQuestions[qIndex].options];
    nextOptions[optIndex] = {
      ...nextOptions[optIndex],
      text,
      scoreValue: optIndex + 1,
    };
    nextQuestions[qIndex] = { ...nextQuestions[qIndex], options: nextOptions };
    onChange(nextQuestions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display flex items-center gap-1.5">
            Evaluation Questions
            <span className="text-[11px] font-normal text-slate-500 font-body lowercase">
              ({questions.length} {questions.length === 1 ? "question" : "questions"})
            </span>
          </h5>
          <p className="text-[11px] text-slate-500 font-body mt-0.5">
            Reviewers choose the sentence that best describes the work. The criterion score is the average of question scores.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddQuestion}
          disabled={disabled || questions.length >= 6}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-peerity-100 text-peerity-800 hover:bg-peerity-200 border border-peerity-200 transition disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Question
        </button>
      </div>

      <div className="space-y-3">
        {questions.map((q, qIndex) => {
          const isExpanded = expandedIndices[qIndex] ?? true;

          // Ensure exactly 5 options exist
          const options = q.options.length === 5 ? q.options : DEFAULT_OPTIONS_TEMPLATE;

          return (
            <div
              key={qIndex}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-shadow"
            >
              {/* Question Header Accordion Bar */}
              <div
                className="p-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none"
                onClick={() => toggleExpand(qIndex)}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-peerity-200 text-peerity-900 flex-shrink-0">
                    Q{qIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 truncate font-display">
                    {q.prompt || "Untitled Question"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {questions.length > 1 && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveQuestion(qIndex);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Remove Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Question Prompt & 5 Options (Expandable) */}
              {isExpanded && (
                <div className="p-3.5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1 font-display">
                      Question Prompt
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={q.prompt}
                      onChange={(e) => handlePromptChange(qIndex, e.target.value)}
                      placeholder="e.g. How thoroughly are edge cases and invalid inputs handled?"
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-peerity-600 font-body"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 font-display">
                      Descriptive Sentences (1–5 Scale)
                    </label>
                    <div className="space-y-2">
                      {options.map((opt, optIndex) => {
                        const tier = OPTION_TIER_LABELS[optIndex] || OPTION_TIER_LABELS[0];

                        return (
                          <div
                            key={optIndex}
                            className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 mt-0.5 whitespace-nowrap ${tier.color}`}
                            >
                              {tier.label}
                            </span>
                            <textarea
                              disabled={disabled}
                              rows={2}
                              value={opt.text}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              placeholder={`Describe what behavior qualifies for score ${optIndex + 1}...`}
                              className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-peerity-600 font-body resize-y"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

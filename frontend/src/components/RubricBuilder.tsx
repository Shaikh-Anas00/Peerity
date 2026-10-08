import React, { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronUp, BookOpen, Eye, HelpCircle } from "lucide-react";
import { RubricCriterion, PerformanceLevel, RubricOption } from "../api/assignmentApi";
import { SteppedCriterionScoring } from "./SteppedCriterionScoring";
import { TemplatePicker } from "./rubric/TemplatePicker";
import { QuestionEditor } from "./rubric/QuestionEditor";

export interface RubricBuilderProps {
  criteria: RubricCriterion[];
  onChange: (criteria: RubricCriterion[]) => void;
  error?: string | null;
}

const DEFAULT_LEVEL_TEMPLATES: PerformanceLevel[] = [
  { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Demonstrates complete mastery exceeding expectations." },
  { label: "Proficient", score: 8, scoreRange: "7-8", description: "Meets all core requirements with good competence." },
  { label: "Developing", score: 6, scoreRange: "5-6", description: "Demonstrates emerging skill with noticeable gaps." },
  { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Does not meet basic requirements; needs substantial rework." },
];

const DEFAULT_QUESTION_OPTIONS: RubricOption[] = [
  { scoreValue: 1, text: "Does not meet basic expectations; significant issues or omissions present." },
  { scoreValue: 2, text: "Shows emerging understanding but contains notable errors or missing elements." },
  { scoreValue: 3, text: "Satisfies core requirements adequately with minor deficiencies." },
  { scoreValue: 4, text: "Strong execution that clearly meets all requirements with high polish." },
  { scoreValue: 5, text: "Exemplary mastery exceeding standard expectations with thorough rigor." },
];

export const RubricBuilder: React.FC<RubricBuilderProps> = ({ criteria, onChange, error }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [expandedCriteria, setExpandedCriteria] = useState<Record<number, boolean>>({ 0: true });
  const [showPreview, setShowPreview] = useState(false);
  const [useWeights, setUseWeights] = useState<boolean>(() => {
    return criteria.some(c => typeof c.weight === "number" && c.weight > 0);
  });

  const handleApplyTemplate = (templateId: string, templateCriteria: RubricCriterion[]) => {
    setSelectedTemplateId(templateId);
    const cloned = JSON.parse(JSON.stringify(templateCriteria)) as RubricCriterion[];
    if (useWeights) {
      const count = cloned.length;
      if (count > 0) {
        const perWeight = Math.floor(100 / count);
        cloned.forEach((c, idx) => {
          c.weight = idx === 0 ? 100 - perWeight * (count - 1) : perWeight;
        });
      }
    } else {
      cloned.forEach(c => {
        c.weight = null;
      });
    }
    onChange(cloned);
    setExpandedCriteria({ 0: true });
  };

  const handleToggleWeights = (enabled: boolean) => {
    setUseWeights(enabled);
    if (!enabled) {
      onChange(criteria.map(c => ({ ...c, weight: null })));
    } else {
      const count = criteria.length;
      if (count > 0) {
        const perWeight = Math.floor(100 / count);
        onChange(
          criteria.map((c, idx) => ({
            ...c,
            weight: idx === 0 ? 100 - perWeight * (count - 1) : perWeight,
          }))
        );
      }
    }
  };

  const handleAddCriterion = () => {
    if (criteria.length >= 8) return;
    const newIdx = criteria.length;
    // By default match the evaluation type of the first criterion or default to QUESTION_BASED
    const defaultType = criteria[0]?.evaluationType ?? "QUESTION_BASED";

    const newCriterion: RubricCriterion = {
      name: `Criterion ${newIdx + 1}`,
      description: "",
      weight: useWeights ? 0 : null,
      evaluationType: defaultType,
      questions: [
        {
          prompt: "How well does the submission satisfy this requirement?",
          options: JSON.parse(JSON.stringify(DEFAULT_QUESTION_OPTIONS)),
        },
      ],
      levels: JSON.parse(JSON.stringify(DEFAULT_LEVEL_TEMPLATES)),
    };
    onChange([...criteria, newCriterion]);
    setExpandedCriteria(prev => ({ ...prev, [newIdx]: true }));
  };

  const handleRemoveCriterion = (idx: number) => {
    if (criteria.length <= 1) return;
    const next = criteria.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleMove = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= criteria.length) return;
    const copy = [...criteria];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    onChange(copy);
  };

  const handleCriterionChange = (idx: number, patch: Partial<RubricCriterion>) => {
    const copy = [...criteria];
    copy[idx] = { ...copy[idx], ...patch };
    onChange(copy);
  };

  const handleLevelChange = (criterionIdx: number, levelIdx: number, patch: Partial<PerformanceLevel>) => {
    const copy = [...criteria];
    const levels = [...copy[criterionIdx].levels];
    levels[levelIdx] = { ...levels[levelIdx], ...patch };
    copy[criterionIdx] = { ...copy[criterionIdx], levels };
    onChange(copy);
  };

  const toggleExpand = (idx: number) => {
    setExpandedCriteria(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Weight total calculation
  const weightTotal = useWeights
    ? criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0)
    : null;

  return (
    <div className="space-y-4 font-body">
      {/* Template Picker Section */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <TemplatePicker
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={handleApplyTemplate}
        />

        {/* Global Rubric Controls (Weights, Live Preview) */}
        <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useWeights}
                onChange={e => handleToggleWeights(e.target.checked)}
                className="rounded text-peerity-800 focus:ring-peerity-600 w-3.5 h-3.5"
              />
              <span className="font-semibold">Weighted Rubric</span>
            </label>

            {useWeights && (
              <span
                className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                  weightTotal === 100
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                Sum: {weightTotal}% / 100% {weightTotal === 100 ? "✓ Balanced" : "(must sum to 100%)"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              showPreview
                ? "bg-peerity-800 text-white border-peerity-800"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showPreview ? "Return to Editor" : "Preview Scoring UI"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Reviewer Scoring Preview Mode */}
      {showPreview ? (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Live Student Scoring Preview (Interactive)</span>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="text-peerity-800 hover:underline font-bold"
            >
              Return to editor
            </button>
          </div>
          <div className="h-[480px]">
            <SteppedCriterionScoring
              criteria={criteria}
              feedbackPlaceholder="Sample student feedback..."
              onSubmit={() => {}}
            />
          </div>
        </div>
      ) : (
        /* Criterion Cards List */
        <div className="space-y-3">
          {criteria.map((c, idx) => {
            const isExpanded = !!expandedCriteria[idx];
            const isQuestionType = c.evaluationType === "QUESTION_BASED";

            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header row */}
                <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-peerity-100 text-peerity-800 text-xs font-bold flex items-center justify-center flex-shrink-0 font-display">
                      {idx + 1}
                    </span>
                    <input
                      value={c.name}
                      onChange={e => handleCriterionChange(idx, { name: e.target.value })}
                      placeholder="Criterion Name (e.g. Correctness)"
                      className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-peerity-600 focus:bg-white focus:outline-none px-1 py-0.5 rounded truncate flex-1"
                    />

                    {/* Compact type pill */}
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border hidden sm:inline-block ${
                        isQuestionType
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {isQuestionType ? "Question-Based" : "Levels"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {useWeights && (
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Weight:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={c.weight ?? ""}
                          onChange={e =>
                            handleCriterionChange(idx, {
                              weight: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          className="w-10 text-xs font-bold text-slate-800 text-right focus:outline-none"
                        />
                        <span className="text-xs text-slate-500 font-medium">%</span>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 rounded"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === criteria.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 rounded"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={criteria.length <= 1}
                      onClick={() => handleRemoveCriterion(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-20 rounded"
                      title="Delete criterion"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(idx)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Type toggle + questions or 4 levels */}
                {isExpanded && (
                  <div className="p-4 space-y-4 bg-white">
                    {/* Evaluation Type Segmented Control */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-display">
                          Evaluation Model
                        </span>
                        <p className="text-[11px] text-slate-500 font-body">
                          Choose how reviewers evaluate this criterion.
                        </p>
                      </div>

                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const questions =
                              c.questions && c.questions.length > 0
                                ? c.questions
                                : [
                                    {
                                      prompt:
                                        c.description ||
                                        "How well does the submission satisfy this requirement?",
                                      options: JSON.parse(JSON.stringify(DEFAULT_QUESTION_OPTIONS)),
                                    },
                                  ];
                            handleCriterionChange(idx, {
                              evaluationType: "QUESTION_BASED",
                              questions,
                            });
                          }}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                            isQuestionType
                              ? "bg-white text-peerity-900 shadow-2xs font-bold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Question-Based (Sentences)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const levels =
                              c.levels && c.levels.length === 4
                                ? c.levels
                                : JSON.parse(JSON.stringify(DEFAULT_LEVEL_TEMPLATES));
                            handleCriterionChange(idx, {
                              evaluationType: "SCALE_WITH_LEVELS",
                              levels,
                            });
                          }}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                            !isQuestionType
                              ? "bg-white text-peerity-900 shadow-2xs font-bold"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Scale with Levels (4 Tiers)
                        </button>
                      </div>
                    </div>

                    {/* Criterion Description / Prompt */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-display">
                        Criterion Summary / Intent
                      </label>
                      <input
                        value={c.description ?? ""}
                        onChange={e => handleCriterionChange(idx, { description: e.target.value })}
                        placeholder="e.g. Evaluates correctness, code structure, and adherence to requirements."
                        className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-peerity-600 font-body"
                      />
                    </div>

                    {/* Scoring Content: Questions vs Levels */}
                    {isQuestionType ? (
                      <div className="pt-1">
                        <QuestionEditor
                          questions={c.questions ?? []}
                          onChange={newQuestions =>
                            handleCriterionChange(idx, { questions: newQuestions })
                          }
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-display">
                          4 Performance Levels & Descriptors
                        </label>
                        <div className="space-y-2">
                          {(c.levels || DEFAULT_LEVEL_TEMPLATES).map((lvl, lIdx) => (
                            <div
                              key={lIdx}
                              className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  value={lvl.label}
                                  onChange={e =>
                                    handleLevelChange(idx, lIdx, { label: e.target.value })
                                  }
                                  placeholder="Level Label"
                                  className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-peerity-600 w-36"
                                />
                                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                                  {lvl.scoreRange ?? `${lvl.score} pts`}
                                </span>
                              </div>

                              <textarea
                                value={lvl.description ?? ""}
                                onChange={e =>
                                  handleLevelChange(idx, lIdx, { description: e.target.value })
                                }
                                rows={2}
                                placeholder="Behavioral descriptor explaining what work at this performance level looks like..."
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-peerity-600 resize-none font-body leading-relaxed"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {criteria.length < 8 && (
            <button
              type="button"
              onClick={handleAddCriterion}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-peerity-400 hover:bg-peerity-50/50 rounded-xl text-xs font-bold text-slate-600 hover:text-peerity-800 transition flex items-center justify-center gap-1.5 font-display"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Rubric Criterion ({criteria.length}/8)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

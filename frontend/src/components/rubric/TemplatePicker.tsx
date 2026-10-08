import React, { useEffect, useState } from "react";
import { BookOpen, Sparkles, Code2, FileText, Presentation, Sliders, Layers } from "lucide-react";
import { RubricCriterion } from "../../api/assignmentApi";
import { rubricTemplateApi, RubricTemplateDto } from "../../api/rubricTemplateApi";
import { RUBRIC_TEMPLATES as STATIC_SCALE_TEMPLATES } from "../../data/rubricTemplates";

export interface TemplatePickerProps {
  selectedTemplateId?: string;
  onSelectTemplate: (templateId: string, criteria: RubricCriterion[]) => void;
  disabled?: boolean;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  selectedTemplateId,
  onSelectTemplate,
  disabled = false,
}) => {
  const [backendTemplates, setBackendTemplates] = useState<RubricTemplateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"question_based" | "scale_based">("question_based");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    rubricTemplateApi
      .getAll()
      .then((res) => {
        if (mounted && Array.isArray(res.data)) {
          setBackendTemplates(res.data);
        }
      })
      .catch((err) => {
        console.warn("Could not load backend rubric templates:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CODING":
        return <Code2 className="w-4 h-4 text-emerald-600" />;
      case "ESSAY":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "PRESENTATION":
        return <Presentation className="w-4 h-4 text-purple-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleSelectBlank = () => {
    if (disabled) return;
    const blankCriterion: RubricCriterion = {
      name: "Criterion 1",
      description: "Explain what this criterion evaluates...",
      weight: null,
      evaluationType: "QUESTION_BASED",
      questions: [
        {
          prompt: "How well does the submission satisfy this requirement?",
          options: [
            { scoreValue: 1, text: "Fails to meet basic expectations." },
            { scoreValue: 2, text: "Approaches requirements with notable gaps." },
            { scoreValue: 3, text: "Meets baseline requirements adequately." },
            { scoreValue: 4, text: "Strong execution with high quality." },
            { scoreValue: 5, text: "Exemplary mastery exceeding standard expectations." },
          ],
        },
      ],
      levels: [
        { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Demonstrates complete mastery exceeding expectations." },
        { label: "Proficient", score: 8, scoreRange: "7-8", description: "Meets all core requirements with good competence." },
        { label: "Developing", score: 6, scoreRange: "5-6", description: "Demonstrates emerging skill with noticeable gaps." },
        { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Does not meet basic requirements; needs substantial rework." },
      ],
    };
    onSelectTemplate("custom", [blankCriterion]);
  };

  const handleSelectBackendTemplate = (tpl: RubricTemplateDto) => {
    if (disabled) return;
    const cloned = JSON.parse(JSON.stringify(tpl.criteria)) as RubricCriterion[];
    onSelectTemplate(`backend-${tpl.id}`, cloned);
  };

  const handleSelectScaleTemplate = (tplId: string) => {
    if (disabled) return;
    const found = STATIC_SCALE_TEMPLATES.find((t) => t.id === tplId);
    if (found) {
      const cloned = JSON.parse(JSON.stringify(found.criteria)) as RubricCriterion[];
      onSelectTemplate(`scale-${found.id}`, cloned);
    }
  };

  return (
    <div className="space-y-3 font-body">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
          Starter Rubric Templates
        </label>

        {/* Tab switch between Question-Based and Scale-Based */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setActiveTab("question_based")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
              activeTab === "question_based"
                ? "bg-white text-peerity-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Question-Based (New)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setActiveTab("scale_based")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
              activeTab === "scale_based"
                ? "bg-white text-peerity-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Scale with Levels
          </button>
        </div>
      </div>

      {activeTab === "question_based" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {backendTemplates.map((tpl) => {
            const isSelected = selectedTemplateId === `backend-${tpl.id}`;
            return (
              <button
                key={tpl.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectBackendTemplate(tpl)}
                className={`text-left p-3 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-peerity-600 ${
                  isSelected
                    ? "border-peerity-800 bg-peerity-100/60 ring-1 ring-peerity-800 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1 rounded-md bg-slate-100">{getCategoryIcon(tpl.category)}</div>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Questions
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 font-display line-clamp-1">
                  {tpl.name}
                </h5>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  {tpl.description}
                </p>
                <div className="text-[10px] text-slate-400 font-medium mt-2">
                  {tpl.criteria?.length ?? 0} Criteria
                </div>
              </button>
            );
          })}

          {/* Blank / Custom Card */}
          <button
            type="button"
            disabled={disabled}
            onClick={handleSelectBlank}
            className={`text-left p-3 rounded-xl border border-dashed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-peerity-600 ${
              selectedTemplateId === "custom"
                ? "border-peerity-800 bg-peerity-100/60 ring-1 ring-peerity-800"
                : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/70"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1 rounded-md bg-slate-100">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                Custom
              </span>
            </div>
            <h5 className="text-xs font-bold text-slate-900 font-display">Blank Rubric</h5>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
              Start from scratch and define your own custom criteria and questions.
            </p>
            <div className="text-[10px] text-slate-400 font-medium mt-2">1 Blank Criterion</div>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {STATIC_SCALE_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplateId === `scale-${tpl.id}`;
            return (
              <button
                key={tpl.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectScaleTemplate(tpl.id)}
                className={`text-left p-3 rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-peerity-600 ${
                  isSelected
                    ? "border-peerity-800 bg-peerity-100/60 ring-1 ring-peerity-800 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1 rounded-md bg-slate-100">
                    <Sliders className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Levels (4)
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 font-display line-clamp-1">
                  {tpl.name}
                </h5>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  {tpl.description}
                </p>
                <div className="text-[10px] text-slate-400 font-medium mt-2">
                  {tpl.criteria.length} Criteria
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

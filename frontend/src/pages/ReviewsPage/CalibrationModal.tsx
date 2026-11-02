import React, { useEffect, useState } from "react";
import { Award, AlertCircle, X } from "lucide-react";
import { calibrationApi, CalibrationSample, CalibrationResult } from "../../api/calibrationApi";
import { SteppedCriterionScoring } from "../../components/SteppedCriterionScoring";

export interface CalibrationModalProps {
  samples: CalibrationSample[];
  onClose: () => void;
  onCompleted: () => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ samples, onClose, onCompleted }) => {
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">Reviewer Calibration (Peerceptiv Model)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Score this instructor-provided benchmark sample to calibrate your grading accuracy and establish your reliability score.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Calibration Accuracy: {result.accuracyPercentage}%</span>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  MAE: {result.meanAbsoluteError} pts
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Overall Reliability Tier: <strong>{result.reliabilityTier}</strong> ({result.overallReliabilityScore}% across benchmarks)
              </p>
              {result.levelAgreementPct !== undefined && (
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium mt-1">
                  Level Agreement: <strong>{result.levelAgreementPct}%</strong> of criteria matched the expert performance level
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Score Comparison vs Expert</p>
              <div className="space-y-1.5">
                {Object.keys(result.expertScores).map((crit) => {
                  const sLvl = result.studentLevels?.[crit];
                  const eLvl = result.expertLevels?.[crit];

                  return (
                    <div key={crit} className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{crit}</span>
                        {(sLvl || eLvl) && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            You: <span className="font-semibold text-blue-600 dark:text-blue-400">{sLvl ?? result.studentScores[crit]}</span> &bull; Expert: <span className="font-semibold text-purple-600 dark:text-purple-400">{eLvl ?? result.expertScores[crit]}</span>
                          </div>
                        )}
                      </div>
                      <span className="font-mono text-right flex-shrink-0 text-slate-700 dark:text-slate-300">
                        Your Score: <strong className="text-blue-600 dark:text-blue-400">{result.studentScores[crit] ?? "-"}</strong> / 10 &bull; Expert:{" "}
                        <strong className="text-purple-600 dark:text-purple-400">{result.expertScores[crit]}</strong> / 10
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-xs">
              <p className="font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-1">Instructor Expert Feedback</p>
              <p className="text-purple-800 dark:text-purple-300 leading-relaxed">{result.expertFeedback}</p>
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition"
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
                            : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        }`}
                      >
                        Benchmark #{idx + 1} {s.isCompletedByMe && "✓"}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{currentSample.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{currentSample.description}</p>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono max-h-36 overflow-auto whitespace-pre text-slate-700 dark:text-slate-300">
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
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">No calibration samples available for this course yet.</div>
        )}
      </div>
    </div>
  );
};

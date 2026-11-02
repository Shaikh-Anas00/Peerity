import React, { useState } from "react";
import { assignmentApi, Assignment } from "../../api/assignmentApi";
import { useAuth } from "../../context/AuthContext";
import { useApiResource } from "../../hooks/useApiResource";
import { BookOpen, Plus, Upload, Send, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { Button, Badge } from "../../components/ui";
import { SubmitModal } from "./SubmitModal";
import { CreateAssignmentModal } from "./CreateAssignmentModal";

export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: assignments, loading, refetch: load } = useApiResource(() => assignmentApi.getAll(), [] as Assignment[]);
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [distributeId, setDistributeId] = useState<string | null>(null);
  const [reviewerCount, setReviewerCount] = useState(2);
  const [distributing, setDistributing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const isInstructor = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

  const showToast = (msg: string, type: "success" | "error") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleDistribute = async (id: string) => {
    setDistributing(true);
    try {
      const r = await assignmentApi.distribute(id, reviewerCount);
      const data = r.data as any;
      showToast(`Distributed! ${data.reviewsCreated} reviews created across ${data.submissionsProcessed} submissions.`, "success");
      setDistributeId(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Distribution failed.", "error");
    } finally { setDistributing(false); }
  };

  const parseCriteria = (json: string): string[] => { try { return JSON.parse(json); } catch { return [json]; } };
  const isDeadlinePast = (d: string) => new Date(d) < new Date();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen font-body space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === "success" ? "bg-peerity-800 dark:bg-teal-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <ContentHeader
        breadcrumbs={["Course", "Assignments"]}
        title="Assignments"
        subtitle={`${assignments.length} assignment${assignments.length !== 1 ? "s" : ""} available across active modules`}
        icon={BookOpen}
        statusPill={<StatusPill label="ACTIVE MODULES" variant="brand" />}
        actions={
          isInstructor ? (
            <Button onClick={() => setShowCreate(true)} leftIcon={<Plus className="w-4 h-4" />}>
              New Assignment
            </Button>
          ) : undefined
        }
      />

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 font-display">Loading…</p>
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/5" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ClipboardList className="w-14 h-14 text-slate-400 dark:text-slate-600 opacity-30 mb-4" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1 font-display">No assignments yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-body">Your instructor will publish assignments here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Section label */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 font-display">All Assignments</p>

          {assignments.map(a => {
            const criteria = parseCriteria(a.rubricCriteria);
            const past = isDeadlinePast(a.deadline);
            const isExpanded = expanded === a.id;
            return (
              <div key={a.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg truncate font-display">{a.title}</h2>
                        <Badge tone={past ? "danger" : "brand"}>{past ? "Closed" : "Open"}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 font-body">{a.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-body">
                          <Clock className="w-3.5 h-3.5" />
                          Submission Due: {new Date(a.deadline).toLocaleString()}
                        </span>
                        {a.reviewDeadline && (
                          <span className="flex items-center gap-1 text-xs text-peerity-800 dark:text-teal-400 bg-peerity-100 dark:bg-teal-900/30 border border-peerity-200 dark:border-teal-800 px-2 py-0.5 rounded-md font-medium font-body">
                            <Clock className="w-3 h-3" />
                            Review Due: {new Date(a.reviewDeadline).toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-body">by {a.createdByName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isStudent && (
                        a.hasSubmitted ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-peerity-100 text-peerity-800 border border-peerity-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800 rounded-lg text-xs font-bold shadow-sm font-display">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Submitted
                          </span>
                        ) : !past ? (
                          <Button size="sm" onClick={() => setSubmitTarget(a)} leftIcon={<Upload className="w-3.5 h-3.5" />}>
                            Submit
                          </Button>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 rounded-lg text-xs font-medium font-body">
                            Closed
                          </span>
                        )
                      )}
                      {isInstructor && (
                        <Button size="sm" onClick={() => setDistributeId(distributeId === a.id ? null : a.id)} leftIcon={<Send className="w-3.5 h-3.5" />}>
                          Distribute
                        </Button>
                      )}
                      <button onClick={() => setExpanded(isExpanded ? null : a.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Distribute Panel */}
                  {isInstructor && distributeId === a.id && (
                    <div className="mt-4 p-4 bg-peerity-100/50 dark:bg-teal-950/30 rounded-xl border border-peerity-200 dark:border-teal-900/50">
                      <p className="text-sm font-semibold text-peerity-900 dark:text-teal-300 mb-3 font-display">Distribute Reviews</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-xs text-peerity-800 dark:text-teal-400 font-medium font-body">Reviewers per submission:</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3].map(n => (
                            <button key={n} onClick={() => setReviewerCount(n)}
                              className={`w-8 h-8 rounded-lg text-sm font-bold transition font-display ${reviewerCount === n ? "bg-peerity-800 dark:bg-teal-600 text-white shadow-sm" : "bg-white dark:bg-slate-800 border border-peerity-200 dark:border-teal-800 text-peerity-900 dark:text-teal-300 hover:bg-peerity-100 dark:hover:bg-teal-900/40"}`}>{n}</button>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="ml-auto"
                          onClick={() => handleDistribute(a.id)}
                          loading={distributing}
                          leftIcon={<Send className="w-3.5 h-3.5" />}
                        >
                          Assign Now
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rubric Accordion */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 font-display">
                      Rubric Criteria ({a.rubric && a.rubric.length > 0 ? a.rubric.length : criteria.length})
                    </p>
                    {a.rubric && a.rubric.length > 0 ? (
                      <div className="space-y-3">
                        {a.rubric.map((c, i) => (
                          <div key={c.name} className="bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-3.5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-peerity-100 text-peerity-800 dark:bg-teal-900/30 dark:text-teal-400 text-xs flex items-center justify-center font-bold flex-shrink-0 font-display">
                                  {i + 1}
                                </span>
                                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 font-display">{c.name}</span>
                              </div>
                              {c.weight && (
                                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                  {c.weight}% weight
                                </span>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-body pl-7">{c.description}</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 pl-7">
                              {c.levels.map(lvl => (
                                <div key={lvl.label} className="p-2.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-xs space-y-1">
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="text-slate-900 dark:text-slate-100 font-display">{lvl.label}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                      {lvl.scoreRange ?? `${lvl.score} pts`}
                                    </span>
                                  </div>
                                  {lvl.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-body leading-relaxed">{lvl.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {criteria.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 font-body">
                            <div className="w-5 h-5 rounded-full bg-peerity-100 text-peerity-800 dark:bg-teal-900/30 dark:text-teal-400 text-xs flex items-center justify-center font-bold flex-shrink-0 font-display">{i + 1}</div>
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {submitTarget && (
        <SubmitModal assignment={submitTarget} onClose={() => setSubmitTarget(null)} onSuccess={() => { load(); showToast("Submission recorded successfully!", "success"); }} />
      )}
      {showCreate && isInstructor && (
        <CreateAssignmentModal onClose={() => setShowCreate(false)} onSuccess={() => { load(); showToast("Assignment created!", "success"); }} />
      )}
    </div>
  );
};

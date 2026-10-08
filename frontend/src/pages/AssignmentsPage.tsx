import React, { useEffect, useState } from "react";
import { assignmentApi, Assignment, CreateAssignmentPayload, RubricCriterion } from "../api/assignmentApi";
import { submissionApi } from "../api/submissionApi";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Plus, Upload, Send, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Lock, ClipboardList } from "lucide-react";
import { ContentHeader, StatusPill } from "../components/ContentHeader";
import { RubricBuilder } from "../components/RubricBuilder";
import { RUBRIC_TEMPLATES } from "../data/rubricTemplates";

interface SubmitModalProps {
  assignment: Assignment;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmitModal: React.FC<SubmitModalProps> = ({ assignment, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;
    setError(null);

    // Validate size (max 20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File exceeds 20MB limit. Please choose a smaller file.");
      return;
    }

    // Validate extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'zip') {
      setError("Only PDF and ZIP documents are allowed.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF or ZIP file to submit.");
      return;
    }

    setSubmitting(true);
    setProgress(10);
    setError(null);

    try {
      await submissionApi.createWithFile(assignment.id, file, (pct) => {
        setProgress(Math.max(10, pct));
      });
      setProgress(100);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "File upload or encryption failed. Please try again.");
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-900 font-display">Submit Work</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4 font-body">
          Assignment: <span className="font-semibold text-slate-800">{assignment.title}</span>
        </p>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                isDragging
                  ? "border-peerity-600 bg-peerity-100/50"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.zip,application/pdf,application/zip"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="w-12 h-12 bg-peerity-100 text-peerity-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 font-display">
                  Click to upload <span className="font-normal text-slate-500 font-body">or drag and drop</span>
                </p>
                <p className="text-xs text-slate-400 mt-1 font-body">PDF or ZIP up to 20MB</p>
              </label>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-peerity-100 text-peerity-800 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase font-display">
                    {file.name.split('.').pop()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                  </div>
                </div>
                {!submitting && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cryptographic Protection Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <span>
              <span className="font-semibold text-slate-700">Encrypted upload</span> — your file is streamed to the PHP cryptographic sidecar, encrypted via <strong>AES-256-GCM</strong>, and verified using SHA-256 before storage.
            </span>
          </div>

          {/* Progress bar */}
          {submitting && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Encrypting &amp; Storing...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-peerity-800 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 font-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !file}
              className="flex-1 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm font-display"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit File
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CreateAssignmentModalProps { onClose: () => void; onSuccess: () => void; }
const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    reviewDeadline: ""
  });
  const [rubric, setRubric] = useState<RubricCriterion[]>(() =>
    JSON.parse(JSON.stringify(RUBRIC_TEMPLATES[0].criteria))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.deadline || rubric.length === 0) {
      setError("Title, submission deadline, and at least one rubric criterion are required.");
      return;
    }
    if (form.reviewDeadline && new Date(form.reviewDeadline) <= new Date(form.deadline)) {
      setError("Evaluation review deadline must be after the submission deadline.");
      return;
    }
    const hasWeight = rubric.some(c => typeof c.weight === "number" && c.weight > 0);
    if (hasWeight) {
      const sum = rubric.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
      if (sum !== 100) {
        setError(`Rubric weights must sum to 100% (currently ${sum}%).`);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateAssignmentPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        rubric: rubric,
        rubricCriteria: JSON.stringify(rubric.map(c => c.name)),
        deadline: new Date(form.deadline).toISOString().slice(0, 19),
        reviewDeadline: form.reviewDeadline ? new Date(form.reviewDeadline).toISOString().slice(0, 19) : undefined,
      };
      await assignmentApi.create(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[92vh] overflow-y-auto font-body">
        <h2 className="text-lg font-bold text-slate-900 mb-3 font-display">Create Assignment</h2>
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 font-display">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Distributed Systems Architecture Report"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 font-body" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 font-display">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Explain expectations, prompt, and guidelines..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 resize-none font-body" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-display">
              Evaluation Rubric & Performance Levels
            </label>
            <RubricBuilder criteria={rubric} onChange={setRubric} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 font-display">Submission Due</label>
              <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 font-body" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 font-display">Review Due (Optional)</label>
              <input type="datetime-local" value={form.reviewDeadline} onChange={e => setForm(f => ({ ...f, reviewDeadline: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 font-body" />
              <span className="text-[10px] text-slate-400 font-body">Defaults to +7 days after submission</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium transition font-body">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [distributeId, setDistributeId] = useState<string | null>(null);
  const [reviewerCount, setReviewerCount] = useState(2);
  const [distributing, setDistributing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const isInstructor = user?.role === "INSTRUCTOR" || user?.role === "ADMIN";
  const isStudent = user?.role === "STUDENT";

  const load = async () => { setLoading(true); try { const r = await assignmentApi.getAll(); setAssignments(r.data); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

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
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === "success" ? "bg-peerity-800" : "bg-red-600"}`}>
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
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition shadow-sm font-display"
            >
              <Plus className="w-4 h-4" />New Assignment
            </button>
          ) : undefined
        }
      />

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 font-display">Loading…</p>
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-2/5" />
                  <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ClipboardList className="w-14 h-14 text-slate-400 opacity-30 mb-4" />
          <p className="text-lg font-bold text-slate-700 mb-1 font-display">No assignments yet</p>
          <p className="text-sm text-slate-500 font-body">Your instructor will publish assignments here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Section label */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 font-display">All Assignments</p>

          {assignments.map(a => {
            const criteria = parseCriteria(a.rubricCriteria);
            const past = isDeadlinePast(a.deadline);
            const isExpanded = expanded === a.id;
            return (
              <div key={a.id} className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-bold text-slate-900 text-lg truncate font-display">{a.title}</h2>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${past ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-peerity-100 text-peerity-800 border-peerity-200"}`}>
                          {past ? "Closed" : "Open"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 font-body">{a.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-body">
                          <Clock className="w-3.5 h-3.5" />
                          Submission Due: {new Date(a.deadline).toLocaleString()}
                        </span>
                        {a.reviewDeadline && (
                          <span className="flex items-center gap-1 text-xs text-peerity-800 bg-peerity-100 border border-peerity-200 px-2 py-0.5 rounded-md font-medium font-body">
                            <Clock className="w-3 h-3" />
                            Review Due: {new Date(a.reviewDeadline).toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-body">by {a.createdByName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isStudent && (
                        a.hasSubmitted ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-peerity-100 text-peerity-800 border border-peerity-200 rounded-lg text-xs font-bold shadow-sm font-display">
                            <CheckCircle className="w-3.5 h-3.5 text-peerity-800" />
                            Submitted
                          </span>
                        ) : !past ? (
                          <button onClick={() => setSubmitTarget(a)}
                            className="flex items-center gap-1.5 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg px-3 py-2 text-xs font-semibold transition shadow-sm font-display">
                            <Upload className="w-3.5 h-3.5" />Submit
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-medium font-body">
                            Closed
                          </span>
                        )
                      )}
                      {isInstructor && (
                        <button onClick={() => setDistributeId(distributeId === a.id ? null : a.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-xs font-semibold transition shadow-sm font-display">
                          <Send className="w-3.5 h-3.5" />Distribute
                        </button>
                      )}
                      <button onClick={() => setExpanded(isExpanded ? null : a.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Distribute Panel */}
                  {isInstructor && distributeId === a.id && (
                    <div className="mt-4 p-4 bg-peerity-100/50 rounded-xl border border-peerity-200">
                      <p className="text-sm font-semibold text-peerity-900 mb-3 font-display">Distribute Reviews</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-xs text-peerity-800 font-medium font-body">Reviewers per submission:</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3].map(n => (
                            <button key={n} onClick={() => setReviewerCount(n)}
                              className={`w-8 h-8 rounded-lg text-sm font-bold transition font-display ${reviewerCount === n ? "bg-peerity-800 text-white shadow-sm" : "bg-white border border-peerity-200 text-peerity-900 hover:bg-peerity-100"}`}>{n}</button>
                          ))}
                        </div>
                        <button onClick={() => handleDistribute(a.id)} disabled={distributing}
                          className="ml-auto px-4 py-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 transition shadow-sm font-display">
                          {distributing ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Assign Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rubric Accordion */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 font-display">
                      Rubric Criteria ({a.rubric && a.rubric.length > 0 ? a.rubric.length : criteria.length})
                    </p>
                    {a.rubric && a.rubric.length > 0 ? (
                      <div className="space-y-3">
                        {a.rubric.map((c, i) => (
                          <div key={c.name} className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-peerity-100 text-peerity-800 text-xs flex items-center justify-center font-bold flex-shrink-0 font-display">
                                  {i + 1}
                                </span>
                                <span className="font-bold text-sm text-slate-800 font-display">{c.name}</span>
                              </div>
                              {c.weight && (
                                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                                  {c.weight}% weight
                                </span>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-xs text-slate-600 font-body pl-7">{c.description}</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 pl-7">
                              {c.levels.map(lvl => (
                                <div key={lvl.label} className="p-2.5 rounded-lg border border-slate-200/90 bg-white text-xs space-y-1">
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="text-slate-900 font-display">{lvl.label}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                      {lvl.scoreRange ?? `${lvl.score} pts`}
                                    </span>
                                  </div>
                                  {lvl.description && (
                                    <p className="text-[11px] text-slate-500 font-body leading-relaxed">{lvl.description}</p>
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
                          <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 border border-slate-100 font-body">
                            <div className="w-5 h-5 rounded-full bg-peerity-100 text-peerity-800 text-xs flex items-center justify-center font-bold flex-shrink-0 font-display">{i + 1}</div>
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

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { assignmentApi, CreateAssignmentPayload, RubricCriterion } from "../../api/assignmentApi";
import { RubricBuilder } from "../../components/RubricBuilder";
import { RUBRIC_TEMPLATES } from "../../data/rubricTemplates";
import { Modal, Button } from "../../components/ui";

export interface CreateAssignmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ onClose, onSuccess }) => {
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
    <Modal open onClose={onClose} title="Create Assignment" maxWidth="xl">
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-display">Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Distributed Systems Architecture Report"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 font-body" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-display">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Explain expectations, prompt, and guidelines..."
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 resize-none font-body" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 font-display">
            Evaluation Rubric & Performance Levels
          </label>
          <RubricBuilder criteria={rubric} onChange={setRubric} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-display">Submission Due</label>
            <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 font-body" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-display">Review Due (Optional)</label>
            <input type="datetime-local" value={form.reviewDeadline} onChange={e => setForm(f => ({ ...f, reviewDeadline: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 font-body" />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-body">Defaults to +7 days after submission</span>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} className="flex-1">
            {submitting ? "Creating..." : "Create Assignment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

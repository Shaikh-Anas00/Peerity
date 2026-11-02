import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { groupApi, CreateGroupPayload } from "../../api/groupApi";
import { assignmentApi } from "../../api/assignmentApi";
import { Modal, Button } from "../../components/ui";

export interface CreateGroupDialogProps {
  onCreated: () => void;
  onClose: () => void;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ onCreated, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [assignments, setAssignments] = useState<{ id: string; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assignmentApi.getAll().then(res => setAssignments(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Group name is required."); return; }
    setSaving(true); setError(null);
    const payload: CreateGroupPayload = { name: name.trim(), description: description.trim() || undefined };
    if (assignmentId) payload.assignmentId = assignmentId;
    try {
      await groupApi.createGroup(payload);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create group.");
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Create New Group" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 font-display">Group Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Team Alpha — Distributed Systems"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 font-body"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 font-display">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Brief description of the group's focus or goals (optional)"
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 resize-none font-body"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 font-display">Link to Assignment</label>
          <select value={assignmentId} onChange={e => setAssignmentId(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 dark:focus:ring-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-body">
            <option value="">— No assignment link —</option>
            {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" loading={saving} className="flex-1">
            {saving ? "Creating…" : "Create Group"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

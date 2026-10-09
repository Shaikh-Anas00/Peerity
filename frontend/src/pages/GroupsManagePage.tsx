/**
 * GroupsManagePage.tsx — Instructor and Admin view of group management.
 *
 * Features:
 *   - Create new groups (with optional assignment link)
 *   - View all groups in a table
 *   - Per-group: approve pending members, remove members, view attributed evaluations
 *
 * Note on attributed evaluations: names of evaluators are shown here because
 * this endpoint is INSTRUCTOR/ADMIN only and every access is audit-logged.
 * This is intentional for accountability — see GroupController.java for the
 * @PreAuthorize and AuditLedgerService call that backs this.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Plus,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  UserX,
  Eye,
  BarChart2,
  X,
  Layers,
  Trash2,
  Archive,
} from "lucide-react";
import {
  groupApi,
  Group,
  GroupMember,
  GroupMemberEvaluationAdmin,
  CreateGroupPayload,
} from "../api/groupApi";
import { assignmentApi } from "../api/assignmentApi";
import { ContentHeader, StatusPill } from "../components/ContentHeader";

type ToastType = "success" | "error";
interface Toast { msg: string; type: ToastType }

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, string> = {
    FORMING: "bg-amber-50 text-amber-700 border-amber-200",
    ACTIVE:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    CLOSED:  "bg-slate-100 text-slate-500 border-slate-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    REMOVED: "bg-red-50 text-red-700 border-red-200",
    LEADER:  "bg-peerity-100 text-peerity-800 border-peerity-200",
    MEMBER:  "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${cfg[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
};

// =============================================================================
// CREATE GROUP DIALOG
// =============================================================================
interface CreateGroupDialogProps {
  onCreated: () => void;
  onClose: () => void;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ onCreated, onClose }) => {
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 font-body">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 font-display">Create New Group</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-display">Group Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Team Alpha — Distributed Systems"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 font-body"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-display">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Brief description of the group's focus or goals (optional)"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 resize-none font-body"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-display">Link to Assignment</label>
            <select value={assignmentId} onChange={e => setAssignmentId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-peerity-600 bg-white font-body">
              <option value="">— No assignment link —</option>
              {assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-2 pt-1 font-display">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-peerity-800 hover:bg-peerity-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {saving ? "Creating…" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// GROUP MANAGEMENT DETAIL
// =============================================================================
interface GroupManageDetailProps {
  group: Group;
  onBack: () => void;
}

const GroupManageDetail: React.FC<GroupManageDetailProps> = ({ group, onBack }) => {
  const [tab, setTab] = useState<"members" | "evaluations">("members");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [evaluations, setEvaluations] = useState<GroupMemberEvaluationAdmin[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingEvals, setLoadingEvals] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try { const res = await groupApi.getGroupMembers(group.id); setMembers(res.data); }
    catch { setMembers([]); } finally { setLoadingMembers(false); }
  }, [group.id]);

  const loadEvaluations = useCallback(async () => {
    setLoadingEvals(true);
    try { const res = await groupApi.getAllEvaluations(group.id); setEvaluations(res.data); }
    catch { setEvaluations([]); } finally { setLoadingEvals(false); }
  }, [group.id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { if (tab === "evaluations") loadEvaluations(); }, [tab, loadEvaluations]);

  const handleApprove = async (userId: string, name: string) => {
    try {
      await groupApi.approveMember(group.id, userId);
      showToast(`${name} approved.`, "success");
      await loadMembers();
    } catch (err: any) { showToast(err.response?.data?.message || "Approval failed.", "error"); }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this group?`)) return;
    try {
      await groupApi.removeMember(group.id, userId);
      showToast(`${name} removed.`, "success");
      await loadMembers();
    } catch (err: any) { showToast(err.response?.data?.message || "Remove failed.", "error"); }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictMsg, setConflictMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteGroup = async (force = false) => {
    setDeleting(true);
    try {
      const res = await groupApi.deleteGroup(group.id, force);
      showToast(res.data.message || "Group deleted.", "success");
      setDeleteConfirmOpen(false);
      setTimeout(() => onBack(), 900);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setHasConflict(true);
        setConflictMsg(err.response?.data?.message || "Cannot delete group with existing student evaluations.");
      } else {
        showToast(err.response?.data?.message || "Delete operation failed.", "error");
      }
    } finally {
      setDeleting(false);
    }
  };

  const tabCls = (t: typeof tab) =>
    `px-4 py-2 text-sm font-semibold border-b-2 transition font-display ${
      tab === t ? "border-peerity-800 text-peerity-800" : "border-transparent text-slate-500 hover:text-slate-700"
    }`;

  // Parse scores JSON for display
  const parseScores = (json: string): Record<string, number> => {
    try { return JSON.parse(json); } catch { return {}; }
  };

  return (
    <div className="space-y-4">
      {/* Content Header matching "Team Alpha / Evaluate Member [ACTIVE GROUP]" */}
      <ContentHeader
        breadcrumbs={[
          { label: "Manage Groups", onClick: onBack },
          { label: group.name, onClick: () => setTab("members") },
          ...(tab === "evaluations" ? [{ label: "Peer Evaluations (Attributed)" }] : [{ label: "Members" }]),
        ]}
        title={group.name}
        subtitle={
          <div className="flex items-center gap-3 flex-wrap mt-0.5 text-xs text-slate-500 font-body">
            {group.assignmentTitle && (
              <span className="text-peerity-700 font-semibold">
                Assignment: {group.assignmentTitle}
              </span>
            )}
            <span>{group.activeMemberCount} active members</span>
            {group.pendingMemberCount > 0 && (
              <span className="text-amber-600 font-semibold">
                • {group.pendingMemberCount} pending approval
              </span>
            )}
            {group.description && (
              <span className="text-slate-400 block w-full mt-0.5">
                {group.description}
              </span>
            )}
          </div>
        }
        icon={Layers}
        statusPill={
          <StatusPill
            label={`${group.status} GROUP`}
            variant={group.status === "ACTIVE" ? "success" : group.status === "FORMING" ? "warning" : "neutral"}
          />
        }
        actions={
          <button
            type="button"
            onClick={() => { setDeleteConfirmOpen(true); setHasConflict(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition font-display shadow-xs cursor-pointer"
            title="Delete or Archive Group"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Group
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 px-2">
          <button onClick={() => setTab("members")} className={tabCls("members")}>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Members {group.pendingMemberCount > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] flex items-center justify-center font-bold">{group.pendingMemberCount}</span>}</span>
          </button>
          <button onClick={() => setTab("evaluations")} className={tabCls("evaluations")}>
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />Peer Evaluations <span className="text-[10px] text-amber-600 font-semibold ml-1">(Attributed)</span></span>
          </button>
        </div>

        <div className="p-5">
          {tab === "members" && (
            loadingMembers ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-peerity-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">No members yet.</div>
                ) : members.map(m => (
                  <div key={m.membershipId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-peerity-100 text-peerity-800 flex items-center justify-center text-xs font-bold font-display flex-shrink-0">
                      {m.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 font-display">{m.userName}</p>
                      <p className="text-xs text-slate-500 font-body">{m.userEmail}</p>
                    </div>
                    <StatusBadge status={m.role} />
                    <StatusBadge status={m.status} />
                    <div className="flex gap-1.5">
                      {m.status === "PENDING" && (
                        <button onClick={() => handleApprove(m.userId, m.userName)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition">
                          <UserCheck className="w-3 h-3" />Approve
                        </button>
                      )}
                      {m.role !== "LEADER" && m.status === "ACTIVE" && (
                        <button onClick={() => handleRemove(m.userId, m.userName)}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition">
                          <UserX className="w-3 h-3" />Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "evaluations" && (
            <div className="space-y-4">
              {/* Attribution notice */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-body">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>This view shows full evaluator attribution. <strong>Every access is audit-logged</strong> with your identity, timestamp, and IP address. Students see only aggregate scores without evaluator names.</span>
              </div>

              {loadingEvals ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-peerity-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : evaluations.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-400">
                  <BarChart2 className="w-8 h-8 opacity-30 mb-2" />
                  <p className="text-sm">No peer evaluations submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {evaluations.map(ev => {
                    const scores = parseScores(ev.scores);
                    const avg = Object.values(scores).length > 0
                      ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
                      : 0;
                    return (
                      <div key={ev.id} className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-body mb-0.5">
                              <span className="text-slate-500">From:</span>
                              <span className="font-semibold text-slate-900">{ev.evaluatorName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-body">
                              <span className="text-slate-500">To:</span>
                              <span className="font-semibold text-slate-900">{ev.evaluateeName}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl font-bold text-slate-900 font-display">{Math.round((avg / 10) * 100)}%</div>
                            <p className="text-[10px] text-slate-400 font-body">avg score</p>
                          </div>
                        </div>
                        {Object.keys(scores).length > 0 && (
                          <div className="grid grid-cols-2 gap-1 mb-2">
                            {Object.entries(scores).map(([k, v]) => (
                              <div key={k} className="flex justify-between bg-slate-50 rounded-lg px-2.5 py-1 text-xs border border-slate-100">
                                <span className="text-slate-600 font-body">{k}</span>
                                <span className="font-bold text-slate-800">{v}/10</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {ev.feedback && (
                          <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100 italic font-body">"{ev.feedback}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-display font-bold text-base">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Delete Study Group</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {hasConflict ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs font-display">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Academic Guard Triggered</span>
                  </div>
                  <p className="text-xs text-amber-700 font-body leading-relaxed">
                    {conflictMsg}
                  </p>
                </div>
                <p className="text-xs text-slate-600 font-body">
                  To protect academic records and prevent grade loss, this group cannot be permanently erased. Would you like to <strong>Archive &amp; Close</strong> this group instead? It will be hidden from active student rosters while keeping historical evaluations safe.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(true)}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {deleting ? "Archiving..." : "Archive & Close Group"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 font-body leading-relaxed">
                  Are you sure you want to delete <strong>"{group.name}"</strong>?
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-body space-y-1">
                  <p className="font-semibold text-slate-700">Academic Policy Guard:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>If 0 evaluations exist, the group is permanently purged.</li>
                    <li>If student evaluations exist, you will be prompted to safely archive it.</li>
                  </ul>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(false)}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? "Checking & Deleting..." : "Delete Group"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// GROUPS MANAGE PAGE (main)
// =============================================================================
export const GroupsManagePage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await groupApi.getAllGroups(); setGroups(res.data); }
    catch { setGroups([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (selectedGroup) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
        <GroupManageDetail group={selectedGroup} onBack={() => { setSelectedGroup(null); load(); }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {showCreate && (
        <CreateGroupDialog
          onCreated={() => { setShowCreate(false); load(); showToast("Group created.", "success"); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Page Header */}
      <ContentHeader
        breadcrumbs={["Management", "Manage Groups"]}
        title="Manage Groups"
        subtitle={`${groups.length} group${groups.length !== 1 ? "s" : ""} configured in course roster`}
        icon={Layers}
        statusPill={<StatusPill label="ADMIN CONTROL" variant="purple" />}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-sm font-semibold transition shadow-sm font-display"
          >
            <Plus className="w-4 h-4" />New Group
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" /><div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-400 opacity-30 mb-3" />
          <p className="font-semibold text-slate-800 font-display">No groups yet</p>
          <p className="text-xs text-slate-500 mt-1 font-body">Create the first group to get started.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-xl text-sm font-semibold transition font-display">
            <Plus className="w-4 h-4" />Create Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <button key={g.id} onClick={() => setSelectedGroup(g)}
              className="w-full text-left bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
              <div className="w-full">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 font-display truncate">{g.name}</h3>
                  <StatusBadge status={g.status} />
                </div>
                {g.description && <p className="text-xs text-slate-500 truncate font-body mb-2">{g.description}</p>}
                {g.assignmentTitle && <p className="text-xs text-peerity-700 font-semibold mb-2">{g.assignmentTitle}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs w-full">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 font-medium">
                    <strong className="text-slate-900 font-bold">{g.activeMemberCount}</strong> active
                  </span>
                  {g.pendingMemberCount > 0 && (
                    <span className="text-amber-600 font-semibold">
                      <strong>{g.pendingMemberCount}</strong> pending
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

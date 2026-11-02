/**
 * GroupsManagePage — Instructor and Admin view of group management.
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
import { Users, Plus, CheckCircle, AlertCircle, ChevronRight, Layers } from "lucide-react";
import { groupApi, Group } from "../../api/groupApi";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { Badge, Button } from "../../components/ui";
import { groupStatusTone } from "../GroupsPage/groupStatusTone";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupManageDetail } from "./GroupManageDetail";

type ToastType = "success" | "error";
interface Toast { msg: string; type: ToastType }

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
    // size=100: admin roster view — rendered as one grid, not paginated browsing.
    try { const res = await groupApi.getAllGroups(undefined, 0, 100); setGroups(res.data.content); }
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
          <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Group
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" /><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 opacity-30 mb-3" />
          <p className="font-semibold text-slate-800 dark:text-slate-200 font-display">No groups yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-body">Create the first group to get started.</p>
          <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus className="w-4 h-4" />} className="mt-4">
            Create Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <button key={g.id} onClick={() => setSelectedGroup(g)}
              className="w-full text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
              <div className="w-full">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 font-display truncate">{g.name}</h3>
                  <Badge tone={groupStatusTone(g.status)}>{g.status}</Badge>
                </div>
                {g.description && <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-body mb-2">{g.description}</p>}
                {g.assignmentTitle && <p className="text-xs text-peerity-700 dark:text-teal-400 font-semibold mb-2">{g.assignmentTitle}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs w-full">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">{g.activeMemberCount}</strong> active
                  </span>
                  {g.pendingMemberCount > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      <strong>{g.pendingMemberCount}</strong> pending
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * GroupsPage — Student view of group formation and peer evaluation.
 *
 * Tabs per group (see ./GroupDetail.tsx):
 *   Members     — group member list, join button for non-members
 *   Evaluate    — step-by-step rubric to evaluate each team member
 *   My Results  — aggregate scores received (NO evaluator names)
 *
 * Privacy note: The "My Results" tab is backed by /evaluations/my-aggregate which
 * is a backend-enforced endpoint. Even if a student modifies the frontend, they
 * cannot retrieve evaluator identities — that endpoint physically cannot return them.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Users, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { groupApi, Group } from "../../api/groupApi";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { Badge } from "../../components/ui";
import { GroupDetail } from "./GroupDetail";
import { groupStatusTone } from "./groupStatusTone";

type ToastType = "success" | "error" | "info";
interface Toast { msg: string; type: ToastType }

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await groupApi.getMyGroups();
      setGroups(res.data);
    } catch { setGroups([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (selectedGroup) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
        <GroupDetail group={selectedGroup} onBack={() => { setSelectedGroup(null); load(); }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600" : toast.type === "error" ? "bg-red-600" : "bg-peerity-800 dark:bg-teal-600"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <ContentHeader
        breadcrumbs={["Collaboration", "My Groups"]}
        title="My Groups"
        subtitle={`${groups.length} group${groups.length !== 1 ? "s" : ""} active in current term`}
        icon={Users}
        statusPill={<StatusPill label="ACTIVE ROSTER" variant="brand" />}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 opacity-30 mb-3" />
          <p className="font-semibold text-slate-800 dark:text-slate-200 font-display">No groups yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm font-body">
            Your instructor will create groups for your course. Join requests can be submitted from this page once groups are available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <button key={g.id} onClick={() => setSelectedGroup(g)}
              className="w-full text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
              <div className="w-full">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-peerity-600 dark:bg-teal-500 flex-shrink-0" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 font-display truncate">{g.name}</h3>
                  </div>
                  <Badge tone={groupStatusTone(g.status)}>{g.status}</Badge>
                </div>
                {g.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2 font-body">{g.description}</p>}
                {g.assignmentTitle && <p className="text-xs text-peerity-700 dark:text-teal-400 font-semibold">{g.assignmentTitle}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-body">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {g.activeMemberCount} active members
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

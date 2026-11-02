import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Eye,
  BarChart2,
  Layers,
} from "lucide-react";
import { groupApi, Group, GroupMember, GroupMemberEvaluationAdmin } from "../../api/groupApi";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { Badge } from "../../components/ui";
import { groupStatusTone } from "../GroupsPage/groupStatusTone";

type ToastType = "success" | "error";
interface Toast { msg: string; type: ToastType }

export interface GroupManageDetailProps {
  group: Group;
  onBack: () => void;
}

export const GroupManageDetail: React.FC<GroupManageDetailProps> = ({ group, onBack }) => {
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

  const tabCls = (t: typeof tab) =>
    `px-4 py-2 text-sm font-semibold border-b-2 transition font-display ${
      tab === t
        ? "border-peerity-800 text-peerity-800 dark:border-teal-400 dark:text-teal-400"
        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
          <div className="flex items-center gap-3 flex-wrap mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-body">
            {group.assignmentTitle && (
              <span className="text-peerity-700 dark:text-teal-400 font-semibold">
                Assignment: {group.assignmentTitle}
              </span>
            )}
            <span>{group.activeMemberCount} active members</span>
            {group.pendingMemberCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                • {group.pendingMemberCount} pending approval
              </span>
            )}
            {group.description && (
              <span className="text-slate-400 dark:text-slate-500 block w-full mt-0.5">
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
      />

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-2">
          <button onClick={() => setTab("members")} className={tabCls("members")}>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Members {group.pendingMemberCount > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] flex items-center justify-center font-bold">{group.pendingMemberCount}</span>}</span>
          </button>
          <button onClick={() => setTab("evaluations")} className={tabCls("evaluations")}>
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />Peer Evaluations <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold ml-1">(Attributed)</span></span>
          </button>
        </div>

        <div className="p-5">
          {tab === "members" && (
            loadingMembers ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-peerity-600 dark:border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500">No members yet.</div>
                ) : members.map(m => (
                  <div key={m.membershipId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-peerity-100 text-peerity-800 dark:bg-teal-950/40 dark:text-teal-400 flex items-center justify-center text-xs font-bold font-display flex-shrink-0">
                      {m.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">{m.userName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-body">{m.userEmail}</p>
                    </div>
                    <Badge tone={groupStatusTone(m.role)}>{m.role}</Badge>
                    <Badge tone={groupStatusTone(m.status)}>{m.status}</Badge>
                    <div className="flex gap-1.5">
                      {m.status === "PENDING" && (
                        <button onClick={() => handleApprove(m.userId, m.userName)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition">
                          <UserCheck className="w-3 h-3" />Approve
                        </button>
                      )}
                      {m.role !== "LEADER" && m.status === "ACTIVE" && (
                        <button onClick={() => handleRemove(m.userId, m.userName)}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs font-semibold transition">
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
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-body">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>This view shows full evaluator attribution. <strong>Every access is audit-logged</strong> with your identity, timestamp, and IP address. Students see only aggregate scores without evaluator names.</span>
              </div>

              {loadingEvals ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-peerity-600 dark:border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : evaluations.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-400 dark:text-slate-500">
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
                      <div key={ev.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-body mb-0.5">
                              <span className="text-slate-500 dark:text-slate-400">From:</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{ev.evaluatorName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-body">
                              <span className="text-slate-500 dark:text-slate-400">To:</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{ev.evaluateeName}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">{Math.round((avg / 10) * 100)}%</div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-body">avg score</p>
                          </div>
                        </div>
                        {Object.keys(scores).length > 0 && (
                          <div className="grid grid-cols-2 gap-1 mb-2">
                            {Object.entries(scores).map(([k, v]) => (
                              <div key={k} className="flex justify-between bg-slate-50 dark:bg-slate-800/60 rounded-lg px-2.5 py-1 text-xs border border-slate-100 dark:border-slate-700">
                                <span className="text-slate-600 dark:text-slate-400 font-body">{k}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{v}/10</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {ev.feedback && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700 italic font-body">"{ev.feedback}"</p>
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

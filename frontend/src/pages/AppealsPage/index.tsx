import React, { useEffect, useState, useCallback } from "react";
import {
  appealApi,
  Appeal,
  DisclosedIdentity,
  AppealStatus,
} from "../../api/appealApi";
import { useAuth } from "../../context/AuthContext";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { Badge, BadgeTone } from "../../components/ui";
import { ProgressiveDisclosureStepper } from "./ProgressiveDisclosureStepper";
import { QuorumVotingCard } from "./QuorumVotingCard";
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
} from "lucide-react";

const STATUS_TONE: Record<AppealStatus, BadgeTone> = {
  SUBMITTED: "warning",
  UNDER_INVESTIGATION: "info",
  RESOLVED_UPHELD: "success",
  RESOLVED_DISMISSED: "neutral",
};

const StatusBadge: React.FC<{ status: AppealStatus }> = ({ status }) => (
  <Badge tone={STATUS_TONE[status]}>{status.replace(/_/g, " ")}</Badge>
);

const QuorumBadge: React.FC<{ appeal: Appeal }> = ({ appeal }) => {
  if (appeal.disclosureStatus === "APPROVED") {
    return (
      <Badge tone="success" icon={<CheckCircle className="w-3 h-3" />}>
        Quorum Approved
      </Badge>
    );
  }
  if (appeal.disclosureStatus === "REJECTED") {
    return <Badge tone="danger">Quorum Rejected</Badge>;
  }
  return (
    <Badge tone="warning" icon={<Clock className="w-3 h-3" />}>
      Committee Review ({appeal.approveCount ?? 0}/{appeal.thresholdRequired ?? 2} Approvals)
    </Badge>
  );
};

export const AppealsPage: React.FC = () => {
  const { user } = useAuth();
  const [myAppeals, setMyAppeals] = useState<Appeal[]>([]);
  const [pendingAppeals, setPendingAppeals] = useState<Appeal[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "committee">("my");
  const [selectedDisclosed, setSelectedDisclosed] = useState<{ reviewId: string; data: DisclosedIdentity } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const isStaff = user?.role === "COMMITTEE" || user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.role === "STUDENT") {
        const res = await appealApi.getMyAppeals();
        setMyAppeals(res.data);
      }
      if (isStaff) {
        const [pendingRes] = await Promise.all([
          // size=100: committee case queue — rendered as one list, not paginated browsing.
          appealApi.getPending(0, 100).catch(() => ({ data: { content: [] as Appeal[] } })),
        ]);
        setPendingAppeals(pendingRes.data.content);
        // Staff can also see their own filed appeals (if any)
        try {
          const myRes = await appealApi.getMyAppeals();
          setMyAppeals(myRes.data);
        } catch { /* staff may not have filed appeals */ }
      }
    } catch {
      setMyAppeals([]);
      setPendingAppeals([]);
    } finally {
      setLoading(false);
    }
  }, [user, isStaff]);

  useEffect(() => {
    loadData();
    if (isStaff) setActiveTab("committee");
  }, [user]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInspectIdentity = async (reviewId: string) => {
    try {
      const res = await appealApi.getDisclosedIdentity(reviewId);
      setSelectedDisclosed({ reviewId, data: res.data });
    } catch (err: any) {
      showToast(err.response?.data?.message || "Could not fetch disclosed identity.", "error");
    }
  };

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

      {/* Page Header */}
      <ContentHeader
        breadcrumbs={["Adjudication", activeTab === "committee" && isStaff ? "Quorum Votes" : "Disputes"]}
        title={activeTab === "committee" && isStaff ? "Quorum Adjudication" : "Dispute Adjudication"}
        subtitle="N-of-M quorum voting engine — 2 of 3 committee approvals required to unlock disclosure."
        icon={Scale}
        statusPill={
          <StatusPill
            label={isStaff && pendingAppeals.length > 0 ? `${pendingAppeals.length} CASES PENDING` : `${myAppeals.length} CASES FILED`}
            variant={isStaff && pendingAppeals.length > 0 ? "warning" : "brand"}
          />
        }
        actions={
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white transition shadow-xs dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-900"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {/* Tabs (staff gets committee tab) */}
      {isStaff && (
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6 font-display">
          <button
            onClick={() => setActiveTab("committee")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "committee"
                ? "border-peerity-800 text-peerity-800 dark:border-teal-400 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Quorum Adjudication ({pendingAppeals.length})
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "my"
                ? "border-peerity-800 text-peerity-800 dark:border-teal-400 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Scale className="w-4 h-4" />
            My Filed Disputes ({myAppeals.length})
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : activeTab === "committee" && isStaff ? (

        /* ── Committee Quorum Adjudication View ── */
        <div>
          {pendingAppeals.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500 dark:text-emerald-400 opacity-60" />
              <p className="font-semibold text-slate-700 dark:text-slate-300 font-display">No Pending Disputes</p>
              <p className="text-sm mt-1 font-body">All filed peer review appeals have been resolved or dismissed.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingAppeals.map((appeal) => (
                <div key={appeal.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-6 space-y-5">
                  {/* Appeal Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={appeal.status} />
                        <QuorumBadge appeal={appeal} />
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-body">Filed {new Date(appeal.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 font-display">{appeal.assignmentTitle || "Assignment Dispute"}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                        Reviewer Pseudonym: <span className="font-semibold text-slate-700 dark:text-slate-300">{appeal.reviewerPseudonym}</span>
                      </p>
                    </div>
                    <span className="text-xs font-bold text-peerity-800 bg-peerity-100 border border-peerity-200 dark:text-teal-300 dark:bg-teal-950/40 dark:border-teal-800 px-3 py-1 rounded-lg inline-block flex-shrink-0 font-display">
                      Policy Tier: {appeal.recommendedLevel || "LEVEL_2"}
                    </span>
                  </div>

                  {/* Progressive Disclosure Stepper */}
                  <ProgressiveDisclosureStepper
                    currentLevel={appeal.requestedLevel || appeal.recommendedLevel}
                    isApproved={appeal.disclosureStatus === "APPROVED"}
                  />

                  {/* Dispute Statement */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1 font-display">
                      Appellant Grounds ({appeal.reason.replace(/_/g, " ")})
                    </p>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic font-body">"{appeal.statement}"</p>
                  </div>

                  {/* Disputed Review Feedback */}
                  {appeal.reviewFeedback && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 text-xs text-slate-700 dark:text-slate-300 font-body">
                      <span className="font-semibold text-amber-900 dark:text-amber-300 font-display">Disputed Feedback:</span> "{appeal.reviewFeedback}"
                    </div>
                  )}

                  {/* Quorum Voting Card */}
                  <QuorumVotingCard
                    appeal={appeal}
                    onVoteSuccess={() => {
                      showToast("Vote recorded. Checking quorum threshold...", "success");
                      loadData();
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      ) : (

        /* ── Student View: My Filed Disputes ── */
        <div>
          {myAppeals.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-700 dark:text-slate-300 font-display">No Active Disputes</p>
              <p className="text-sm mt-1 font-body">
                If you receive an unfair or abusive review, you can file a dispute directly from your <strong>Feedback</strong> page.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {myAppeals.map((appeal) => {
                const isDisclosedOpen = selectedDisclosed?.reviewId === appeal.reviewId;
                const disclosed = selectedDisclosed?.data;
                return (
                  <div key={appeal.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={appeal.status} />
                          <QuorumBadge appeal={appeal} />
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-body">Filed {new Date(appeal.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 font-display">{appeal.assignmentTitle || "Assignment Dispute"}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                          Reviewer: <span className="font-semibold text-slate-700 dark:text-slate-300">{appeal.reviewerPseudonym}</span> &bull; Reason:{" "}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{appeal.reason.replace(/_/g, " ")}</span>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 px-3 py-1 rounded-lg inline-block flex-shrink-0 font-display">
                        Target Tier: {appeal.requestedLevel || appeal.recommendedLevel}
                      </span>
                    </div>

                    {/* Progressive Stepper */}
                    <ProgressiveDisclosureStepper
                      currentLevel={appeal.requestedLevel || appeal.recommendedLevel}
                      isApproved={appeal.disclosureStatus === "APPROVED"}
                    />

                    {/* Quorum Status Banner (student-visible) */}
                    {appeal.disclosureStatus === "PENDING_APPROVAL" && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-body">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <div>
                          <span className="font-bold font-display">Committee Review In Progress</span>
                          <span className="ml-2">({appeal.approveCount ?? 0} / {appeal.thresholdRequired ?? 2} Approvals received)</span>
                          <span className="block text-amber-600 dark:text-amber-400 mt-0.5 font-body">
                            Identity will remain double-blind until {appeal.thresholdRequired ?? 2} committee members vote to approve.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Resolution Notes */}
                    {appeal.resolution && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-300 font-body">
                        <span className="font-bold font-display">Committee Findings:</span> {appeal.resolution}
                      </div>
                    )}

                    {/* Appellant Statement */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1 font-display">Your Dispute Statement</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic font-body">"{appeal.statement}"</p>
                    </div>

                    {/* Identity Inspection Controls */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-body">
                        {appeal.disclosureStatus === "APPROVED" ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 font-display">
                            <CheckCircle className="w-3.5 h-3.5" /> Disclosure approved by committee quorum
                          </span>
                        ) : appeal.status === "RESOLVED_DISMISSED" ? (
                          <span className="text-slate-500 dark:text-slate-400 font-body">Dispute dismissed. Identity kept confidential.</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-body">
                            <Clock className="w-3.5 h-3.5" /> Awaiting committee votes
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleInspectIdentity(appeal.reviewId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition shadow-sm font-display"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        {isDisclosedOpen ? "Refresh Metadata" : "View Disclosed Identity"}
                      </button>
                    </div>

                    {/* Disclosed Identity Card */}
                    {isDisclosedOpen && disclosed && (
                      <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-2 mt-3 font-body">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 font-display">
                            <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            Disclosed Identity (Tier: {disclosed.level})
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-display ${
                            disclosed.isApproved
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}>
                            {disclosed.isApproved ? "Committee Authorized" : "Strictly Anonymous (Level 0)"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-purple-100 dark:border-purple-900/50">
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-display">Pseudonym</p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{disclosed.pseudonym}</p>
                          </div>
                          {disclosed.institution && (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-purple-100 dark:border-purple-900/50">
                              <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-display">Institution</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{disclosed.institution}</p>
                            </div>
                          )}
                          {disclosed.department && (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-purple-100 dark:border-purple-900/50">
                              <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-display">Department</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{disclosed.department}</p>
                            </div>
                          )}
                          {disclosed.eligibilityStatus && (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-purple-100 dark:border-purple-900/50">
                              <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-display">Eligibility</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{disclosed.eligibilityStatus}</p>
                            </div>
                          )}
                          {disclosed.academicStanding && (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-purple-100 dark:border-purple-900/50">
                              <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold font-display">Academic Standing</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{disclosed.academicStanding}</p>
                            </div>
                          )}
                          {disclosed.fullName && (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-red-200 dark:border-red-900/50">
                              <p className="text-red-400 dark:text-red-400/80 text-[10px] uppercase font-bold font-display">Full Legal Name</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{disclosed.fullName}</p>
                            </div>
                          )}
                          {disclosed.email && (
                            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 border border-red-200 dark:border-red-900/50">
                              <p className="text-red-400 dark:text-red-400/80 text-[10px] uppercase font-bold font-display">University Email</p>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{disclosed.email}</p>
                            </div>
                          )}
                        </div>
                        {!disclosed.isApproved && (
                          <p className="text-xs text-center text-slate-400 dark:text-slate-500 pt-1 italic font-body">
                            All identity attributes are masked pending committee quorum approval.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

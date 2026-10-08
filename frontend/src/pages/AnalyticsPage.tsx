import React, { useEffect, useState } from "react";
import { analyticsApi, AnalyticsDashboardData } from "../api/analyticsApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  Award,
  ThumbsUp,
  PieChart as PieIcon,
  CheckCircle,
  Clock,
  Scale,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { ContentHeader, StatusPill } from "../components/ContentHeader";

const REASON_COLORS: Record<string, string> = {
  HARASSMENT_OR_ABUSE: "#ef4444", // red
  FACTUAL_FABRICATION: "#f97316", // orange
  UNFAIR_GRADING_OUTLIER: "#eab308", // yellow
  PROCEDURAL_ERROR: "#3b82f6", // blue
};

const TIER_COLORS: Record<string, string> = {
  LEVEL_0_ANONYMOUS: "#94a3b8",
  LEVEL_1_ELIGIBILITY: "#38bdf8",
  LEVEL_2_INSTITUTION_DEPT: "#a855f7",
  LEVEL_3_ACADEMIC_STANDING: "#f59e0b",
  LEVEL_4_FULL_IDENTITY: "#ef4444",
};

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getDashboard();
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format pie chart data for dispute reasons
  const disputePieData = data?.disputeMetrics?.byReason
    ? Object.entries(data.disputeMetrics.byReason).map(([key, value]) => ({
        name: key.replace(/_/g, " "),
        rawKey: key,
        value,
      }))
    : [];

  const hasDisputes = disputePieData.some((d) => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-body">
      {/* Page Header */}
      <ContentHeader
        breadcrumbs={["Monitoring", "Analytics Dashboard"]}
        title="Analytics Dashboard"
        subtitle="Review completion, score distributions, and dispute governance metrics."
        icon={BarChart3}
        statusPill={<StatusPill label="LIVE TELEMETRY" variant="success" />}
        actions={
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition border border-slate-200 bg-white shadow-xs"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse">
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded w-1/3" />
                <div className="h-2 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-80 animate-pulse" />
            <div className="bg-white rounded-xl border border-slate-200 p-6 h-80 animate-pulse" />
          </div>
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
          <p className="font-semibold text-slate-700 font-display">Failed to load analytics data</p>
          <p className="text-xs text-slate-400 mt-1 font-body">Please refresh the page or check back later.</p>
        </div>
      ) : (
        <>
          {/* Top KPI Cards: Review Completion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">
                  Total Reviews Assigned
                </span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 font-display">{data.reviewCompletion.totalAssigned}</p>
              <p className="text-xs text-slate-400 font-body">Across active course submissions</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">
                  Reviews Completed
                </span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-emerald-600 font-display">{data.reviewCompletion.completed}</p>
              <p className="text-xs text-slate-400 font-body">Rubric scores and feedback submitted</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">
                  Completion Rate
                </span>
                <TrendingUp className="w-4 h-4 text-peerity-800" />
              </div>
              <p className="text-3xl font-bold text-peerity-800 font-display">{data.reviewCompletion.completionRate}%</p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-peerity-800 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.reviewCompletion.completionRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">
                  Total Disputes Filed
                </span>
                <Scale className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-600 font-display">{data.disputeMetrics.totalDisputes}</p>
              <p className="text-xs text-slate-400 font-body">
                Resolved Upheld: {data.disputeMetrics.byStatus?.RESOLVED_UPHELD || 0} &bull; Dismissed:{" "}
                {data.disputeMetrics.byStatus?.RESOLVED_DISMISSED || 0}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Histogram */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-peerity-800" />
                  <h3 className="text-base font-bold text-slate-900 font-display">Score Distribution Histogram</h3>
                </div>
                <span className="text-xs text-slate-500 font-body">Bins (0-100 scale)</span>
              </div>
              <p className="text-xs text-slate-500 font-body">
                Aggregated distribution of all rubric criterion scores given by peer reviewers.
              </p>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.scoreDistributions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="#2B7A78" radius={[6, 6, 0, 0]} name="Scores Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dispute Reasons Breakdown Donut */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900 font-display">Dispute Reasons Breakdown</h3>
                </div>
                <span className="text-xs text-slate-500 font-body">{data.disputeMetrics.totalDisputes} Filed</span>
              </div>
              <p className="text-xs text-slate-500 font-body">
                Grounds for appeal categorized by policy engine severity tier.
              </p>

              <div className="h-64 w-full flex items-center justify-center pt-2">
                {hasDisputes ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={disputePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {disputePieData.map((entry) => (
                          <Cell
                            key={`cell-${entry.rawKey}`}
                            fill={REASON_COLORS[entry.rawKey] || "#cbd5e1"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-400 text-xs py-12">
                    No disputes filed yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progressive Disclosure Tier Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 font-display">Progressive Disclosure Tier Governance</h3>
            </div>
            <p className="text-xs text-slate-500 font-body">
              Distribution of reviewer privacy disclosure states currently authorized across the platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              {Object.entries(data.disclosureTierMetrics || {}).map(([tier, count]) => {
                const color = TIER_COLORS[tier] || "#94a3b8";
                const tierName = tier.replace(/LEVEL_\d_/, "").replace(/_/g, " ");
                return (
                  <div
                    key={tier}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-display">
                          {tier.split("_").slice(0, 2).join(" ")}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1 font-body">{tierName}</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-3 font-display">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B4 fix: Reviewer Quality & Calibration card — was missing from JSX */}
          {data.reviewerQuality && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 font-display">Reviewer Quality &amp; Calibration</h3>
              </div>
              <p className="text-xs text-slate-500 font-body">
                Aggregate calibration accuracy and peer feedback helpfulness across all reviewers in scope.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Avg Calibration Accuracy</p>
                  <p className="text-2xl font-bold text-purple-700 font-display">
                    {data.reviewerQuality.averageCalibrationScore !== null
                      ? `${Math.round(data.reviewerQuality.averageCalibrationScore)}%`
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-400 font-body">Mean accuracy vs expert benchmark scores</p>
                </div>

                <div className="p-4 rounded-xl border border-peerity-200 bg-peerity-100/50 space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Calibration Completion</p>
                  <p className="text-2xl font-bold text-peerity-900 font-display">
                    {Math.round(data.reviewerQuality.calibrationCompletionRate)}%
                  </p>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-peerity-600 rounded-full"
                      style={{ width: `${Math.min(data.reviewerQuality.calibrationCompletionRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Feedback Rating</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {data.reviewerQuality.averageFeedbackRating > 0
                      ? `${data.reviewerQuality.averageFeedbackRating.toFixed(1)} / 5`
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Helpfulness rate: {Math.round(data.reviewerQuality.helpfulnessRate)}% &bull; {data.reviewerQuality.totalRatingsCount} ratings
                  </p>
                </div>
              </div>

              {data.reviewerQuality.totalRatingsCount === 0 && (
                <p className="text-xs text-slate-400 text-center pt-2 italic">
                  No review ratings submitted yet. Data will appear once students rate received feedback.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

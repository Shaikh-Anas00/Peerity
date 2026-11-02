import React from "react";
import {
  ShieldCheck,
  Users,
  BarChart3,
  CheckCircle2,
  FileText,
  Star,
  Scale,
  ChevronRight,
  ChevronLeft,
  BadgeCheck,
} from "lucide-react";
import { C } from "./tokens";

/**
 * In-product mockup panel (faithful replica of the app's dashboard/review
 * UI — replace the inner <img> tag once screenshots are available)
 */
export const ProductMockup: React.FC = () => {
  const [hasRealScreenshot, setHasRealScreenshot] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"group-eval" | "reviews">("group-eval");

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl border"
      style={{ borderColor: C.lightTint, backgroundColor: "#f8fafc" }}
    >
      {/* Browser chrome */}
      <div
        className="h-9 flex items-center px-4 gap-1.5 border-b"
        style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
      >
        <span className="w-3 h-3 rounded-full bg-rose-400 opacity-80" />
        <span className="w-3 h-3 rounded-full bg-amber-400 opacity-80" />
        <span className="w-3 h-3 rounded-full bg-emerald-400 opacity-80" />
        <div
          className="ml-4 flex-1 max-w-xs h-5 rounded-md flex items-center px-3 text-xs truncate"
          style={{ backgroundColor: C.lightTint, color: C.mutedText }}
        >
          app.peerity.edu{activeTab === "group-eval" ? "/groups/evaluate" : "/reviews"}
        </div>

        {/* View switcher between in-product features */}
        {!hasRealScreenshot && (
          <div className="ml-auto flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-[10px]">
            <button
              type="button"
              onClick={() => setActiveTab("group-eval")}
              className={`px-2 py-0.5 rounded font-medium transition ${
                activeTab === "group-eval"
                  ? "bg-white text-slate-800 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Group Evaluate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`px-2 py-0.5 rounded font-medium transition ${
                activeTab === "reviews"
                  ? "bg-white text-slate-800 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Peer Review
            </button>
          </div>
        )}
      </div>

      {/* Real screenshot branch if file is available */}
      {hasRealScreenshot && (
        <div className="relative">
          <img
            src="/screenshots/groups-evaluate.png"
            alt="Peerity Group Member Evaluation Interface"
            className="w-full h-auto block"
            onError={() => {
              setHasRealScreenshot(false);
            }}
          />
        </div>
      )}

      {/* High-fidelity coded mockup */}
      {!hasRealScreenshot && (
        <div className="flex" style={{ minHeight: 350 }}>
          {/* Sidebar */}
          <div
            className="w-40 flex-shrink-0 p-3.5 border-r flex flex-col gap-1"
            style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
          >
            <div className="flex items-center gap-2 mb-3 px-2">
              <div
                className="w-5.5 h-5.5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.darkTeal }}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold font-display" style={{ color: C.darkTeal }}>
                Peerity
              </span>
            </div>
            {[
              { icon: <FileText className="w-3.5 h-3.5" />, label: "Assignments", key: "assignments" },
              { icon: <Star className="w-3.5 h-3.5" />, label: "My Reviews", key: "reviews", active: activeTab === "reviews" },
              { icon: <Users className="w-3.5 h-3.5" />, label: "Groups", key: "groups", active: activeTab === "group-eval" },
              { icon: <Scale className="w-3.5 h-3.5" />, label: "Disputes", key: "appeals" },
              { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Analytics", key: "analytics" },
            ].map(({ icon, label, active, key }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (key === "groups") setActiveTab("group-eval");
                  if (key === "reviews") setActiveTab("reviews");
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-left transition"
                style={{
                  backgroundColor: active ? C.lightTint : "transparent",
                  color: active ? C.darkTeal : C.mutedText,
                  fontWeight: active ? 600 : 500,
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Main content pane */}
          {activeTab === "group-eval" ? (
            /* GroupsPage "Evaluate" tab mockup */
            <div className="flex-1 p-4 overflow-hidden flex flex-col justify-between font-body">
              <div>
                {/* Breadcrumb & status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-display">
                    <span className="font-semibold text-slate-700">Team Alpha</span>
                    <span className="text-slate-300">/</span>
                    <span style={{ color: C.darkTeal }} className="font-semibold">
                      Evaluate Member
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                    style={{ backgroundColor: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }}
                  >
                    Active Group
                  </span>
                </div>

                {/* Confidentiality callout */}
                <div
                  className="rounded-lg p-2 mb-2.5 flex items-center gap-2 border text-[11px]"
                  style={{ backgroundColor: C.lightTint + "60", borderColor: C.midTeal + "40", color: C.darkText }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.darkTeal }} />
                  <span className="truncate">Peer scores remain confidential. Attribution is reserved for instructors.</span>
                </div>

                {/* Evaluation Stepper Card */}
                <div
                  className="rounded-xl border p-3 shadow-xs"
                  style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
                >
                  {/* Stepper header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">
                        Evaluating Teammate
                      </p>
                      <h4 className="text-xs font-bold text-slate-800 font-display">
                        Bob Martinez <span className="text-[10px] font-normal text-slate-500">(Information Systems)</span>
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono" style={{ color: C.darkTeal }}>
                        Step 2/5
                      </span>
                      <p className="text-[9px] text-slate-400 font-display">40% complete</p>
                    </div>
                  </div>

                  {/* Step pills */}
                  <div className="flex gap-1 mb-2.5 overflow-x-auto pb-0.5">
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Contribution
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white shadow-xs"
                      style={{ backgroundColor: C.darkTeal }}
                    >
                      2. Communication
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] text-slate-500 bg-slate-50 border border-slate-200">
                      3. Reliability
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] text-slate-500 bg-slate-50 border border-slate-200">
                      4. Teamwork
                    </span>
                  </div>

                  {/* Criterion scoring box */}
                  <div
                    className="rounded-lg p-2.5 mb-2 border"
                    style={{ backgroundColor: C.lightTint + "35", borderColor: C.lightTint }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-800">Communication & Clarity</span>
                      <span className="text-sm font-bold font-mono" style={{ color: C.darkTeal }}>
                        8.5 <span className="text-[10px] font-normal text-slate-400">/ 10</span>
                      </span>
                    </div>

                    {/* Score slider track */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 mb-2">
                      <div className="h-full rounded-full" style={{ width: "85%", backgroundColor: C.midTeal }} />
                    </div>

                    {/* Quick score buttons */}
                    <div className="flex justify-between gap-1">
                      {[0, 2, 4, 6, 8, 9, 10].map(val => (
                        <span
                          key={val}
                          className="flex-1 text-center py-0.5 rounded text-[9px] font-bold font-mono border"
                          style={{
                            backgroundColor: val === 8 ? C.darkTeal : "#fff",
                            color: val === 8 ? "#fff" : C.mutedText,
                            borderColor: val === 8 ? C.darkTeal : "#e2e8f0",
                          }}
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-display">
                      <ChevronLeft className="w-3 h-3" /> Previous
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-white shadow-xs flex items-center gap-1 font-display"
                      style={{ backgroundColor: C.darkTeal }}
                    >
                      Next Step <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Reviews view */
            <div className="flex-1 p-4 overflow-hidden">
              <div className="mb-3">
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: C.midTeal }}>
                  Reviews
                </p>
                <h3 className="text-sm font-semibold font-display" style={{ color: C.darkText }}>
                  Pending Assignments
                </h3>
              </div>

              <div
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mb-3 border"
                style={{ backgroundColor: C.lightTint, color: C.darkTeal, borderColor: C.midTeal + "44" }}
              >
                <BadgeCheck className="w-3 h-3" />
                Reliability tier: Proficient · 87%
              </div>

              {[
                {
                  title: "Distributed Architecture Report",
                  by: "Reviewer-Kestrel",
                  status: "Pending",
                  statusColor: "#f59e0b",
                  statusBg: "#fffbeb",
                  scores: [85, 75, 90],
                },
                {
                  title: "Cryptographic Security Audit",
                  by: "Reviewer-Onyx",
                  status: "Completed",
                  statusColor: "#059669",
                  statusBg: "#ecfdf5",
                  scores: [80, 88, 85],
                },
              ].map(({ title, by, status, statusColor, statusBg, scores }) => (
                <div
                  key={title}
                  className="rounded-xl border p-2.5 mb-2 flex gap-3"
                  style={{ borderColor: C.lightTint, backgroundColor: C.nearWhite }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold truncate font-display" style={{ color: C.darkText }}>
                        {title}
                      </p>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ color: statusColor, backgroundColor: statusBg }}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-[11px] mb-1.5" style={{ color: C.mutedText }}>
                      By {by}
                    </p>
                    <div className="flex gap-1">
                      {scores.map((s, i) => (
                        <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.lightTint }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${s}%`, backgroundColor: C.midTeal }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

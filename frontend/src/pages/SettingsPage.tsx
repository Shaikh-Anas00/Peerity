import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userApi, type DataRequestPayload } from "../api/userApi";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Laptop,
  Bell,
  Clock,
  KeyRound,
  ShieldAlert,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react";
import { ContentHeader, StatusPill } from "../components/ContentHeader";

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada) (UTC-05:00 / -04:00)" },
  { value: "America/Chicago", label: "Central Time (US & Canada) (UTC-06:00 / -05:00)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada) (UTC-07:00 / -06:00)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada) (UTC-08:00 / -07:00)" },
  { value: "Europe/London", label: "London, Dublin, Edinburgh (UTC+00:00 / +01:00)" },
  { value: "Europe/Paris", label: "Paris, Berlin, Amsterdam, Rome (UTC+01:00 / +02:00)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST) (UTC+05:30)" },
  { value: "Asia/Singapore", label: "Singapore Standard Time (SGT) (UTC+08:00)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST) (UTC+09:00)" },
  { value: "Australia/Sydney", label: "Sydney, Melbourne (AEST) (UTC+10:00 / +11:00)" },
];

export const SettingsPage: React.FC = () => {
  const { user, updateUserState } = useAuth();

  // ── Theme State: "light" | "dark" | "system" ──
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    try {
      const stored = localStorage.getItem("peerity_theme");
      if (stored === "dark" || stored === "light" || stored === "system") {
        return stored;
      }
      return "system";
    } catch {
      return "system";
    }
  });

  const applyTheme = (mode: "light" | "dark" | "system") => {
    try {
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else if (mode === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {}
  };

  useEffect(() => {
    applyTheme(themeMode);

    // If system theme is selected, listen for OS theme preference changes
    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [themeMode]);

  const handleThemeChange = (newMode: "light" | "dark" | "system") => {
    setThemeMode(newMode);
    try {
      localStorage.setItem("peerity_theme", newMode);
    } catch {}
    applyTheme(newMode);
  };

  // ── Notification & Timezone State ──
  const [notifyNewReview, setNotifyNewReview] = useState<boolean>(
    user?.notifyNewReview ?? true
  );
  const [notifyDeadlineApproaching, setNotifyDeadlineApproaching] = useState<boolean>(
    user?.notifyDeadlineApproaching ?? true
  );
  const [notifyDisputeStatusChange, setNotifyDisputeStatusChange] = useState<boolean>(
    user?.notifyDisputeStatusChange ?? true
  );
  const [timezone, setTimezone] = useState<string>(user?.timezone || "UTC");
  const [savingPreferences, setSavingPreferences] = useState(false);

  // ── Data Export / Deletion Modal State ──
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [requestAction, setRequestAction] = useState<"EXPORT" | "DELETION">("EXPORT");
  const [requestReason, setRequestReason] = useState("");
  const [submittingDataRequest, setSubmittingDataRequest] = useState(false);

  // ── Feedback Toast ──
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(
    null
  );

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync state if user prop changes
  useEffect(() => {
    if (user) {
      setNotifyNewReview(user.notifyNewReview ?? true);
      setNotifyDeadlineApproaching(user.notifyDeadlineApproaching ?? true);
      setNotifyDisputeStatusChange(user.notifyDisputeStatusChange ?? true);
      setTimezone(user.timezone || "UTC");
    }
  }, [user]);

  // Handle saving notification & timezone preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPreferences(true);
    try {
      const res = await userApi.updateSettings({
        notifyNewReview,
        notifyDeadlineApproaching,
        notifyDisputeStatusChange,
        timezone,
      });
      updateUserState(res.data);
      showToast("Notification and display preferences saved.", "success");
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Failed to update settings.",
        "error"
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  // Handle data action request (export or deletion)
  const handleSubmitDataRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDataRequest(true);
    try {
      const payload: DataRequestPayload = {
        actionType: requestAction,
        reason: requestReason.trim() || undefined,
      };
      const res = await userApi.requestDataAction(payload);
      updateUserState(res.data);
      setDataModalOpen(false);
      setRequestReason("");
      showToast(
        `Formal administrative request for ${
          requestAction === "EXPORT" ? "account data archive export" : "account deletion & decoupling"
        } filed successfully.`,
        "success"
      );
    } catch (err: any) {
      showToast(
        err.response?.data?.message || "Failed to submit data request.",
        "error"
      );
    } finally {
      setSubmittingDataRequest(false);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <ContentHeader
        breadcrumbs={["Account", "General Settings"]}
        title="Settings & Preferences"
        subtitle="Configure application theme, notification alerts, timezone, and security credentials."
        icon={SettingsIcon}
        statusPill={
          <StatusPill
            label={`THEME: ${themeMode.toUpperCase()}`}
            variant="brand"
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Main Preferences & Password Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Theme & Appearance (Dropdown Menu Selector) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                  {themeMode === "dark" ? (
                    <Moon className="w-5 h-5" />
                  ) : themeMode === "light" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                    Appearance & Theme
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose your interface color scheme.
                  </p>
                </div>
              </div>

              {/* Theme Dropdown Menu */}
              <div className="min-w-[180px]">
                <select
                  value={themeMode}
                  onChange={(e) =>
                    handleThemeChange(e.target.value as "light" | "dark" | "system")
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition"
                >
                  <option value="light">☀️ Light Theme</option>
                  <option value="dark">🌙 Dark Theme</option>
                  <option value="system">💻 System Default</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Notification Preferences & Timezone */}
          <form
            onSubmit={handleSavePreferences}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-teal-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                    Notifications & Localization
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preferences stored on your account profile.
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-display block">
                Notification Channels
              </label>

              {/* Item 1 */}
              <div className="flex items-start justify-between gap-4 p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
                    New Review Assignment
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Trigger an alert whenever an anonymous student artifact is assigned to your review queue.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyNewReview}
                  onChange={(e) => setNotifyNewReview(e.target.checked)}
                  className="w-4 h-4 mt-1 text-teal-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-teal-500 cursor-pointer"
                />
              </div>

              {/* Item 2 */}
              <div className="flex items-start justify-between gap-4 p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
                    Evaluation Deadline Approaching
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Receive a 24-hour reminder before calibration windows or peer review deadlines close.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDeadlineApproaching}
                  onChange={(e) => setNotifyDeadlineApproaching(e.target.checked)}
                  className="w-4 h-4 mt-1 text-teal-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-teal-500 cursor-pointer"
                />
              </div>

              {/* Item 3 */}
              <div className="flex items-start justify-between gap-4 p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
                    Dispute & Appeal Status Change
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Alert when a peer dispute receives quorum votes, status progression, or committee resolution.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDisputeStatusChange}
                  onChange={(e) => setNotifyDisputeStatusChange(e.target.checked)}
                  className="w-4 h-4 mt-1 text-teal-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-teal-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Timezone Preference */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
                Timezone Display Preference
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition cursor-pointer"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Deadlines, audit timestamps, and appeal submission logs will be rendered in this local timezone.
              </p>
            </div>

            {/* Save Preferences Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPreferences}
                className="flex items-center gap-1.5 px-4 py-2 bg-peerity-800 hover:bg-peerity-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition shadow-sm font-display disabled:opacity-50"
              >
                {savingPreferences ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Preferences
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 3. Security: Password Change Navigation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  Account Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your authentication password and login credentials.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                  Security Status: Configured (••••••••)
                </p>
              </div>
            </div>

            <Link
              to="/settings/change-password"
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs font-display flex-shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Change Password
            </Link>
          </div>
        </div>

        {/* Right Column (1 col): Account Rights & GDPR Governance */}
        <div className="space-y-6">
          {/* Data Rights & Administrative Requests */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/50">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  Account Data Rights
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">GDPR & Institutional Requests</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              In accordance with academic record-keeping standards and privacy policies, accounts are not automatically deleted instantly. Instead, requests file an administrative action for campus review.
            </p>

            {/* Existing Status Pill if request active */}
            {user.dataRequestStatus && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider font-display block">
                  Active Request Status
                </span>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mt-0.5">
                  {user.dataRequestStatus}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-1">
                  Your request is queued for review by the institutional system administrator.
                </p>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRequestAction("EXPORT");
                  setDataModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Request Data Archive Export
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequestAction("DELETION");
                  setDataModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 transition"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  Request Account Deletion
                </span>
                <span className="text-[10px] text-rose-400 dark:text-rose-500 font-mono">Admin Action</span>
              </button>
            </div>
          </div>

          {/* Privacy Architecture Reminder Card */}
          <div className="bg-teal-50/60 dark:bg-slate-800/60 rounded-2xl border border-teal-200/80 dark:border-slate-700/80 p-5 shadow-xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300 font-display">
              Privacy Architecture Note
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Peerity isolates all evaluations using double-blind pseudonyms and encrypted sidecars. Your personal identity is never accessible to peer reviewers during regular scoring.
            </p>
            <a
              href="/privacy"
              className="inline-block text-xs font-bold text-teal-800 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 underline mt-1"
            >
              Read Full Cryptography Policy &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* ── Modal for Data Export / Deletion Request ── */}
      {dataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  requestAction === "EXPORT"
                    ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-teal-400"
                    : "bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300"
                }`}
              >
                {requestAction === "EXPORT" ? (
                  <Download className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                  {requestAction === "EXPORT"
                    ? "Request Account Data Export"
                    : "Request Account Deletion"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Files an administrative ticket for campus processing
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {requestAction === "EXPORT"
                ? "This will submit a formal administrative request to compile all your personal profile records, review transcripts, and appeal logs into an encrypted JSON export archive."
                : "This files an administrative request to decouple and purge personal metadata. Note: Historical anonymous calibration data and cryptographically anchored ledger hashes are preserved to protect evaluation integrity."}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 font-display">
                Reason or Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="e.g. End of term transfer, privacy audit, personal backup..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDataModalOpen(false)}
                className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDataRequest}
                onClick={handleSubmitDataRequest}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition ${
                  requestAction === "EXPORT"
                    ? "bg-peerity-800 hover:bg-peerity-700 dark:bg-teal-600 dark:hover:bg-teal-500"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submittingDataRequest ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Filing Request...
                  </>
                ) : (
                  <>Submit Request</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

import React from "react";
import { Building, BookOpen, GraduationCap, ShieldCheck, Camera } from "lucide-react";
import { User } from "../../context/AuthContext";

export interface ProfileViewProps {
  user: User;
  onEditAvatar: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onEditAvatar }) => {
  return (
    <div className="space-y-6">
      {/* Main Profile Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-teal-400 text-3xl font-extrabold font-display shadow-sm">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <button
              onClick={onEditAvatar}
              title="Change avatar"
              className="absolute -bottom-2 -right-2 p-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display tracking-tight truncate">
                {user.fullName}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-teal-400 border border-slate-200 dark:border-slate-700 font-display">
                {user.role}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{user.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg">
                <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <strong>Institution:</strong> {user.institution || "Unset"}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <strong>Department:</strong> {user.department || "Unset"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Fields Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Required Enrollment Data */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">Required Registration Fields</h3>
          </div>
          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Full Legal Name</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{user.fullName || "—"}</p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Institution</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{user.institution || "—"}</p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Department</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{user.department || "—"}</p>
            </div>
          </div>
        </div>

        {/* Level 3 Progressive Disclosure: Academic Standing */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">Level 3 Disclosure: Academic Standing</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold rounded-md border border-purple-200 dark:border-purple-800/50 font-display">
              TIER 3 GATE
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Academic Standing / Cohort</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                {user.academicStanding || <span className="text-slate-400 dark:text-slate-500 italic">Not specified (optional)</span>}
              </p>
            </div>
            <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-xl text-purple-900 dark:text-purple-200 mt-3 leading-relaxed">
              <p className="text-[11px]">
                <strong>Privacy Boundary:</strong> Under Peerity's policy engine, this field corresponds to <code>DisclosureLevel.LEVEL_3_ACADEMIC_STANDING</code>. It remains strictly hidden during regular peer evaluations and is only unlocked if a committee quorum votes to approve Level 3 disclosure on an appeal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Legal Protection Notice */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display mb-1">
            Data Minimization Guarantee (Zero Legal Exposure)
          </h4>
          <p>
            In strict compliance with student privacy principles (COPPA/GDPR special-category guidelines), Peerity deliberately <strong>does not collect, store, or process</strong> age, gender, date of birth, phone numbers, or residential addresses. All evaluation operations rely strictly on cryptographic pseudonyms and isolated course metadata.
          </p>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { ShieldCheck, UserCheck, Building2, GraduationCap, Eye, Lock } from "lucide-react";

const TIERS = [
  { level: "LEVEL_0_ANONYMOUS", rank: 0, title: "Level 0: Anonymous", desc: "Reviewer pseudonym only", icon: Lock },
  { level: "LEVEL_1_ELIGIBILITY", rank: 1, title: "Level 1: Eligibility", desc: "Enrollment & course status", icon: UserCheck },
  { level: "LEVEL_2_INSTITUTION_DEPT", rank: 2, title: "Level 2: Institution & Dept", desc: "Institution & department", icon: Building2 },
  { level: "LEVEL_3_ACADEMIC_STANDING", rank: 3, title: "Level 3: Academic Standing", desc: "Year & review history", icon: GraduationCap },
  { level: "LEVEL_4_FULL_IDENTITY", rank: 4, title: "Level 4: Full Legal Identity", desc: "Full legal name & email", icon: Eye },
];

export interface ProgressiveDisclosureStepperProps {
  currentLevel?: string;
  isApproved?: boolean;
}

export const ProgressiveDisclosureStepper: React.FC<ProgressiveDisclosureStepperProps> = ({ currentLevel = "LEVEL_0_ANONYMOUS", isApproved = false }) => {
  const activeTier = TIERS.find(t => t.level === currentLevel) || TIERS[0];
  const activeRank = isApproved ? activeTier.rank : 0;
  return (
    <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-display">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Progressive Disclosure Stepper
        </span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border font-display ${
          isApproved
            ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
            : "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
        }`}>
          {isApproved ? `Unlocked: ${activeTier.title}` : "Level 0: Double-Blind Anonymous"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2 relative">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isUnlocked = tier.rank <= activeRank;
          const isTarget = tier.rank === activeTier.rank;
          return (
            <div key={tier.level} className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
              isUnlocked ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
              : isTarget && !isApproved ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
              : "bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-500"
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 ${
                isUnlocked ? "bg-emerald-600 text-white dark:bg-emerald-500"
                : isTarget && !isApproved ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] font-bold leading-tight line-clamp-1 font-display">{tier.title.split(":")[1]}</p>
              <p className="text-[9px] mt-0.5 opacity-80 leading-tight hidden sm:block font-body">{tier.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

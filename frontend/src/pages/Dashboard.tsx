import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ClipboardList,
  BookOpen,
  MessageSquare,
  Scale,
  BarChart3,
  Lock,
  Users,
  ShieldCheck,
  ChevronRight,
  Building2,
  GraduationCap,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Student",
  INSTRUCTOR: "Instructor",
  COMMITTEE: "Review Committee",
  ADMIN: "System Administrator",
};

const ROLE_COLORS: Record<string, string> = {
  STUDENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INSTRUCTOR: "bg-amber-50 text-amber-700 border-amber-200",
  COMMITTEE: "bg-purple-50 text-purple-700 border-purple-200",
  ADMIN: "bg-peerity-100 text-peerity-900 border-peerity-300",
};

interface NavCard {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;
  const isStudent = role === "STUDENT";
  const isInstructor = role === "INSTRUCTOR" || role === "ADMIN";
  const isCommittee = role === "COMMITTEE";
  const isAuditor = role === "ADMIN" || role === "COMMITTEE";

  const allCards: (NavCard & { roles: string[] })[] = [
    {
      to: "/assignments",
      icon: <ClipboardList className="w-5 h-5" />,
      title: "Assignments",
      description: isInstructor
        ? "Create assignments, set rubrics, and distribute submissions to reviewers."
        : "View active assignments and submit your work before the deadline.",
      accent: "text-blue-600 bg-blue-50 border-blue-200",
      roles: ["STUDENT", "INSTRUCTOR", "ADMIN", "COMMITTEE"],
    },
    {
      to: "/reviews",
      icon: <BookOpen className="w-5 h-5" />,
      title: "My Reviews",
      description: "Score assigned peer submissions using the rubric and submit written feedback.",
      accent: "text-orange-600 bg-orange-50 border-orange-200",
      roles: ["STUDENT"],
    },
    {
      to: "/feedback",
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Feedback Received",
      description: "Review feedback on your work, rate reviewer helpfulness, and file disputes.",
      accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
      roles: ["STUDENT"],
    },
    {
      to: "/appeals",
      icon: <Scale className="w-5 h-5" />,
      title: isCommittee ? "Quorum Adjudication" : "Disputes",
      description: isCommittee
        ? "Cast quorum votes on pending disclosure requests and adjudicate appeals."
        : isInstructor
        ? "Review open appeals and monitor disclosure tier decisions."
        : "File and track disputes against completed peer reviews.",
      accent: "text-amber-600 bg-amber-50 border-amber-200",
      roles: ["STUDENT", "INSTRUCTOR", "ADMIN", "COMMITTEE"],
    },
    {
      to: "/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Analytics",
      description: "Monitor review completion rates, score distributions, and dispute governance metrics.",
      accent: "text-peerity-800 bg-peerity-100 border-peerity-300",
      roles: ["INSTRUCTOR", "ADMIN"],
    },
    {
      to: "/groups",
      icon: <Users className="w-5 h-5" />,
      title: "Study Groups",
      description: "Collaborate with peers, submit group join requests, and complete teammate peer evaluations.",
      accent: "text-indigo-600 bg-indigo-50 border-indigo-200",
      roles: ["STUDENT"],
    },
    {
      to: "/groups/manage",
      icon: <Users className="w-5 h-5" />,
      title: "Manage Groups",
      description: "Form study groups, review join requests, and oversee intra-group peer ratings.",
      accent: "text-teal-600 bg-teal-50 border-teal-200",
      roles: ["INSTRUCTOR", "ADMIN"],
    },
    {
      to: "/admin/audit",
      icon: <Lock className="w-5 h-5" />,
      title: "Audit Ledger",
      description: "Inspect the HMAC-SHA-256 hash-chained tamper-evident event log and verify chain integrity.",
      accent: "text-purple-600 bg-purple-50 border-purple-200",
      roles: ["ADMIN", "COMMITTEE"],
    },
    {
      to: "/admin/diagnostics",
      icon: <Users className="w-5 h-5" />,
      title: "Diagnostics",
      description: "Internal system health checks: RBAC endpoint testing and PHP sidecar connectivity.",
      accent: "text-slate-600 bg-slate-50 border-slate-200",
      roles: ["ADMIN"],
    },
  ];

  const visibleCards = allCards.filter((c) => c.roles.includes(role));

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-8">
      {/* Welcome header */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{greeting()},</p>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">
              {user.fullName}
            </h1>
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  ROLE_COLORS[role] || "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {ROLE_LABELS[role] || role}
              </span>
              {user.institution && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {user.institution}
                </span>
              )}
              {user.department && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {user.department}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Protocol status banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-peerity-100/70 border border-peerity-200 rounded-xl flex items-start gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-peerity-800 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-peerity-900 font-display">Double-blind Privacy Active</p>
            <p className="text-xs text-peerity-900/80 mt-0.5 leading-relaxed font-body">
              Pseudonymized reviewer identities protect unbiased grading across all evaluations.
            </p>
          </div>
        </div>
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-3 shadow-xs">
          <Lock className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-900 font-display">Cryptographic Audit Chain</p>
            <p className="text-xs text-purple-800/80 mt-0.5 leading-relaxed font-body">
              Append-only HMAC-SHA-256 verifiable logs ensure zero tampering and complete accountability.
            </p>
          </div>
        </div>
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 shadow-xs">
          <Scale className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 font-display">Quorum Governance Ready</p>
            <p className="text-xs text-amber-800/80 mt-0.5 leading-relaxed font-body">
              Progressive disclosure and dispute resolution require threshold committee consensus.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation cards */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-display">
          Your workspace
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-peerity-300 transition-all flex items-start gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${card.accent}`}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 font-display group-hover:text-peerity-800 transition-colors">{card.title}</p>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-peerity-800 group-hover:translate-x-0.5 flex-shrink-0 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

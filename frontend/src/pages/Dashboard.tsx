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
  if (!user) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-8 animate-pulse">
        {/* Welcome header skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-64" />
          <div className="flex gap-2 pt-1">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-24" />
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-36" />
          </div>
        </div>
        {/* Workspace cards skeleton */}
        <div className="space-y-4">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-28" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
      accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/80",
      roles: ["STUDENT", "INSTRUCTOR", "ADMIN", "COMMITTEE"],
    },
    {
      to: "/classrooms",
      icon: <GraduationCap className="w-5 h-5" />,
      title: "Classrooms",
      description: isInstructor
        ? "Create isolated course rooms, manage join codes, view student rosters, and run scoped peer reviews."
        : "Join course rooms via 6-character code and collaborate with enrolled classmates.",
      accent: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800/80",
      roles: ["STUDENT", "INSTRUCTOR", "ADMIN"],
    },
    {
      to: "/reviews",
      icon: <BookOpen className="w-5 h-5" />,
      title: "My Reviews",
      description: "Score assigned peer submissions using the rubric and submit written feedback.",
      accent: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800/80",
      roles: ["STUDENT"],
    },
    {
      to: "/feedback",
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Feedback Received",
      description: "Review feedback on your work, rate reviewer helpfulness, and file disputes.",
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80",
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
      accent: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80",
      roles: ["STUDENT", "INSTRUCTOR", "ADMIN", "COMMITTEE"],
    },
    {
      to: "/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Analytics",
      description: "Monitor review completion rates, score distributions, and dispute governance metrics.",
      accent: "text-peerity-800 dark:text-teal-400 bg-peerity-100 dark:bg-teal-950/50 border-peerity-300 dark:border-teal-800/80",
      roles: ["INSTRUCTOR", "ADMIN"],
    },
    {
      to: "/groups",
      icon: <Users className="w-5 h-5" />,
      title: "Study Groups",
      description: "Collaborate with peers, submit group join requests, and complete teammate peer evaluations.",
      accent: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/80",
      roles: ["STUDENT"],
    },
    {
      to: "/groups/manage",
      icon: <Users className="w-5 h-5" />,
      title: "Manage Groups",
      description: "Form study groups, review join requests, and oversee intra-group peer ratings.",
      accent: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800/80",
      roles: ["INSTRUCTOR", "ADMIN"],
    },
    {
      to: "/admin/audit",
      icon: <Lock className="w-5 h-5" />,
      title: "Audit Ledger",
      description: "Inspect the HMAC-SHA-256 hash-chained tamper-evident event log and verify chain integrity.",
      accent: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/80",
      roles: ["ADMIN", "COMMITTEE"],
    },
    {
      to: "/admin/diagnostics",
      icon: <Users className="w-5 h-5" />,
      title: "Diagnostics",
      description: "Internal system health checks: RBAC endpoint testing and cryptographic verification.",
      accent: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
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
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{greeting()},</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              {user.fullName}
            </h1>
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  ROLE_COLORS[role] || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {ROLE_LABELS[role] || role}
              </span>
              {user.institution && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {user.institution}
                </span>
              )}
              {user.department && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {user.department}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation cards */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 font-display">
          Your workspace
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-peerity-300 dark:hover:border-teal-700 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 flex items-start gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${card.accent}`}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display group-hover:text-peerity-800 dark:group-hover:text-teal-400 transition-colors">{card.title}</p>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-peerity-800 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 flex-shrink-0 transition-all" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

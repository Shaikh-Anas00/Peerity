import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth, type Role } from "../context/AuthContext";
import {
  ShieldCheck,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  MessageSquare,
  Scale,
  BarChart3,
  Lock,
  LogOut,
  Settings,
  Users,
  UsersRound,
  Pin,
  UserCircle,
  Activity,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Omit to show to every authenticated role. */
  roles?: Role[];
  /** Match the path exactly, so a parent route is not active on its child (e.g. /groups vs /groups/manage). */
  end?: boolean;
}

/**
 * Single source of truth for navigation. Visibility mirrors the route guards in
 * App.tsx — this only controls what is shown; the guards remain the enforcement.
 */
const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/reviews", label: "My Reviews", icon: BookOpen, roles: ["STUDENT"] },
  { to: "/feedback", label: "Feedback", icon: MessageSquare, roles: ["STUDENT"] },
  { to: "/appeals", label: "Disputes", icon: Scale, roles: ["STUDENT", "INSTRUCTOR", "ADMIN"] },
  { to: "/appeals", label: "Quorum Votes", icon: Scale, roles: ["COMMITTEE"] },
  { to: "/groups", label: "Groups", icon: Users, end: true },
  { to: "/groups/manage", label: "Manage Groups", icon: UsersRound, roles: ["INSTRUCTOR", "ADMIN"] },
  { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["INSTRUCTOR", "ADMIN"] },
  { to: "/admin/audit", label: "Audit Ledger", icon: Lock, roles: ["ADMIN", "COMMITTEE"] },
  { to: "/admin/diagnostics", label: "Diagnostics", icon: Activity, roles: ["ADMIN"] },
  { to: "/profile", label: "My Profile", icon: UserCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

export interface SidebarProps {
  /** Called after a nav link or sign-out is used — lets the mobile drawer close itself. */
  onNavigate?: () => void;
  /** Whether the sidebar is permanently pinned in expanded state. */
  isPinned?: boolean;
  /** Callback to toggle the pinned state. */
  onTogglePin?: () => void;
  /** Whether the sidebar is currently in expanded visual state (shows text labels). */
  isExpanded?: boolean;
  /** Whether the device is a touch-based screen (no hover). */
  isTouch?: boolean;
  /** Whether this instance is rendered inside the mobile drawer modal. */
  isMobileDrawer?: boolean;
  /** Callback for touch devices to toggle expansion on tapping header or rail. */
  onToggleTouchExpand?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNavigate,
  isPinned = false,
  onTogglePin,
  isExpanded = true,
  isTouch = false,
  isMobileDrawer = false,
  onToggleTouchExpand,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    navigate("/login");
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    if (isTouch && !isMobileDrawer && onToggleTouchExpand) {
      // On touch devices without hover, clicking header toggles the sidebar expansion
      onToggleTouchExpand();
    } else {
      onNavigate?.();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-body select-none overflow-hidden">
      {/* ── Logo & Pin Header ─────────────────────────────────────────── */}
      {isExpanded ? (
        <div className="flex items-center justify-between px-4 h-16 flex-shrink-0 border-b border-slate-100">
          <Link
            to="/dashboard"
            onClick={handleHeaderClick}
            className="flex items-center gap-2.5 min-w-0"
            title="Peerity Dashboard"
          >
            <div className="w-8 h-8 bg-peerity-800 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5 text-white" strokeWidth={2.25} />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight font-display truncate">
              Peerity
            </span>
          </Link>

          {!isMobileDrawer && onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              title={isPinned ? "Unpin sidebar (collapse to icon rail)" : "Pin sidebar permanently open"}
              aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                isPinned
                  ? "text-peerity-800 bg-peerity-100 hover:bg-peerity-200"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Pin
                className={`w-4 h-4 transition-transform ${
                  isPinned ? "fill-peerity-800 text-peerity-800 -rotate-45" : "text-slate-500"
                }`}
              />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-16 flex-shrink-0 border-b border-slate-100">
          <button
            type="button"
            onClick={handleHeaderClick}
            title={isTouch ? "Tap to open navigation" : "Peerity Dashboard (hover to expand)"}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-50 transition"
          >
            <div className="w-8 h-8 bg-peerity-800 rounded-lg flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5 text-white" strokeWidth={2.25} />
            </div>
          </button>
        </div>
      )}

      {/* ── Navigation Items ──────────────────────────────────────────── */}
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1 ${
          isExpanded ? "px-3 py-4" : "px-2 py-3"
        }`}
        aria-label="Main navigation"
      >
        {items.map(({ to, label, icon: Icon, end }) => {
          if (!isExpanded) {
            // Collapsed: centered icon-only rail button with tooltip
            return (
              <NavLink
                key={`${to}-${label}`}
                to={to}
                end={end}
                onClick={onNavigate}
                title={label}
                className={({ isActive }) =>
                  `w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-150 relative group ${
                    isActive
                      ? "bg-peerity-100 text-peerity-800 font-semibold shadow-2xs ring-1 ring-peerity-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="w-[19px] h-[19px] flex-shrink-0" strokeWidth={1.9} />
              </NavLink>
            );
          }

          // Expanded: full row with icon and label
          return (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors font-display ${
                  isActive
                    ? "bg-peerity-100 text-peerity-800 font-semibold"
                    : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.9} />
              <span className="truncate whitespace-nowrap">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── User Profile & Sign Out Footer ────────────────────────────── */}
      {isExpanded ? (
        <div className="flex-shrink-0 border-t border-slate-100 p-3">
          <Link
            to="/profile"
            onClick={onNavigate}
            title="View Profile"
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-100 transition group"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-9 h-9 rounded-full object-cover border border-peerity-200 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-peerity-100 text-peerity-800 flex items-center justify-center text-sm font-bold font-display flex-shrink-0">
                {user.fullName?.charAt(0).toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate font-display group-hover:text-peerity-800 transition-colors">
                {user.fullName}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-display">
                {user.role}
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors font-display"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.9} />
            <span className="whitespace-nowrap">Sign out</span>
          </button>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-slate-100 py-3 px-1 flex flex-col items-center gap-2">
          <Link
            to="/profile"
            onClick={onNavigate}
            className="w-9 h-9 rounded-full bg-peerity-100 text-peerity-800 flex items-center justify-center text-xs font-bold font-display shadow-2xs hover:ring-2 hover:ring-peerity-600 transition overflow-hidden"
            title={`${user.fullName} (${user.role}) - View Profile`}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.fullName?.charAt(0).toUpperCase() ?? "?"
            )}
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.9} />
          </button>
        </div>
      )}
    </div>
  );
};

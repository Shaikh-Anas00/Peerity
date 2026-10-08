import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, ShieldCheck, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth, type Role } from "../context/AuthContext";

/**
 * Authenticated app shell: collapsible icon-rail sidebar + main content area.
 * Wraps every authenticated route and applies the role guard to the routed page.
 *
 * Layout features:
 * - Collapsed by default to a narrow icon-only rail (w-[68px]) to give full horizontal
 *   real-estate to pages (especially side-by-side document review).
 * - Expands on hover with a ~180ms debounce delay to avoid accidental flicker.
 * - Collapses on mouse leave with a ~180ms delay.
 * - Pin/unpin toggle button at top of expanded rail persisted in localStorage & local state.
 * - Touch/tablet fallback: tap-to-toggle rail without hover dependency.
 * - Mobile (< md): slim top header bar + full slide-over drawer.
 */
export const AppLayout: React.FC<{ requiredRoles?: Role[] }> = ({ requiredRoles }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Persistence for user's pinned sidebar preference in local storage
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem("peerity_sidebar_pinned") === "true";
    } catch {
      return false;
    }
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isTouchExpanded, setIsTouchExpanded] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // Detect touch devices (no hover capability)
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        window.matchMedia("(hover: none)").matches ||
        window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window;
      setIsTouch(hasTouch);
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  // Timers for hover expand / collapse delays (~180ms debounce)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (isTouch) return;
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (!isHovered && !enterTimerRef.current) {
      enterTimerRef.current = setTimeout(() => {
        setIsHovered(true);
        enterTimerRef.current = null;
      }, 180);
    }
  };

  const handleMouseLeave = () => {
    if (isTouch) return;
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (!isPinned && !leaveTimerRef.current) {
      leaveTimerRef.current = setTimeout(() => {
        setIsHovered(false);
        leaveTimerRef.current = null;
      }, 180);
    }
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Close the mobile drawer and touch expansion on any navigation
  useEffect(() => {
    setDrawerOpen(false);
    setIsTouchExpanded(false);
  }, [location.pathname]);

  // Escape key closes mobile drawer, touch expansion, or unpinned hover
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setIsTouchExpanded(false);
        if (!isPinned) setIsHovered(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPinned]);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("peerity_sidebar_pinned", String(next));
      } catch {}
      return next;
    });
  };

  // No session yet (loading) or not signed in: render the guard alone
  if (!user) return <ProtectedRoute requiredRoles={requiredRoles} />;

  const isDesktopExpanded = isPinned || (isTouch ? isTouchExpanded : isHovered);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* ── Desktop: Collapsible Icon-Rail Sidebar ───────────────────── */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden md:block flex-shrink-0 relative z-40 transition-[width] duration-200 ease-in-out border-r border-slate-200 bg-white overflow-hidden ${
          isDesktopExpanded ? "w-64" : "w-[68px]"
        }`}
      >
        <div className="w-full h-full">
          <Sidebar
            isPinned={isPinned}
            onTogglePin={togglePin}
            isExpanded={isDesktopExpanded}
            isTouch={isTouch}
            onToggleTouchExpand={() => setIsTouchExpanded((prev) => !prev)}
            onNavigate={() => {
              if (isTouch && isTouchExpanded) {
                setIsTouchExpanded(false);
              }
            }}
          />
        </div>
      </aside>

      {/* Touch Backdrop when expanded on tablet/touch viewport */}
      {isTouch && isTouchExpanded && !isPinned && (
        <div
          className="hidden md:block fixed inset-0 bg-slate-900/20 z-30 transition-opacity"
          onClick={() => setIsTouchExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: Slim top bar + drawer (< md) ────────────────────── */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 flex-shrink-0 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-peerity-800 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.25} />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight font-display">
            Peerity
          </span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80vw] h-full shadow-xl">
            <Sidebar
              isMobileDrawer={true}
              isExpanded={true}
              onNavigate={() => setDrawerOpen(false)}
            />
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}

      {/* ── Main content: fills remaining width and height ──────────── */}
      <main className="flex-1 min-h-0 min-w-0 overflow-y-auto">
        <ProtectedRoute requiredRoles={requiredRoles} />
      </main>
    </div>
  );
};

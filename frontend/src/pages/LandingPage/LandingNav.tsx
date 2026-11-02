import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { C } from "./tokens";

export const LandingNav: React.FC = () => {
  const { user } = useAuth();
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className="landing-header fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        borderColor: C.lightTint,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        backgroundColor: "rgba(254,255,255,0.92)",
      } as React.CSSProperties}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: C.darkTeal }}
          >
            <ShieldCheck className="w-4.5 h-4.5 text-white" strokeWidth={2} />
          </div>
          <span
            className="text-lg font-semibold tracking-tight font-display"
            style={{ color: C.darkTeal }}
          >
            Peerity
          </span>
        </Link>

        {/* Anchor links (desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: "Features",    id: "features"     },
            { label: "How it works",id: "how-it-works" },
            { label: "Security",    id: "security"     },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-sm font-medium transition-colors"
              style={{ color: C.mutedText }}
              onMouseEnter={e => (e.currentTarget.style.color = C.darkTeal)}
              onMouseLeave={e => (e.currentTarget.style.color = C.mutedText)}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Auth CTA */}
        {user ? (
          <Link
            to="/dashboard"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
            style={{
              backgroundColor: C.darkTeal,
              color: "#fff",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = C.midTeal)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = C.darkTeal)}
          >
            Go to Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            to="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: C.darkTeal,
              color: "#fff",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = C.midTeal)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = C.darkTeal)}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

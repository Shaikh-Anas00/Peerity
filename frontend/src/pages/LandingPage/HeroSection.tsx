import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, Users, Lock, BadgeCheck, ArrowRight, ChevronRight } from "lucide-react";
import { C } from "./tokens";
import { ProductMockup } from "./ProductMockup";

export const HeroSection: React.FC = () => {
  const { user } = useAuth();

  return (
  <section
    aria-labelledby="hero-heading"
    className="min-h-screen flex flex-col justify-center pt-16"
    style={{ backgroundColor: C.nearWhite }}
  >
    <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Copy */}
        <div>
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-6 px-3 py-1.5 rounded-full border"
            style={{ color: C.darkTeal, backgroundColor: C.lightTint, borderColor: C.midTeal + "40" }}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Double-blind peer review with accountable disclosure
          </div>

          <h1
            id="hero-heading"
            className="text-4xl md:text-5xl lg:text-[52px] font-bold font-display leading-[1.1] tracking-tight mb-6"
            style={{ color: C.darkText }}
          >
            Peer review that is{" "}
            <span style={{ color: C.darkTeal }}>blind by design,</span>{" "}
            fair by evidence.
          </h1>

          <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: C.bodyText }}>
            Peerity gives academic institutions double-blind peer review with
            built-in reviewer calibration, quorum-governed dispute resolution,
            and a tamper-evident cryptographic audit trail — so every grade is defensible and
            every review is accountable.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all"
              style={{ backgroundColor: C.darkTeal, color: "#fff" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = C.midTeal;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = C.darkTeal;
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {user ? "Go to Dashboard" : "Sign in to your institution"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: C.darkTeal }}
            >
              See how it works
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trust signals */}
          <div className="mt-10 flex items-center gap-6 flex-wrap">
            {[
              { icon: <Lock className="w-4 h-4" />, text: "AES-256-GCM storage" },
              { icon: <Users className="w-4 h-4" />, text: "Quorum-governed disputes" },
              { icon: <BadgeCheck className="w-4 h-4" />, text: "HMAC-SHA-256 audit ledger" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.mutedText }}>
                <span style={{ color: C.midTeal }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Product mockup */}
        <div className="relative">
          {/* Decorative background blob */}
          <div
            className="absolute -inset-4 rounded-3xl -z-10"
            style={{ backgroundColor: C.lightTint, opacity: 0.6 }}
          />
          <ProductMockup />
        </div>
      </div>
    </div>
  </section>
  );
};

/**
 * LandingPage.tsx — Peerity public marketing page
 *
 * Entirely standalone: no auth context, no authenticated-app imports.
 * Served at the root route "/" and visible to unauthenticated visitors.
 *
 * Sections (in DOM order):
 *   1. LandingNav        — logo + "Sign In" button
 *   2. HeroSection       — headline + CTA + product mockup panel
 *   3. FeaturesSection   — 3-card feature grid (anchor: #features)
 *   4. HowItWorksSection — 4-step flow (anchor: #how-it-works)
 *   5. SecuritySection   — encryption + multi-party disclosure (anchor: #security)
 *   6. LandingFooter     — minimal footer
 */

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck,
  Users,
  BarChart3,
  CheckCircle2,
  FileText,
  Star,
  MessageSquare,
  Scale,
  Lock,
  Key,
  Layers,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  BadgeCheck,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Design tokens (mirrors tailwind.config.js peerity.* palette)              */
/* ─────────────────────────────────────────────────────────────────────────── */
const C = {
  darkTeal:   "#2B7A78",
  midTeal:    "#3AAFA9",
  lightTint:  "#DEF2F1",
  nearWhite:  "#FEFFFF",
  darkText:   "#1d5553",
  bodyText:   "#374151",  /* slate-700 equivalent */
  mutedText:  "#6B7280",  /* slate-500 equivalent */
  border:     "#d1fae5",  /* subtle teal border */
  borderStrong: "#a7f3d0",
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  1. Navigation                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
const LandingNav: React.FC = () => {
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

/* ─────────────────────────────────────────────────────────────────────────── */
/*  In-product mockup panel (faithful replica of the app's dashboard/review   */
/*  UI — replace the inner <img> tag once screenshots are available)           */
/* ─────────────────────────────────────────────────────────────────────────── */
const ProductMockup: React.FC = () => {
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

/* ─────────────────────────────────────────────────────────────────────────── */
/*  2. Hero                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */
const HeroSection: React.FC = () => {
  const { user } = useAuth();

  return (
  <section
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

/* ─────────────────────────────────────────────────────────────────────────── */
/*  3. Features grid                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  detail: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, body, detail }) => (
  <div
    className="rounded-2xl border p-7 flex flex-col gap-4 transition-shadow hover:shadow-md"
    style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = C.midTeal + "80")}
    onMouseLeave={e => (e.currentTarget.style.borderColor = C.lightTint)}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: C.lightTint }}
    >
      <span style={{ color: C.darkTeal }}>{icon}</span>
    </div>
    <div>
      <h3 className="text-base font-semibold font-display mb-2" style={{ color: C.darkText }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed mb-4" style={{ color: C.bodyText }}>
        {body}
      </p>
      <ul className="flex flex-col gap-2">
        {detail.map(d => (
          <li key={d} className="flex items-start gap-2 text-xs" style={{ color: C.mutedText }}>
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: C.midTeal }} />
            {d}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const FeaturesSection: React.FC = () => (
  <section
    id="features"
    className="py-24"
    style={{ backgroundColor: C.lightTint }}
  >
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-14">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.midTeal }}>
          Platform capabilities
        </p>
        <h2 className="text-3xl md:text-4xl font-bold font-display mb-4" style={{ color: C.darkText }}>
          Everything accountability requires
        </h2>
        <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: C.bodyText }}>
          Four interlocking systems that make peer evaluation defensible — not just efficient.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          icon={<ShieldCheck className="w-5.5 h-5.5" strokeWidth={1.75} />}
          title="Double-Blind Review"
          body="Authors and reviewers interact pseudonymously throughout the evaluation cycle. Stable identifiers prevent bias without preventing accountable dispute adjudication."
          detail={[
            "System-generated reviewer pseudonyms per assignment",
            "Real identities withheld from peer views by default",
            "Tiered progressive disclosure requires committee quorum",
          ]}
        />
        <FeatureCard
          icon={<BarChart3 className="w-5.5 h-5.5" strokeWidth={1.75} />}
          title="Reviewer Calibration"
          body="Before reviewing peers, each student scores instructor-provided samples against a known answer key. The resulting reliability score weights or flags suspect reviews."
          detail={[
            "Calibration samples scored before review access",
            "Per-student reliability tier (Expert → Developing)",
            "Calibration history available to dispute committees",
          ]}
        />
        <FeatureCard
          icon={<Scale className="w-5.5 h-5.5" strokeWidth={1.75} />}
          title="Quorum-Governed Disputes"
          body="Appeals trigger a structured committee review with quorum voting, sealed ballots, mandatory recusal for conflicted members, and progressive identity disclosure."
          detail={[
            "Appellant and under-review reviewer auto-recused",
            "Votes sealed until quorum is reached",
            "Disclosure level gated by committee approval",
          ]}
        />
        <FeatureCard
          icon={<Users className="w-5.5 h-5.5" strokeWidth={1.75} />}
          title="Group Accountability"
          body="Group member evaluation surfaces contribution differences to instructors while keeping individual peer scores private from teammates."
          detail={[
            "Confidential multi-criteria peer evaluation for team projects",
            "Individual ratings kept strictly confidential from teammates",
            "Instructors receive full attribution to assess individual effort",
          ]}
        />
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  4. How it Works                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */
interface StepProps {
  index: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  isLast?: boolean;
}

const Step: React.FC<StepProps> = ({ index, icon, title, body, isLast }) => (
  <div className="flex flex-col items-center text-center relative flex-1">
    {/* Connector line (between steps) */}
    {!isLast && (
      <div
        className="absolute top-6 left-1/2 w-full h-px hidden md:block"
        style={{ backgroundColor: C.midTeal + "40", transform: "translateX(50%)" }}
      />
    )}
    {/* Step circle */}
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center mb-4 border-2 relative z-10"
      style={{ backgroundColor: C.nearWhite, borderColor: C.darkTeal }}
    >
      <span style={{ color: C.darkTeal }}>{icon}</span>
    </div>
    <div
      className="text-xs font-bold uppercase tracking-widest mb-1"
      style={{ color: C.midTeal }}
    >
      Step {index}
    </div>
    <h4 className="text-sm font-semibold font-display mb-1" style={{ color: C.darkText }}>
      {title}
    </h4>
    <p className="text-xs leading-relaxed max-w-[160px]" style={{ color: C.mutedText }}>
      {body}
    </p>
  </div>
);

const HowItWorksSection: React.FC = () => (
  <section id="how-it-works" className="py-24" style={{ backgroundColor: C.nearWhite }}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-14">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.midTeal }}>
          Workflow
        </p>
        <h2 className="text-3xl md:text-4xl font-bold font-display mb-4" style={{ color: C.darkText }}>
          From submission to resolution
        </h2>
        <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: C.bodyText }}>
          Four structured stages, each with its own accountability check.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-10 md:gap-4 items-start justify-between">
        <Step
          index={1}
          icon={<FileText className="w-5 h-5" strokeWidth={1.75} />}
          title="Submit"
          body="Students submit work. Files are encrypted at rest with AES-256-GCM before storage."
        />
        <Step
          index={2}
          icon={<Star className="w-5 h-5" strokeWidth={1.75} />}
          title="Calibrate & Review"
          body="Reviewers first score a calibration sample, then receive pseudonymous peer submissions."
        />
        <Step
          index={3}
          icon={<MessageSquare className="w-5 h-5" strokeWidth={1.75} />}
          title="Rate Feedback"
          body="Authors rate the helpfulness of each review. Ratings roll into the reviewer's quality score."
        />
        <Step
          index={4}
          icon={<Scale className="w-5 h-5" strokeWidth={1.75} />}
          title="Dispute"
          body="Contested reviews trigger quorum voting. Sealed ballots and mandatory recusal protect fairness."
          isLast
        />
      </div>

      {/* Divider pill */}
      <div className="flex items-center justify-center gap-2 mt-14">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-1 rounded-full" style={{ width: i === 0 || i === 3 ? 8 : 24, backgroundColor: C.midTeal, opacity: i === 0 || i === 3 ? 0.3 : 1 }} />
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  5. Security & Trust                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
interface TrustCardProps {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const TrustCard: React.FC<TrustCardProps> = ({ icon, title, body }) => (
  <div
    className="rounded-2xl border p-6 flex gap-4"
    style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
      style={{ backgroundColor: C.lightTint }}
    >
      <span style={{ color: C.darkTeal }}>{icon}</span>
    </div>
    <div>
      <h4 className="text-sm font-semibold font-display mb-1.5" style={{ color: C.darkText }}>
        {title}
      </h4>
      <p className="text-sm leading-relaxed" style={{ color: C.bodyText }}>
        {body}
      </p>
    </div>
  </div>
);

const SecuritySection: React.FC = () => (
  <section
    id="security"
    className="py-24 border-t"
    style={{ backgroundColor: C.lightTint, borderColor: C.midTeal + "30" }}
  >
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left: copy */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.midTeal }}>
            Trust architecture
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-5" style={{ color: C.darkText }}>
            Security that is<br />
            <span style={{ color: C.darkTeal }}>auditable, not assumed.</span>
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: C.bodyText }}>
            Every action in Peerity — submission, review, vote, disclosure — is recorded in an
            append-only cryptographic ledger. The hash chain is mathematically verifiable
            on demand by authorized committee members and administrators.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: C.mutedText }}>
            Reviewer identities are pseudonymised by default. Progressive disclosure
            strictly requires a verified quorum vote under policy constraints — there is no
            unilateral bypass mechanism, even for system administrators.
          </p>

          {/* Hash chain verification mockup — explicitly illustrative */}
          <div
            className="mt-8 rounded-xl border overflow-hidden font-mono text-xs"
            style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
          >
            {/* Window header bar */}
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between text-[11px]"
              style={{ backgroundColor: C.lightTint + "55", borderColor: C.lightTint }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.midTeal }} />
                <span className="font-semibold" style={{ color: C.darkText }}>
                  Audit Ledger Verification
                </span>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
                style={{ backgroundColor: C.lightTint, color: C.darkTeal }}
              >
                Sample Schema · Gated API
              </span>
            </div>

            {/* Static illustrative JSON response matching IntegrityVerificationResult DTO */}
            <div className="p-4 leading-6" style={{ color: C.mutedText }}>
              <div className="text-[11px] mb-2" style={{ color: C.midTeal }}>
                // Illustrative response structure (GET /api/audit/verify)
              </div>
              <span style={{ color: "#64748b" }}>{"{"}</span><br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"isValid"</span>: <span style={{ color: "#059669" }}>true</span>,<br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"totalRecords"</span>: <span style={{ color: "#0ea5e9" }}>1842</span>,<br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"brokenSequenceAt"</span>: <span style={{ color: "#64748b" }}>null</span>,<br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"verifiedAt"</span>: <span style={{ color: "#d97706" }}>"2026-10-01T12:00:00Z"</span>,<br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"message"</span>: <span style={{ color: "#059669" }}>"Cryptographic hash chain is intact from genesis."</span><br />
              <span style={{ color: "#64748b" }}>{"}"}</span>
            </div>

            {/* Footnote clarification */}
            <div
              className="px-4 py-2 border-t text-[11px] leading-relaxed"
              style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint, color: C.mutedText }}
            >
              Illustrative schema preview. Verification endpoints require active COMMITTEE or ADMIN authentication and are not publicly exposed.
            </div>
          </div>
        </div>

        {/* Right: trust cards */}
        <div className="flex flex-col gap-4">
          <TrustCard
            icon={<Lock className="w-5 h-5" strokeWidth={1.75} />}
            title="AES-256-GCM file encryption"
            body="Student submissions are encrypted at rest using AES-256-GCM before filesystem persistence. Files remain encrypted on disk and require authorized user authentication for streaming retrieval."
          />
          <TrustCard
            icon={<Key className="w-5 h-5" strokeWidth={1.75} />}
            title="HMAC-SHA-256 audit ledger"
            body="Critical lifecycle events (submission, review, vote, disclosure) append to a keyed HMAC-SHA-256 hash chain. Any out-of-band record tampering invalidates downstream sequence hashes, making alterations detectable upon verification."
          />
          <TrustCard
            icon={<Layers className="w-5 h-5" strokeWidth={1.75} />}
            title="Multi-party disclosure approval"
            body="Revealing reviewer identity requires a threshold quorum vote from independent committee members. Administrators serve as operational custodians without voting authority and cannot unilaterally force disclosure."
          />
          <TrustCard
            icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
            title="Mandatory recusal enforcement"
            body="The quorum service actively validates voter identity against both the appellant and the appealed reviewer, enforcing conflict-of-interest recusal at the transactional service layer."
          />
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  6. Footer                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
const LandingFooter: React.FC = () => (
  <footer
    className="border-t py-10"
    style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
  >
    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: C.darkTeal }}>
          <ShieldCheck className="w-3.5 h-3.5 text-white" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold font-display" style={{ color: C.darkTeal }}>
          Peerity
        </span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-6">
        {["Privacy policy", "Terms of use", "Security"].map(label => (
          <span
            key={label}
            className="text-xs cursor-default"
            style={{ color: C.mutedText }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Copyright */}
      <p className="text-xs" style={{ color: C.mutedText }}>
        &copy; {new Date().getFullYear()} Peerity. Academic use only.
      </p>
    </div>
  </footer>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Root export                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  return (
    <div className="landing-page min-h-screen" style={{ backgroundColor: C.nearWhite, scrollBehavior: "smooth" }}>
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;

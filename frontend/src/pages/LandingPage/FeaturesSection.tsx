import React from "react";
import { ShieldCheck, BarChart3, CheckCircle2, Scale, Users } from "lucide-react";
import { C } from "./tokens";

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

export const FeaturesSection: React.FC = () => (
  <section
    id="features"
    aria-labelledby="features-heading"
    className="py-24"
    style={{ backgroundColor: C.lightTint }}
  >
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-14">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.midTeal }}>
          Platform capabilities
        </p>
        <h2 id="features-heading" className="text-3xl md:text-4xl font-bold font-display mb-4" style={{ color: C.darkText }}>
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

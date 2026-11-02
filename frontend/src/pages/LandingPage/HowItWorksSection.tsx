import React from "react";
import { FileText, Star, MessageSquare, Scale } from "lucide-react";
import { C } from "./tokens";

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
    <h3 className="text-sm font-semibold font-display mb-1" style={{ color: C.darkText }}>
      {title}
    </h3>
    <p className="text-xs leading-relaxed max-w-[160px]" style={{ color: C.mutedText }}>
      {body}
    </p>
  </div>
);

export const HowItWorksSection: React.FC = () => (
  <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-24" style={{ backgroundColor: C.nearWhite }}>
    <div className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-14">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.midTeal }}>
          Workflow
        </p>
        <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold font-display mb-4" style={{ color: C.darkText }}>
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
